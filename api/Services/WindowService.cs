using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http; // Add this
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    // Interface for dependency injection - moved back into this file
    public interface IWindowService
    {
        Task<WindowDto> CreateWindowAsync(WindowDto windowDto);

        Task<IEnumerable<WindowDto>> GetWindowsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        );

        Task<IEnumerable<WindowDto>> GetHiveWindowsAsync(
            string userId,
            DateTime? start = null,
            DateTime? end = null,
            int? categoryId = null
        );

        // Add update method to interface
        Task<WindowDto> UpdateWindowAsync(int windowId, WindowDto windowDto, string userId);

        // Add delete method to interface
        Task<bool> DeleteWindowAsync(int windowId, string userId);
    }

    public class WindowService : IWindowService
    {
        private readonly HyvDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor; // Add this

        public WindowService(
            HyvDbContext dbContext,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor
        ) // Add parameter
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor; // Store the dependency
        }

        public async Task<WindowDto> CreateWindowAsync(WindowDto windowDto)
        {
            // Map from DTO to entity
            var window = _mapper.Map<Window>(windowDto);

            // Before creating the window, check for overlaps with existing windows
            // where the user is a participant
            var userId = window.UserId;
            var overlappingWindows = await _dbContext
                .Windows.Include(w => w.WindowParticipants)
                .Where(w =>
                    w.WindowParticipants.Any(p => p.UserId == userId)
                    && window.Start < w.End
                    && window.End > w.Start
                )
                .ToListAsync();

            if (overlappingWindows.Any())
            {
                // If overlapping windows exist, throw an exception
                throw new InvalidOperationException(
                    "Cannot create window: Time slot overlaps with another window where you are a participant."
                );
            }

            // Ensure the current user is added as a participant if they're not already
            if (window.WindowParticipants == null)
            {
                window.WindowParticipants = new List<WindowParticipant>();
            }

            // Add the window creator as a participant if not already included
            if (!window.WindowParticipants.Any(p => p.UserId == window.UserId))
            {
                window.WindowParticipants.Add(new WindowParticipant { UserId = window.UserId });
            }

            // Add participants from the DTO
            if (windowDto.ExtendedProps?.Participants != null)
            {
                foreach (var participant in windowDto.ExtendedProps.Participants)
                {
                    if (
                        participant.UserId != null
                        && !window.WindowParticipants.Any(p => p.UserId == participant.UserId)
                    )
                    {
                        window.WindowParticipants.Add(
                            new WindowParticipant { UserId = participant.UserId }
                        );
                    }
                }
            }

            // Initialize WindowVisibilities collection if it doesn't exist
            if (window.WindowVisibilities == null)
            {
                window.WindowVisibilities = new List<WindowVisibility>();
            }

            // Add visibilities from the DTO
            if (windowDto.ExtendedProps?.Visibilities != null)
            {
                foreach (var visibility in windowDto.ExtendedProps.Visibilities)
                {
                    if (
                        visibility.CategoryId > 0
                        && !window.WindowVisibilities.Any(wv =>
                            wv.CategoryId == visibility.CategoryId
                        )
                    )
                    {
                        window.WindowVisibilities.Add(
                            new WindowVisibility { CategoryId = visibility.CategoryId }
                        );
                    }
                }
            }

            // Add the window to the database
            _dbContext.Windows.Add(window);
            await _dbContext.SaveChangesAsync();

            // Reload the window with all its relationships for proper mapping
            var createdWindow = await _dbContext
                .Windows.Include(w => w.User)
                .Include(w => w.Hangout)
                .Include(w => w.WindowParticipants)
                .ThenInclude(wp => wp.User)
                .Include(w => w.WindowVisibilities)
                .ThenInclude(wv => wv.Category)
                .FirstOrDefaultAsync(w => w.Id == window.Id);

            // Map back to DTO with the generated ID and included relationships
            return _mapper.Map<WindowDto>(createdWindow);
        }

        public async Task<IEnumerable<WindowDto>> GetWindowsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        )
        {
            var now = DateTime.UtcNow;

            // Find windows that should be deleted (but only those owned by the user):
            // 1. Windows that have already ended (End time is before current time)
            // 2. Windows where the time until start is less than or equal to DaysOfNoticeNeeded
            var expiredWindows = await _dbContext
                .Windows.Where(w =>
                    // Only delete windows that the user owns
                    w.UserId == userId
                    && (
                        // Either the window has already ended
                        w.End < now
                        ||
                        // OR not enough notice time is left for the window
                        (
                            w.Start > now // Only future windows
                            && (w.Start.Date - now.Date).Days <= w.DaysOfNoticeNeeded
                        )
                    )
                )
                .ToListAsync();

            if (expiredWindows.Any())
            {
                _dbContext.Windows.RemoveRange(expiredWindows);
                await _dbContext.SaveChangesAsync();
            }

            // Now query all windows within the date range where:
            // 1. The user is a participant
            // 2. The window is not linked to a hangout
            var windows = await _dbContext
                .Windows.Where(w =>
                    w.Start >= start
                    && w.End <= end
                    && w.WindowParticipants.Any(p => p.UserId == userId) // User is a participant
                    && (w.HangoutId == null || w.HangoutId == 0) // Not linked to a hangout
                )
                .Include(w => w.User)
                .Include(w => w.Hangout)
                .Include(w => w.WindowParticipants)
                .ThenInclude(wp => wp.User)
                .Include(w => w.WindowVisibilities)
                .ThenInclude(wv => wv.Category)
                .ToListAsync();

            // Map to DTOs
            return _mapper.Map<IEnumerable<WindowDto>>(windows);
        }

        public async Task<IEnumerable<WindowDto>> GetHiveWindowsAsync(
            string userId,
            DateTime? start = null,
            DateTime? end = null,
            int? categoryId = null
        )
        {
            // First, get the categories that the current user is a member of
            var userCategoryIds = await _dbContext
                .CategoryMembers.Where(cm => cm.FriendId == userId)
                .Select(cm => cm.CategoryId)
                .ToListAsync();

            // Start building our query with the basic category visibility filter
            var query = _dbContext
                .Windows.Include(w => w.User)
                .Include(w => w.Hangout)
                .Include(w => w.WindowParticipants)
                .ThenInclude(wp => wp.User)
                .Include(w => w.WindowVisibilities)
                .ThenInclude(wv => wv.Category)
                .Where(w =>
                    // Window is active
                    w.Active
                    &&
                    // AND either has no visibility restrictions
                    (
                        !w.WindowVisibilities.Any()
                        ||
                        // OR user is a member of at least one of the window's visible categories
                        w.WindowVisibilities.Any(wv => userCategoryIds.Contains(wv.CategoryId))
                    )
                    &&
                    // AND the logged-in user is NOT a participant
                    !w.WindowParticipants.Any(wp => wp.UserId == userId)
                );

            // If date range parameters are provided, apply date filtering
            if (start.HasValue && end.HasValue)
            {
                // Get user's own windows within the date range
                var userWindowsInRange = await _dbContext
                    .Windows.Where(w =>
                        w.WindowParticipants.Any(p => p.UserId == userId)
                        && w.Start >= start.Value
                        && w.End <= end.Value
                        && (w.HangoutId == null || w.HangoutId == 0)
                    )
                    .ToListAsync();

                if (!userWindowsInRange.Any())
                {
                    // User has no windows in this range, so no overlaps possible
                    return new List<WindowDto>();
                }

                // Get the user's friends
                var friendUserIds = await _dbContext
                    .Friendships.Where(f =>
                        (f.SenderId == userId || f.RecipientId == userId)
                        && f.Status == Status.Accepted
                    )
                    .Select(f => f.SenderId == userId ? f.RecipientId : f.SenderId)
                    .ToListAsync();

                if (!friendUserIds.Any())
                {
                    // User has no friends, so no overlaps possible
                    return new List<WindowDto>();
                }

                // Apply additional filter for date range and participants being friends
                query = query.Where(w =>
                    w.Start >= start.Value
                    && w.End <= end.Value
                    && w.WindowParticipants.Any(p => friendUserIds.Contains(p.UserId))
                );
            }

            // If categoryId is provided, filter to only include windows where participants
            // are members of the specified category
            if (categoryId.HasValue)
            {
                // Get all users who are members of the specified category
                var categoryMemberIds = await _dbContext
                    .CategoryMembers.Where(cm => cm.CategoryId == categoryId.Value)
                    .Select(cm => cm.FriendId)
                    .ToListAsync();

                // Only include windows where at least one participant is a member of the category
                query = query.Where(w =>
                    w.WindowParticipants.Any(wp => categoryMemberIds.Contains(wp.UserId))
                );
            }

            var windows = await query.ToListAsync();

            // If date range was specified, need to do post-processing to filter for actual overlaps
            if (start.HasValue && end.HasValue)
            {
                // Get all user windows again for overlap check
                var userWindows = await _dbContext
                    .Windows.Where(w =>
                        w.WindowParticipants.Any(p => p.UserId == userId)
                        && w.Start >= start.Value
                        && w.End <= end.Value
                        && (w.HangoutId == null || w.HangoutId == 0)
                    )
                    .ToListAsync();

                // Only include windows that actually overlap with user's windows
                windows = windows
                    .Where(friendWindow =>
                        userWindows.Any(uw =>
                            friendWindow.Start < uw.End && friendWindow.End > uw.Start
                        )
                    )
                    .ToList();
            }

            // Map to DTOs and return
            return _mapper.Map<IEnumerable<WindowDto>>(windows);
        }

        // Implement window deletion method
        public async Task<bool> DeleteWindowAsync(int windowId, string userId)
        {
            try
            {
                // Find the window
                var window = await _dbContext
                    .Windows.Include(w => w.WindowParticipants)
                    .Include(w => w.WindowVisibilities)
                    .FirstOrDefaultAsync(w => w.Id == windowId);

                if (window == null)
                {
                    throw new KeyNotFoundException($"Window with ID {windowId} not found");
                }

                // Verify ownership
                if (window.UserId != userId)
                {
                    throw new UnauthorizedAccessException(
                        "You are not authorized to delete this window"
                    );
                }

                // Delete related entities first
                if (window.WindowParticipants?.Any() == true)
                {
                    _dbContext.WindowParticipants.RemoveRange(window.WindowParticipants);
                }

                if (window.WindowVisibilities?.Any() == true)
                {
                    _dbContext.WindowVisibilities.RemoveRange(window.WindowVisibilities);
                }

                // Now delete the window
                _dbContext.Windows.Remove(window);
                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
                when (ex is not KeyNotFoundException && ex is not UnauthorizedAccessException)
            {
                // Re-throw these specific exceptions to be handled by the controller
                throw new Exception($"Failed to delete window: {ex.Message}", ex);
            }
        }

        public async Task<WindowDto> UpdateWindowAsync(
            int windowId,
            WindowDto windowDto,
            string userId
        )
        {
            // Find window and verify authorization
            var window = await _dbContext
                .Windows.Include(w => w.WindowParticipants)
                .Include(w => w.WindowVisibilities)
                .FirstOrDefaultAsync(w => w.Id == windowId);

            if (window == null)
            {
                throw new KeyNotFoundException($"Window with ID {windowId} not found");
            }

            // Check if user is either the owner or a participant
            bool isOwner = window.UserId == userId;
            bool isParticipant = window.WindowParticipants.Any(wp => wp.UserId == userId);

            if (!isOwner && !isParticipant)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to update this window"
                );
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                // Update basic properties
                window.Start = windowDto.Start;
                window.End = windowDto.End;
                window.PreferredActivity =
                    windowDto.ExtendedProps?.PreferredActivity ?? window.PreferredActivity;
                window.DaysOfNoticeNeeded =
                    windowDto.ExtendedProps?.DaysOfNoticeNeeded ?? window.DaysOfNoticeNeeded;
                window.Active = windowDto.ExtendedProps?.Active ?? window.Active;
                window.HangoutId = windowDto.ExtendedProps?.HangoutId;
                window.UpdatedAt = DateTime.UtcNow;

                // Check if this window is associated with a hangout
                if (window.HangoutId.HasValue)
                {
                    // Find and update the associated hangout
                    var hangout = await _dbContext.Hangouts.FirstOrDefaultAsync(h =>
                        h.Id == window.HangoutId.Value
                    );

                    if (hangout != null)
                    {
                        // Update the hangout's start and end times to match the window
                        hangout.ConfirmedStart = window.Start;
                        hangout.ConfirmedEnd = window.End;

                        // Instead of managing window participants directly,
                        // delegate to the hangout synchronization logic
                        var hangoutService = new HangoutService(
                            _dbContext,
                            _mapper,
                            _httpContextAccessor
                        );
                        await hangoutService.SynchronizeWindowParticipantsWithHangoutGuests(
                            hangout.Id
                        );
                    }
                }
                else
                {
                    // Only manage participants directly if this is NOT a hangout-linked window
                    var participantsToRemove = window
                        .WindowParticipants.Where(p => p.UserId != window.UserId)
                        .ToList();

                    if (participantsToRemove.Any())
                    {
                        _dbContext.WindowParticipants.RemoveRange(participantsToRemove);
                        await _dbContext.SaveChangesAsync();
                    }

                    // Add new participants from the DTO
                    if (windowDto.ExtendedProps?.Participants != null)
                    {
                        // Get current participants to avoid duplicates
                        var existingParticipantIds = window
                            .WindowParticipants.Select(p => p.UserId)
                            .ToList();

                        foreach (var participant in windowDto.ExtendedProps.Participants)
                        {
                            if (
                                participant?.UserId != null
                                && participant.UserId != window.UserId
                                && // Skip owner (already a participant)
                                !existingParticipantIds.Contains(participant.UserId)
                            ) // Skip duplicates
                            {
                                _dbContext.WindowParticipants.Add(
                                    new WindowParticipant
                                    {
                                        WindowId = windowId,
                                        UserId = participant.UserId,
                                    }
                                );
                                existingParticipantIds.Add(participant.UserId);
                            }
                        }
                        await _dbContext.SaveChangesAsync();
                    }
                }

                // Update visibilities (remove all and add new ones)
                var visibilitiesToRemove = window.WindowVisibilities.ToList();
                if (visibilitiesToRemove.Any())
                {
                    _dbContext.WindowVisibilities.RemoveRange(visibilitiesToRemove);
                    await _dbContext.SaveChangesAsync();
                }

                // Add new visibilities
                if (windowDto.ExtendedProps?.Visibilities != null)
                {
                    foreach (var visibility in windowDto.ExtendedProps.Visibilities)
                    {
                        if (visibility?.CategoryId > 0)
                        {
                            _dbContext.WindowVisibilities.Add(
                                new WindowVisibility
                                {
                                    WindowId = windowId,
                                    CategoryId = visibility.CategoryId,
                                }
                            );
                        }
                    }
                    await _dbContext.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Reload the updated window with all relationships
                var updatedWindow = await _dbContext
                    .Windows.AsNoTracking() // Prevent tracking issues
                    .Include(w => w.User)
                    .Include(w => w.Hangout)
                    .Include(w => w.WindowParticipants)
                    .ThenInclude(wp => wp.User)
                    .Include(w => w.WindowVisibilities)
                    .ThenInclude(wv => wv.Category)
                    .FirstOrDefaultAsync(w => w.Id == windowId);

                return _mapper.Map<WindowDto>(updatedWindow);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Failed to update window: {ex.Message}", ex);
            }
        }
    }
}
