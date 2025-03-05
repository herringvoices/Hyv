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
                    .ThenInclude(hr => hr.Hangout) // Make sure to include the Hangout
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
                    // Add user as a HangoutGuest
                    var hangoutGuest = new HangoutGuest
                    {
                        HangoutId = hangout.Id, // This is the correct Hangout.Id
                        UserId = userId,
                        JoinedAt = DateTime.UtcNow,
                    };

                    await _context.HangoutGuests.AddAsync(hangoutGuest);

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
                // Get the hangout with its request info to identify the sender
                var hangout = await _context
                    .Hangouts.Include(h => h.HangoutRequests)
                    .FirstOrDefaultAsync(h => h.Id == hangoutId);

                if (hangout == null)
                {
                    throw new KeyNotFoundException($"Hangout with ID {hangoutId} not found");
                }

                // Get the sender ID from the HangoutRequest
                string senderId = null;
                var hangoutRequest = hangout.HangoutRequests.FirstOrDefault();
                if (hangoutRequest != null)
                {
                    senderId = hangoutRequest.SenderId;
                }

                // Process user's conflicting windows
                await HandleConflictingWindows(hangout, userId);

                // Process sender's conflicting windows (if sender is not the current user)
                if (senderId != null && senderId != userId)
                {
                    await HandleConflictingWindows(hangout, senderId);
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
                        // Add current user as participant if not already
                        if (!existingWindow.WindowParticipants.Any(wp => wp.UserId == userId))
                        {
                            existingWindow.WindowParticipants.Add(
                                new WindowParticipant { UserId = userId }
                            );
                        }

                        // Add sender as participant if not already (and if sender is not the current user)
                        if (
                            senderId != null
                            && senderId != userId
                            && !existingWindow.WindowParticipants.Any(wp => wp.UserId == senderId)
                        )
                        {
                            existingWindow.WindowParticipants.Add(
                                new WindowParticipant { UserId = senderId }
                            );
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
                            WindowParticipants = new List<WindowParticipant>
                            {
                                new WindowParticipant { UserId = userId },
                            },
                        };

                        // Add sender as participant (if sender is not the current user)
                        if (senderId != null && senderId != userId)
                        {
                            newWindow.WindowParticipants.Add(
                                new WindowParticipant { UserId = senderId }
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
    }
}
