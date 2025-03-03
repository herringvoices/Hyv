using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
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

        // Add new method to delete all windows for a user
        Task<int> DeleteAllWindowsAsync(string userId);

        // Add new method for updating a window
        Task<WindowDto> UpdateWindowAsync(int windowId, WindowDto windowDto, string userId);
    }

    public class WindowService : IWindowService
    {
        private readonly HyvDbContext _dbContext;
        private readonly IMapper _mapper;

        public WindowService(HyvDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<WindowDto> CreateWindowAsync(WindowDto windowDto)
        {
            try
            {
                // Map from DTO to entity
                var window = new Window
                {
                    UserId = windowDto.ExtendedProps?.UserId,
                    PreferredActivity = windowDto.ExtendedProps?.PreferredActivity ?? string.Empty,
                    DaysOfNoticeNeeded = windowDto.ExtendedProps?.DaysOfNoticeNeeded ?? 0,
                    Active = windowDto.ExtendedProps?.Active ?? true,
                    Start = windowDto.Start,
                    End = windowDto.End,
                    HangoutId = windowDto.ExtendedProps?.HangoutId,
                    WindowParticipants = new List<WindowParticipant>(),
                    WindowVisibilities = new List<WindowVisibility>(),
                };

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
                    throw new InvalidOperationException(
                        "Cannot create window: Time slot overlaps with another window where you are a participant."
                    );
                }

                // Add the window creator as a participant
                window.WindowParticipants.Add(new WindowParticipant { UserId = window.UserId });

                // Add participants from the DTO
                if (windowDto.ExtendedProps?.Participants != null)
                {
                    foreach (
                        var participant in windowDto.ExtendedProps.Participants.Where(p =>
                            p?.UserId != null
                        )
                    )
                    {
                        if (!window.WindowParticipants.Any(p => p.UserId == participant.UserId))
                        {
                            window.WindowParticipants.Add(
                                new WindowParticipant { UserId = participant.UserId }
                            );
                        }
                    }
                }

                // Add visibilities from the DTO
                if (windowDto.ExtendedProps?.Visibilities != null)
                {
                    foreach (var visibility in windowDto.ExtendedProps.Visibilities)
                    {
                        if (visibility != null && visibility.CategoryId > 0)
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
                    .Windows.AsNoTracking() // Prevent tracking issues
                    .Include(w => w.User)
                    .Include(w => w.Hangout)
                    .Include(w => w.WindowParticipants)
                    .ThenInclude(wp => wp.User)
                    .Include(w => w.WindowVisibilities)
                    .ThenInclude(wv => wv.Category)
                    .FirstOrDefaultAsync(w => w.Id == window.Id);

                // Manually create DTO to avoid mapping issues
                var result = new WindowDto
                {
                    Id = createdWindow.Id.ToString(),
                    Start = createdWindow.Start,
                    End = createdWindow.End,
                    ExtendedProps = new WindowExtendedPropsDto
                    {
                        UserId = createdWindow.UserId,
                        PreferredActivity = createdWindow.PreferredActivity,
                        DaysOfNoticeNeeded = createdWindow.DaysOfNoticeNeeded,
                        Active = createdWindow.Active,
                        HangoutId = createdWindow.HangoutId,
                        User = _mapper.Map<UserDto>(createdWindow.User),
                        Hangout =
                            createdWindow.Hangout != null
                                ? _mapper.Map<HangoutDto>(createdWindow.Hangout)
                                : null,
                        Participants = createdWindow
                            .WindowParticipants?.Select(p => new WindowParticipantDto
                            {
                                Id = p.Id,
                                WindowId = p.WindowId,
                                UserId = p.UserId,
                                User = p.User != null ? _mapper.Map<UserDto>(p.User) : null,
                            })
                            .ToList(),
                        Visibilities = createdWindow
                            .WindowVisibilities?.Select(v => new WindowVisibilityDto
                            {
                                Id = v.Id,
                                WindowId = v.WindowId,
                                CategoryId = v.CategoryId,
                                Category =
                                    v.Category != null
                                        ? _mapper.Map<FriendshipCategoryDto>(v.Category)
                                        : null,
                            })
                            .ToList(),
                    },
                };

                return result;
            }
            catch (Exception ex)
            {
                // Wrap exceptions to get better diagnostics
                throw new Exception($"Error creating window: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<WindowDto>> GetWindowsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        )
        {
            // First, delete any windows for this user that have ended (End time is before current time)
            var now = DateTime.UtcNow;
            var expiredWindows = await _dbContext
                .Windows.Where(w => w.End < now && w.UserId == userId)
                .ToListAsync();

            if (expiredWindows.Any())
            {
                _dbContext.Windows.RemoveRange(expiredWindows);
                await _dbContext.SaveChangesAsync();
            }

            // Now query windows that fall within the specified date range and belong to the current user
            var windows = await _dbContext
                .Windows.Where(w => w.Start >= start && w.End <= end && w.UserId == userId)
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

                // We'll need to further filter for actual overlaps below
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

        // Implement the delete all windows method
        public async Task<int> DeleteAllWindowsAsync(string userId)
        {
            try
            {
                // Get all windows for the user
                var windows = await _dbContext.Windows.Where(w => w.UserId == userId).ToListAsync();

                if (!windows.Any())
                {
                    return 0; // No windows to delete
                }

                // Delete all related window participants and visibilities first
                var windowIds = windows.Select(w => w.Id).ToList();

                // Delete all window participants
                var participants = await _dbContext
                    .WindowParticipants.Where(wp => windowIds.Contains(wp.WindowId))
                    .ToListAsync();
                _dbContext.WindowParticipants.RemoveRange(participants);

                // Delete all window visibilities
                var visibilities = await _dbContext
                    .WindowVisibilities.Where(wv => windowIds.Contains(wv.WindowId))
                    .ToListAsync();
                _dbContext.WindowVisibilities.RemoveRange(visibilities);

                // Now delete all windows
                _dbContext.Windows.RemoveRange(windows);

                // Save changes to the database
                await _dbContext.SaveChangesAsync();

                // Return the count of deleted windows
                return windows.Count;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to delete windows: {ex.Message}", ex);
            }
        }

        public async Task<WindowDto> UpdateWindowAsync(
            int windowId,
            WindowDto windowDto,
            string userId
        )
        {
            // Find window and verify ownership
            var window = await _dbContext
                .Windows.Include(w => w.WindowParticipants)
                .Include(w => w.WindowVisibilities)
                .FirstOrDefaultAsync(w => w.Id == windowId);

            if (window == null)
            {
                throw new KeyNotFoundException($"Window with ID {windowId} not found");
            }

            if (window.UserId != userId)
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

                await _dbContext.SaveChangesAsync();

                // Update participants (removing all except owner and adding new ones)
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
