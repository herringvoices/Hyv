using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
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
    }
}
