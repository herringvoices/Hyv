using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IPresetService
    {
        Task<PresetDto> CreatePresetAsync(PresetDto presetDto, string userId);
        Task<IEnumerable<PresetDto>> GetUserPresetsAsync(string userId);
        Task<PresetDto> GetPresetByIdAsync(int presetId, string userId);
        Task<PresetDto> UpdatePresetAsync(int presetId, PresetDto presetDto, string userId);
        Task<bool> DeletePresetAsync(int presetId, string userId);
        Task<WindowDto> ApplyPresetAsync(int presetId, DateTime targetDate, string userId);
    }

    public class PresetService : IPresetService
    {
        private readonly HyvDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly IWindowService _windowService;

        public PresetService(HyvDbContext dbContext, IMapper mapper, IWindowService windowService)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _windowService = windowService;
        }

        public async Task<PresetDto> CreatePresetAsync(PresetDto presetDto, string userId)
        {
            // Map from DTO to entity
            var preset = _mapper.Map<Preset>(presetDto);

            // Set the userId and creation time
            preset.UserId = userId;
            preset.CreatedAt = DateTime.UtcNow;

            // Initialize collections if needed
            if (preset.PresetParticipants == null)
            {
                preset.PresetParticipants = new List<PresetParticipant>();
            }

            // Add participants from the DTO
            if (presetDto.ExtendedProps?.Participants != null)
            {
                foreach (var participant in presetDto.ExtendedProps.Participants)
                {
                    if (
                        participant?.UserId != null
                        && !preset.PresetParticipants.Any(p => p.UserId == participant.UserId)
                    )
                    {
                        preset.PresetParticipants.Add(
                            new PresetParticipant { UserId = participant.UserId }
                        );
                    }
                }
            }

            // Initialize visibilities collection if needed
            if (preset.PresetVisibilities == null)
            {
                preset.PresetVisibilities = new List<PresetVisibility>();
            }

            // Add visibilities from the DTO
            if (presetDto.ExtendedProps?.Visibilities != null)
            {
                foreach (var visibility in presetDto.ExtendedProps.Visibilities)
                {
                    if (
                        visibility?.CategoryId > 0
                        && !preset.PresetVisibilities.Any(v =>
                            v.CategoryId == visibility.CategoryId
                        )
                    )
                    {
                        preset.PresetVisibilities.Add(
                            new PresetVisibility { CategoryId = visibility.CategoryId }
                        );
                    }
                }
            }

            // Add the preset to the database
            _dbContext.Presets.Add(preset);
            await _dbContext.SaveChangesAsync();

            // Reload with relationships for proper mapping
            var createdPreset = await _dbContext
                .Presets.Include(p => p.User)
                .Include(p => p.PresetParticipants)
                .ThenInclude(pp => pp.User)
                .Include(p => p.PresetVisibilities)
                .ThenInclude(pv => pv.FriendshipCategory)
                .FirstOrDefaultAsync(p => p.Id == preset.Id);

            return _mapper.Map<PresetDto>(createdPreset);
        }

        public async Task<IEnumerable<PresetDto>> GetUserPresetsAsync(string userId)
        {
            var presets = await _dbContext
                .Presets.Where(p => p.UserId == userId)
                .Include(p => p.User)
                .Include(p => p.PresetParticipants)
                .ThenInclude(pp => pp.User)
                .Include(p => p.PresetVisibilities)
                .ThenInclude(pv => pv.FriendshipCategory)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PresetDto>>(presets);
        }

        public async Task<PresetDto> GetPresetByIdAsync(int presetId, string userId)
        {
            var preset = await _dbContext
                .Presets.Where(p => p.Id == presetId && p.UserId == userId)
                .Include(p => p.User)
                .Include(p => p.PresetParticipants)
                .ThenInclude(pp => pp.User)
                .Include(p => p.PresetVisibilities)
                .ThenInclude(pv => pv.FriendshipCategory)
                .FirstOrDefaultAsync();

            if (preset == null)
            {
                throw new KeyNotFoundException(
                    $"Preset with ID {presetId} not found for this user"
                );
            }

            return _mapper.Map<PresetDto>(preset);
        }

        public async Task<PresetDto> UpdatePresetAsync(
            int presetId,
            PresetDto presetDto,
            string userId
        )
        {
            var preset = await _dbContext
                .Presets.Include(p => p.PresetParticipants)
                .Include(p => p.PresetVisibilities)
                .FirstOrDefaultAsync(p => p.Id == presetId);

            if (preset == null)
            {
                throw new KeyNotFoundException($"Preset with ID {presetId} not found");
            }

            if (preset.UserId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to update this preset"
                );
            }

            // Update basic properties
            preset.Title = presetDto.Title;
            preset.Start = presetDto.Start;
            preset.End = presetDto.End;
            preset.PreferredActivity =
                presetDto.ExtendedProps?.PreferredActivity ?? preset.PreferredActivity;
            preset.DaysOfNoticeNeeded =
                presetDto.ExtendedProps?.DaysOfNoticeNeeded ?? preset.DaysOfNoticeNeeded;

            // Update participants - remove existing and add new ones
            if (preset.PresetParticipants?.Any() == true)
            {
                _dbContext.PresetParticipants.RemoveRange(preset.PresetParticipants);
            }

            // Re-add participants from the DTO
            if (presetDto.ExtendedProps?.Participants != null)
            {
                foreach (var participant in presetDto.ExtendedProps.Participants)
                {
                    if (participant?.UserId != null)
                    {
                        _dbContext.PresetParticipants.Add(
                            new PresetParticipant
                            {
                                PresetId = presetId,
                                UserId = participant.UserId,
                            }
                        );
                    }
                }
            }

            // Update visibilities - remove existing and add new ones
            if (preset.PresetVisibilities?.Any() == true)
            {
                _dbContext.PresetVisibilities.RemoveRange(preset.PresetVisibilities);
            }

            // Re-add visibilities from the DTO
            if (presetDto.ExtendedProps?.Visibilities != null)
            {
                foreach (var visibility in presetDto.ExtendedProps.Visibilities)
                {
                    if (visibility?.CategoryId > 0)
                    {
                        _dbContext.PresetVisibilities.Add(
                            new PresetVisibility
                            {
                                PresetId = presetId,
                                CategoryId = visibility.CategoryId,
                            }
                        );
                    }
                }
            }

            await _dbContext.SaveChangesAsync();

            // Reload with relationships for proper mapping
            var updatedPreset = await _dbContext
                .Presets.Include(p => p.User)
                .Include(p => p.PresetParticipants)
                .ThenInclude(pp => pp.User)
                .Include(p => p.PresetVisibilities)
                .ThenInclude(pv => pv.FriendshipCategory)
                .FirstOrDefaultAsync(p => p.Id == presetId);

            return _mapper.Map<PresetDto>(updatedPreset);
        }

        public async Task<bool> DeletePresetAsync(int presetId, string userId)
        {
            var preset = await _dbContext
                .Presets.Include(p => p.PresetParticipants)
                .Include(p => p.PresetVisibilities)
                .FirstOrDefaultAsync(p => p.Id == presetId);

            if (preset == null)
            {
                throw new KeyNotFoundException($"Preset with ID {presetId} not found");
            }

            if (preset.UserId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You are not authorized to delete this preset"
                );
            }

            // Delete related entities first
            if (preset.PresetParticipants?.Any() == true)
            {
                _dbContext.PresetParticipants.RemoveRange(preset.PresetParticipants);
            }

            if (preset.PresetVisibilities?.Any() == true)
            {
                _dbContext.PresetVisibilities.RemoveRange(preset.PresetVisibilities);
            }

            // Delete the preset
            _dbContext.Presets.Remove(preset);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<WindowDto> ApplyPresetAsync(
            int presetId,
            DateTime targetDate,
            string userId
        )
        {
            // Find the preset
            var preset = await _dbContext
                .Presets.Include(p => p.PresetParticipants)
                .Include(p => p.PresetVisibilities)
                .FirstOrDefaultAsync(p => p.Id == presetId && p.UserId == userId);

            if (preset == null)
            {
                throw new KeyNotFoundException($"Preset with ID {presetId} not found");
            }

            // Create a window DTO from the preset
            var windowDto = new WindowDto
            {
                Start = AdjustTimeToDate(preset.Start, targetDate),
                End = AdjustTimeToDate(preset.End, targetDate),
                ExtendedProps = new WindowExtendedPropsDto
                {
                    UserId = userId,
                    PreferredActivity = preset.PreferredActivity,
                    DaysOfNoticeNeeded = preset.DaysOfNoticeNeeded,
                    Active = true,
                    Participants = preset
                        .PresetParticipants?.Select(pp => new WindowParticipantDto
                        {
                            UserId = pp.UserId,
                        })
                        .ToList(),
                    Visibilities = preset
                        .PresetVisibilities?.Select(pv => new WindowVisibilityDto
                        {
                            CategoryId = pv.CategoryId,
                        })
                        .ToList(),
                },
            };

            // Use the window service to create a window based on the preset
            return await _windowService.CreateWindowAsync(windowDto);
        }

        // Helper method to adjust time from preset to target date
        private DateTime AdjustTimeToDate(DateTime sourceTime, DateTime targetDate)
        {
            // Convert the stored UTC preset time to local time to recover the original wall-clock value.
            DateTime localPresetTime = sourceTime.ToLocalTime();

            // Create a new DateTime on the target date using the local preset time components.
            DateTime combinedLocal = new DateTime(
                targetDate.Year,
                targetDate.Month,
                targetDate.Day,
                localPresetTime.Hour,
                localPresetTime.Minute,
                localPresetTime.Second,
                DateTimeKind.Local
            );

            // Convert the combined local time back to UTC before returning.
            return combinedLocal.ToUniversalTime();
        }
    }
}
