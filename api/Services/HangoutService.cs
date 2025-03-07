using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IHangoutService
    {
        Task<HangoutRequestDto> CreateHangoutRequestAsync(HangoutRequestCreateDto createDto);
        Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestRecipientsAsync();
        Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestsForUserAsync(string userId);
        Task<bool> HangoutRejectAsync(int hangoutRequestRecipientId, string userId);
        Task<HangoutRequestRecipientDto> HangoutAcceptAsync(
            int hangoutRequestRecipientId,
            string userId
        );
        Task<WindowDto> HangoutAcceptCleanup(int hangoutId, string userId, bool createNewWindow);

        Task<bool> LeaveHangoutAsync(int hangoutId, string userId);

        // Add new update method
        Task<HangoutDto> UpdateHangoutAsync(int hangoutId, HangoutDto hangoutDto, string userId);

        // Add this new method
        Task<IEnumerable<HangoutDto>> GetHangoutsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        );

        // Add new delete method
        Task<bool> DeleteHangoutAsync(int hangoutId, string userId);

        // Get past hangouts for a specific user
        Task<IEnumerable<HangoutDto>> GetPastHangoutsForUserAsync(string userId);

        // Get upcoming hangouts for a specific user
        Task<IEnumerable<HangoutDto>> GetUpcomingHangoutsForUserAsync(string userId);

        // Get shared hangouts between logged in user and target user
        Task<IEnumerable<HangoutDto>> GetSharedHangoutsWithUserAsync(
            string targetUserId,
            string currentUserId,
            bool pastOnly = false,
            bool upcomingOnly = false
        );

        Task<bool> ProcessHangoutRequestResponseAsync(
            int requestRecipientId,
            bool accepted,
            bool createWindow
        );

        Task SynchronizeWindowParticipantsWithHangoutGuests(int hangoutId);

        // Add these methods to the IHangoutService interface
        Task CreateJoinRequestAsync(int hangoutId, string userId);
        Task<int> AcceptJoinRequestAsync(int joinRequestId, string userId);
        Task RejectJoinRequestAsync(int joinRequestId, string userId);
        Task<string> GetJoinRequestUserIdAsync(int joinRequestId);

        Task<List<JoinRequestDto>> GetPendingJoinRequestsAsync(string userId);
    }

    public class HangoutService : IHangoutService
    {
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HangoutService(
            HyvDbContext context,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor
        )
        {
            _context = context;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<HangoutRequestDto> CreateHangoutRequestAsync(
            HangoutRequestCreateDto createDto
        )
        {
            // First create a Hangout entity
            var hangout = new Hangout
            {
                Title = createDto.Title,
                Description = createDto.Description,
                ConfirmedStart = createDto.ProposedStart ?? DateTime.UtcNow,
                ConfirmedEnd = createDto.ProposedEnd ?? DateTime.UtcNow.AddHours(1),
                Active = false,
            };

            // Add the hangout to the context
            await _context.Hangouts.AddAsync(hangout);
            await _context.SaveChangesAsync();

            // Now create the hangout request entity from the DTO
            var hangoutRequest = _mapper.Map<HangoutRequest>(createDto);

            // Associate with the newly created hangout
            hangoutRequest.HangoutId = hangout.Id;

            // Set creation date to now if not provided
            if (hangoutRequest.CreatedAt == default)
            {
                hangoutRequest.CreatedAt = DateTime.UtcNow;
            }

            // Add the new hangout request to the context
            await _context.HangoutRequests.AddAsync(hangoutRequest);

            // Save to get the generated ID
            await _context.SaveChangesAsync();

            // Add sender as a HangoutGuest
            var senderGuest = new HangoutGuest
            {
                HangoutId = hangout.Id,
                UserId = createDto.SenderId,
                JoinedAt = DateTime.UtcNow,
            };
            await _context.HangoutGuests.AddAsync(senderGuest);

            // Create a recipient entry for each user ID
            if (createDto.RecipientUserIds?.Any() == true)
            {
                var recipients = createDto.RecipientUserIds.Select(
                    userId => new HangoutRequestRecipient
                    {
                        HangoutRequestId = hangoutRequest.Id,
                        UserId = userId,
                        RecipientStatus = Status.Pending, // Default status
                        InvitedAt = DateTime.UtcNow,
                    }
                );

                await _context.HangoutRequestRecipients.AddRangeAsync(recipients);
                await _context.SaveChangesAsync();
            }

            // Fetch the complete hangout request with recipients
            var completeHangoutRequest = await _context
                .HangoutRequests.Include(hr => hr.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .Include(hr => hr.Hangout)
                .Include(hr => hr.Sender)
                .FirstOrDefaultAsync(hr => hr.Id == hangoutRequest.Id);

            // Map to DTO and return
            return _mapper.Map<HangoutRequestDto>(completeHangoutRequest);
        }

        public async Task<
            List<HangoutRequestRecipientDto>
        > GetPendingHangoutRequestRecipientsAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
            {
                return new List<HangoutRequestRecipientDto>();
            }

            // Get all pending requests where the current user is a recipient
            var pendingRequests = await _context
                .HangoutRequestRecipients.Where(rr =>
                    rr.UserId == currentUserId && rr.RecipientStatus == Status.Pending
                )
                // Include the HangoutRequest with Sender info
                .Include(rr => rr.HangoutRequest)
                .ThenInclude(hr => hr.Sender)
                // Include the User info of the recipient
                .Include(rr => rr.User)
                // Include all other recipients of the same HangoutRequest
                .Include(rr => rr.HangoutRequest.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .ToListAsync();

            return _mapper.Map<List<HangoutRequestRecipientDto>>(pendingRequests);
        }

        public async Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestsForUserAsync(
            string userId
        )
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(userId))
            {
                return new List<HangoutRequestRecipientDto>();
            }

            // Get all pending requests where:
            // - The specified user is the recipient
            // - The current user is the sender
            // - The status is pending
            var pendingRequests = await _context
                .HangoutRequestRecipients.Where(rr =>
                    rr.UserId == userId
                    && rr.RecipientStatus == Status.Pending
                    && rr.HangoutRequest.SenderId == currentUserId
                )
                // Include the HangoutRequest with Sender info
                .Include(rr => rr.HangoutRequest)
                .ThenInclude(hr => hr.Sender)
                // Include the User info of the recipient
                .Include(rr => rr.User)
                // Include all other recipients of the same HangoutRequest
                .Include(rr => rr.HangoutRequest.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .ToListAsync();

            return _mapper.Map<List<HangoutRequestRecipientDto>>(pendingRequests);
        }

        public async Task<bool> HangoutRejectAsync(int hangoutRequestRecipientId, string userId)
        {
            // Verify recipient exists and belongs to the user
            var recipient = await _context.HangoutRequestRecipients.FirstOrDefaultAsync(r =>
                r.Id == hangoutRequestRecipientId && r.UserId == userId
            );

            if (recipient == null)
            {
                throw new KeyNotFoundException(
                    $"Hangout request recipient with ID {hangoutRequestRecipientId} not found or doesn't belong to the current user"
                );
            }

            // Delete the recipient entry
            _context.HangoutRequestRecipients.Remove(recipient);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<HangoutRequestRecipientDto> HangoutAcceptAsync(
            int hangoutRequestRecipientId,
            string userId
        )
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Find recipient and verify it belongs to the user
                var recipient = await _context
                    .HangoutRequestRecipients.Include(r => r.HangoutRequest)
                    .ThenInclude(hr => hr.Hangout)
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r =>
                        r.Id == hangoutRequestRecipientId && r.UserId == userId
                    );

                if (recipient == null)
                {
                    throw new KeyNotFoundException(
                        $"Hangout request recipient with ID {hangoutRequestRecipientId} not found or doesn't belong to the current user"
                    );
                }

                // Update status to Accepted
                recipient.RecipientStatus = Status.Accepted;

                // Get the associated hangout using proper navigation
                var hangout = recipient.HangoutRequest?.Hangout;

                if (hangout != null)
                {
                    // Check if the user is already a guest to prevent duplicates
                    bool isAlreadyGuest = await _context.HangoutGuests.AnyAsync(hg =>
                        hg.HangoutId == hangout.Id && hg.UserId == userId
                    );

                    if (!isAlreadyGuest)
                    {
                        // Add user as a HangoutGuest
                        var hangoutGuest = new HangoutGuest
                        {
                            HangoutId = hangout.Id,
                            UserId = userId,
                            JoinedAt = DateTime.UtcNow,
                        };

                        await _context.HangoutGuests.AddAsync(hangoutGuest);
                    }

                    // Update hangout active status
                    hangout.Active = true;
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Return the updated recipient
                return _mapper.Map<HangoutRequestRecipientDto>(recipient);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<WindowDto> HangoutAcceptCleanup(
            int hangoutId,
            string userId,
            bool createNewWindow
        )
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get the hangout with all its guests
                var hangout = await _context
                    .Hangouts.Include(h => h.HangoutRequests)
                    .Include(h => h.HangoutGuests)
                    .ThenInclude(hg => hg.User)
                    .FirstOrDefaultAsync(h => h.Id == hangoutId);

                if (hangout == null)
                {
                    throw new KeyNotFoundException($"Hangout with ID {hangoutId} not found");
                }

                // Get all hangout guests' user IDs
                var guestUserIds = hangout.HangoutGuests.Select(hg => hg.UserId).ToList();

                // Process accepting user's conflicting windows
                await HandleConflictingWindows(hangout, userId);

                // Process all guests' conflicting windows
                foreach (var guestId in guestUserIds.Where(id => id != userId))
                {
                    await HandleConflictingWindows(hangout, guestId);
                }

                // Create new window if requested
                WindowDto newWindowDto = null;

                if (createNewWindow)
                {
                    // Check if there's already a window associated with this hangout
                    var existingWindow = await _context
                        .Windows.Include(w => w.WindowParticipants)
                        .FirstOrDefaultAsync(w => w.HangoutId == hangoutId);

                    if (existingWindow != null)
                    {
                        // Synchronize window participants with hangout guests
                        // First, remove any participants who are not hangout guests
                        var participantsToRemove = existingWindow
                            .WindowParticipants.Where(wp => !guestUserIds.Contains(wp.UserId))
                            .ToList();

                        foreach (var participant in participantsToRemove)
                        {
                            _context.WindowParticipants.Remove(participant);
                        }

                        // Then add any guests who are not window participants
                        foreach (var guestId in guestUserIds)
                        {
                            if (!existingWindow.WindowParticipants.Any(wp => wp.UserId == guestId))
                            {
                                existingWindow.WindowParticipants.Add(
                                    new WindowParticipant { UserId = guestId }
                                );
                            }
                        }

                        await _context.SaveChangesAsync();

                        // Reload with relationships for mapping
                        var updatedWindow = await _context
                            .Windows.Include(w => w.User)
                            .Include(w => w.Hangout)
                            .Include(w => w.WindowParticipants)
                            .ThenInclude(wp => wp.User)
                            .FirstOrDefaultAsync(w => w.Id == existingWindow.Id);

                        newWindowDto = _mapper.Map<WindowDto>(updatedWindow);
                    }
                    else
                    {
                        // Create a new window linked to this hangout
                        var newWindow = new Window
                        {
                            Title = hangout.Title,
                            Start = hangout.ConfirmedStart,
                            End = hangout.ConfirmedEnd,
                            UserId = userId,
                            Active = true,
                            HangoutId = hangoutId,
                            PreferredActivity = hangout.Description,
                            DaysOfNoticeNeeded = 0,
                            WindowParticipants = new List<WindowParticipant>(),
                        };

                        // Add all hangout guests as window participants
                        foreach (var guestId in guestUserIds)
                        {
                            newWindow.WindowParticipants.Add(
                                new WindowParticipant { UserId = guestId }
                            );
                        }

                        _context.Windows.Add(newWindow);
                        await _context.SaveChangesAsync();

                        // Reload with relationships for mapping
                        var createdWindow = await _context
                            .Windows.Include(w => w.User)
                            .Include(w => w.Hangout)
                            .Include(w => w.WindowParticipants)
                            .ThenInclude(wp => wp.User)
                            .FirstOrDefaultAsync(w => w.Id == newWindow.Id);

                        newWindowDto = _mapper.Map<WindowDto>(createdWindow);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return newWindowDto;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> LeaveHangoutAsync(int hangoutId, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Find the hangout guest entry for this user
                var hangoutGuest = await _context.HangoutGuests.FirstOrDefaultAsync(hg =>
                    hg.HangoutId == hangoutId && hg.UserId == userId
                );

                if (hangoutGuest == null)
                {
                    throw new KeyNotFoundException(
                        $"User is not a guest of hangout with ID {hangoutId}"
                    );
                }

                // Remove the hangout guest entry
                _context.HangoutGuests.Remove(hangoutGuest);

                // Check if there are any remaining guests
                var remainingGuestsCount = await _context
                    .HangoutGuests.Where(hg => hg.HangoutId == hangoutId && hg.UserId != userId)
                    .CountAsync();

                // Also check if there's a window participant entry for this hangout
                var hangoutWindow = await _context
                    .Windows.Include(w => w.WindowParticipants)
                    .FirstOrDefaultAsync(w => w.HangoutId == hangoutId);

                if (hangoutWindow != null)
                {
                    // Remove this user from window participants
                    var participantEntry = hangoutWindow.WindowParticipants.FirstOrDefault(wp =>
                        wp.UserId == userId
                    );

                    if (participantEntry != null)
                    {
                        _context.WindowParticipants.Remove(participantEntry);
                    }

                    // If there are no guests left, or only one guest remaining, remove the window entirely
                    if (remainingGuestsCount <= 1)
                    {
                        _context.Windows.Remove(hangoutWindow);
                    }
                }

                // If this was the last guest, mark the hangout as inactive
                if (remainingGuestsCount == 0)
                {
                    var hangout = await _context.Hangouts.FindAsync(hangoutId);
                    if (hangout != null)
                    {
                        hangout.Active = false;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // Helper method to handle conflicting windows for a user
        private async Task HandleConflictingWindows(Hangout hangout, string userId)
        {
            // Find user's windows during the hangout timeframe
            var userWindows = await _context
                .Windows.Include(w => w.WindowParticipants)
                .Where(w =>
                    w.Start < hangout.ConfirmedEnd
                    && w.End > hangout.ConfirmedStart
                    && w.WindowParticipants.Any(wp => wp.UserId == userId)
                )
                .ToListAsync();

            foreach (var window in userWindows)
            {
                // Check if the window has other participants
                var hasOtherParticipants = window.WindowParticipants.Any(wp => wp.UserId != userId);

                if (hasOtherParticipants)
                {
                    // Remove only this user's participant entry
                    var userParticipant = window.WindowParticipants.First(wp =>
                        wp.UserId == userId
                    );
                    _context.WindowParticipants.Remove(userParticipant);
                }
                else
                {
                    // If this is the only participant, remove the entire window
                    _context.Windows.Remove(window);
                }
            }
        }

        public async Task<HangoutDto> UpdateHangoutAsync(
            int hangoutId,
            HangoutDto hangoutDto,
            string userId
        )
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Find the hangout
                var hangout = await _context
                    .Hangouts.Include(h => h.HangoutRequests)
                    .Include(h => h.HangoutGuests)
                    .FirstOrDefaultAsync(h => h.Id == hangoutId);

                if (hangout == null)
                {
                    throw new KeyNotFoundException($"Hangout with ID {hangoutId} not found");
                }

                // Check if user is authorized - either the creator or a guest
                var isCreator = hangout.HangoutRequests.Any(hr => hr.SenderId == userId);
                var isGuest = hangout.HangoutGuests.Any(hg => hg.UserId == userId);

                if (!isCreator && !isGuest)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to update this hangout"
                    );
                }

                // Update properties
                hangout.Title = hangoutDto.Title ?? hangout.Title;
                hangout.Description = hangoutDto.ExtendedProps?.Description ?? hangout.Description;
                hangout.ConfirmedStart = hangoutDto.Start;
                hangout.ConfirmedEnd = hangoutDto.End;
                hangout.Active = hangoutDto.ExtendedProps?.Active ?? hangout.Active;

                // Update any windows associated with this hangout
                var associatedWindows = await _context
                    .Windows.Where(w => w.HangoutId == hangoutId)
                    .ToListAsync();

                foreach (var window in associatedWindows)
                {
                    window.Start = hangout.ConfirmedStart;
                    window.End = hangout.ConfirmedEnd;
                    window.Title = hangout.Title;
                    window.PreferredActivity = hangout.Description;
                    window.UpdatedAt = DateTime.UtcNow;
                }

                // Synchronize window participants with hangout guests
                await SynchronizeWindowParticipantsWithHangoutGuests(hangoutId);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Return the updated hangout
                return _mapper.Map<HangoutDto>(hangout);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<HangoutDto>> GetHangoutsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        )
        {
            // Find all hangouts in the date range where the user is a guest
            var hangouts = await _context
                .Hangouts.Where(h =>
                    h.ConfirmedStart >= start
                    && h.ConfirmedEnd <= end
                    && h.Active
                    && h.HangoutGuests.Any(hg => hg.UserId == userId)
                )
                .Include(h => h.HangoutGuests)
                .ThenInclude(hg => hg.User)
                .ToListAsync();

            // Map to DTOs
            return _mapper.Map<IEnumerable<HangoutDto>>(hangouts);
        }

        public async Task SynchronizeWindowParticipantsWithHangoutGuests(int hangoutId)
        {
            // Get all hangout guests
            var hangoutGuests = await _context
                .HangoutGuests.Where(hg => hg.HangoutId == hangoutId)
                .ToListAsync();

            var guestUserIds = hangoutGuests.Select(hg => hg.UserId).ToList();

            // Find the associated window
            var window = await _context
                .Windows.Include(w => w.WindowParticipants)
                .FirstOrDefaultAsync(w => w.HangoutId == hangoutId);

            if (window != null)
            {
                // Remove window participants who are not hangout guests
                var participantsToRemove = window
                    .WindowParticipants.Where(wp => !guestUserIds.Contains(wp.UserId))
                    .ToList();

                foreach (var participant in participantsToRemove)
                {
                    _context.WindowParticipants.Remove(participant);
                }

                // Add hangout guests who are not already window participants
                foreach (var guestId in guestUserIds)
                {
                    if (!window.WindowParticipants.Any(wp => wp.UserId == guestId))
                    {
                        window.WindowParticipants.Add(
                            new WindowParticipant { WindowId = window.Id, UserId = guestId }
                        );
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> DeleteHangoutAsync(int hangoutId, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Find the hangout with all related entities
                var hangout = await _context
                    .Hangouts.Include(h => h.HangoutGuests)
                    .Include(h => h.HangoutRequests)
                    .ThenInclude(hr => hr.RequestRecipients)
                    .FirstOrDefaultAsync(h => h.Id == hangoutId);

                if (hangout == null)
                {
                    throw new KeyNotFoundException($"Hangout with ID {hangoutId} not found");
                }

                // Check if the current user is a guest of the hangout
                var isGuest = hangout.HangoutGuests.Any(hg => hg.UserId == userId);

                if (!isGuest)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to delete this hangout"
                    );
                }

                // Find any windows associated with this hangout
                var associatedWindows = await _context
                    .Windows.Include(w => w.WindowParticipants)
                    .Include(w => w.WindowVisibilities)
                    .Where(w => w.HangoutId == hangoutId)
                    .ToListAsync();

                // Delete related Window entities
                foreach (var window in associatedWindows)
                {
                    // Delete window participants
                    if (window.WindowParticipants?.Any() == true)
                    {
                        _context.WindowParticipants.RemoveRange(window.WindowParticipants);
                    }

                    // Delete window visibilities
                    if (window.WindowVisibilities?.Any() == true)
                    {
                        _context.WindowVisibilities.RemoveRange(window.WindowVisibilities);
                    }

                    // Delete the window
                    _context.Windows.Remove(window);
                }

                // Delete all hangout request recipients
                foreach (var request in hangout.HangoutRequests)
                {
                    if (request.RequestRecipients?.Any() == true)
                    {
                        _context.HangoutRequestRecipients.RemoveRange(request.RequestRecipients);
                    }
                }

                // Delete all hangout requests
                if (hangout.HangoutRequests?.Any() == true)
                {
                    _context.HangoutRequests.RemoveRange(hangout.HangoutRequests);
                }

                // Delete all hangout guests
                if (hangout.HangoutGuests?.Any() == true)
                {
                    _context.HangoutGuests.RemoveRange(hangout.HangoutGuests);
                }

                // Finally, delete the hangout
                _context.Hangouts.Remove(hangout);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch (Exception ex)
                when (ex is not KeyNotFoundException && ex is not UnauthorizedAccessException)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to delete hangout: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<HangoutDto>> GetPastHangoutsForUserAsync(string userId)
        {
            var now = DateTime.UtcNow;

            var hangouts = await _context
                .Hangouts.Where(h =>
                    h.ConfirmedEnd < now && h.HangoutGuests.Any(hg => hg.UserId == userId)
                )
                .Include(h => h.HangoutGuests)
                .ThenInclude(hg => hg.User)
                .OrderByDescending(h => h.ConfirmedEnd)
                .ToListAsync();

            return _mapper.Map<IEnumerable<HangoutDto>>(hangouts);
        }

        public async Task<IEnumerable<HangoutDto>> GetUpcomingHangoutsForUserAsync(string userId)
        {
            var now = DateTime.UtcNow;

            var hangouts = await _context
                .Hangouts.Where(h =>
                    h.ConfirmedStart > now
                    && h.Active
                    && h.HangoutGuests.Any(hg => hg.UserId == userId)
                )
                .Include(h => h.HangoutGuests)
                .ThenInclude(hg => hg.User)
                .OrderBy(h => h.ConfirmedStart)
                .ToListAsync();

            return _mapper.Map<IEnumerable<HangoutDto>>(hangouts);
        }

        public async Task<IEnumerable<HangoutDto>> GetSharedHangoutsWithUserAsync(
            string targetUserId,
            string currentUserId,
            bool pastOnly = false,
            bool upcomingOnly = false
        )
        {
            var now = DateTime.UtcNow;

            // Start with base query for hangouts where both users are guests
            var query = _context.Hangouts.Where(h =>
                h.HangoutGuests.Any(hg => hg.UserId == targetUserId)
                && h.HangoutGuests.Any(hg => hg.UserId == currentUserId)
            );

            // Apply time filter if specified
            if (pastOnly)
            {
                query = query.Where(h => h.ConfirmedEnd < now);
            }
            else if (upcomingOnly)
            {
                query = query.Where(h => h.ConfirmedStart > now && h.Active);
            }

            // Include related data and execute query
            var hangouts = await query
                .Include(h => h.HangoutGuests)
                .ThenInclude(hg => hg.User)
                .OrderByDescending(h => pastOnly ? h.ConfirmedEnd : h.ConfirmedStart)
                .ToListAsync();

            return _mapper.Map<IEnumerable<HangoutDto>>(hangouts);
        }

        public async Task<bool> ProcessHangoutRequestResponseAsync(
            int requestRecipientId,
            bool accepted,
            bool createWindow
        )
        {
            // Find the request recipient
            var recipient = await _context
                .HangoutRequestRecipients.Include(r => r.HangoutRequest)
                .ThenInclude(hr => hr.Hangout)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestRecipientId);

            if (recipient == null)
            {
                throw new KeyNotFoundException(
                    $"Hangout request recipient with ID {requestRecipientId} not found"
                );
            }

            // Get current user ID
            var currentUserId = _httpContextAccessor.HttpContext.User.FindFirst("sub")?.Value;

            // Verify the recipient is the current user
            if (recipient.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to respond to this request"
                );
            }

            // Update the recipient status based on acceptance
            recipient.RecipientStatus = accepted ? Status.Accepted : Status.Rejected;

            // If accepted and hangout exists, add user as a guest
            if (accepted && recipient.HangoutRequest.Hangout != null)
            {
                var hangout = recipient.HangoutRequest.Hangout;

                // Check if the user is already a guest
                var existingGuest = await _context.HangoutGuests.FirstOrDefaultAsync(g =>
                    g.HangoutId == hangout.Id && g.UserId == currentUserId
                );

                if (existingGuest == null)
                {
                    // Add user as a guest
                    _context.HangoutGuests.Add(
                        new HangoutGuest { HangoutId = hangout.Id, UserId = currentUserId }
                    );
                }

                // Handle window creation if requested
                if (createWindow)
                {
                    await CreateWindowForHangout(hangout, currentUserId);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task CreateWindowForHangout(Hangout hangout, string userId)
        {
            // Check if a window for this hangout and user already exists
            var existingWindow = await _context.Windows.FirstOrDefaultAsync(w =>
                w.HangoutId == hangout.Id && w.UserId == userId
            );

            if (existingWindow != null)
            {
                // Window already exists, no need to create another one
                return;
            }

            // Create a new window linked to this hangout
            var window = new Window
            {
                Title = hangout.Title,
                Start = hangout.ConfirmedStart,
                End = hangout.ConfirmedEnd,
                UserId = userId,
                HangoutId = hangout.Id,
                Active = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            // Add window participants (all hangout guests)
            window.WindowParticipants = new List<WindowParticipant>();

            var hangoutGuests = await _context
                .HangoutGuests.Where(g => g.HangoutId == hangout.Id)
                .ToListAsync();

            foreach (var guest in hangoutGuests)
            {
                window.WindowParticipants.Add(new WindowParticipant { UserId = guest.UserId });
            }

            _context.Windows.Add(window);
            await _context.SaveChangesAsync();
        }

        public async Task CreateJoinRequestAsync(int hangoutId, string userId)
        {
            // Check if hangout exists
            var hangout = await _context
                .Hangouts.Include(h => h.HangoutGuests)
                .FirstOrDefaultAsync(h => h.Id == hangoutId);

            if (hangout == null)
            {
                throw new KeyNotFoundException($"Hangout with ID {hangoutId} not found");
            }

            // Check if user is already a guest
            if (hangout.HangoutGuests.Any(hg => hg.UserId == userId))
            {
                throw new InvalidOperationException("You are already a guest of this hangout");
            }

            // Check if there's already a pending request
            bool hasExistingRequest = await _context.JoinRequests.AnyAsync(jr =>
                jr.HangoutId == hangoutId && jr.UserId == userId && jr.Status == Status.Pending
            );

            if (hasExistingRequest)
            {
                throw new InvalidOperationException(
                    "You already have a pending join request for this hangout"
                );
            }

            // Create the join request
            var joinRequest = new JoinRequest
            {
                HangoutId = hangoutId,
                UserId = userId,
                Status = Status.Pending,
            };

            await _context.JoinRequests.AddAsync(joinRequest);
            await _context.SaveChangesAsync();
        }

        public async Task<int> AcceptJoinRequestAsync(int joinRequestId, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get the join request with related entities
                var joinRequest = await _context
                    .JoinRequests.Include(jr => jr.Hangout)
                    .ThenInclude(h => h.HangoutGuests)
                    .FirstOrDefaultAsync(jr => jr.Id == joinRequestId);

                if (joinRequest == null)
                {
                    throw new KeyNotFoundException(
                        $"Join request with ID {joinRequestId} not found"
                    );
                }

                // Check if the current user is authorized (must be a hangout guest)
                var isGuest = joinRequest.Hangout.HangoutGuests.Any(hg => hg.UserId == userId);
                if (!isGuest)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to accept this join request"
                    );
                }

                // Update status to Accepted
                joinRequest.Status = Status.Accepted;

                // Add the requester as a hangout guest
                var hangoutGuest = new HangoutGuest
                {
                    HangoutId = joinRequest.HangoutId,
                    UserId = joinRequest.UserId,
                    JoinedAt = DateTime.UtcNow,
                };

                await _context.HangoutGuests.AddAsync(hangoutGuest);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return joinRequest.HangoutId;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task RejectJoinRequestAsync(int joinRequestId, string userId)
        {
            // Get the join request with related entities
            var joinRequest = await _context
                .JoinRequests.Include(jr => jr.Hangout)
                .ThenInclude(h => h.HangoutGuests)
                .FirstOrDefaultAsync(jr => jr.Id == joinRequestId);

            if (joinRequest == null)
            {
                throw new KeyNotFoundException($"Join request with ID {joinRequestId} not found");
            }

            // Check if the current user is authorized (must be a hangout guest)
            var isGuest = joinRequest.Hangout.HangoutGuests.Any(hg => hg.UserId == userId);
            if (!isGuest)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to reject this join request"
                );
            }

            // Update status to Rejected
            joinRequest.Status = Status.Rejected;
            await _context.SaveChangesAsync();
        }

        public async Task<string> GetJoinRequestUserIdAsync(int joinRequestId)
        {
            var joinRequest = await _context.JoinRequests.FirstOrDefaultAsync(jr =>
                jr.Id == joinRequestId
            );

            if (joinRequest == null)
            {
                throw new KeyNotFoundException($"Join request with ID {joinRequestId} not found");
            }

            return joinRequest.UserId;
        }

        public async Task<List<JoinRequestDto>> GetPendingJoinRequestsAsync(string userId)
        {
            // Get all hangouts where the current user is a member
            var userHangouts = await _context
                .HangoutGuests.Where(hg => hg.UserId == userId)
                .Select(hg => hg.HangoutId)
                .ToListAsync();

            // Get all pending join requests for those hangouts
            var pendingRequests = await _context
                .JoinRequests.Where(jr =>
                    userHangouts.Contains(jr.HangoutId) && jr.Status == Status.Pending
                )
                .Include(jr => jr.User)
                .Include(jr => jr.Hangout)
                .ToListAsync();

            return _mapper.Map<List<JoinRequestDto>>(pendingRequests);
        }
    }
}
