using System.Security.Claims;
using Hyv.DTOs;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PresetController : ControllerBase
    {
        private readonly IPresetService _presetService;
        private readonly ILogger<PresetController> _logger;

        public PresetController(IPresetService presetService, ILogger<PresetController> logger)
        {
            _presetService = presetService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePreset([FromBody] PresetDto presetDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var createdPreset = await _presetService.CreatePresetAsync(presetDto, userId);
                return CreatedAtAction(nameof(GetPreset), new { id = createdPreset.Id }, createdPreset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating preset");
                return StatusCode(500, "An error occurred while creating the preset");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPresets()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var presets = await _presetService.GetUserPresetsAsync(userId);
                return Ok(presets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving presets");
                return StatusCode(500, "An error occurred while retrieving presets");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPreset(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var preset = await _presetService.GetPresetByIdAsync(id, userId);
                return Ok(preset);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Preset with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving preset");
                return StatusCode(500, "An error occurred while retrieving the preset");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePreset(int id, [FromBody] PresetDto presetDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var updatedPreset = await _presetService.UpdatePresetAsync(id, presetDto, userId);
                return Ok(updatedPreset);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Preset with ID {id} not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("You are not authorized to update this preset");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating preset");
                return StatusCode(500, "An error occurred while updating the preset");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePreset(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                await _presetService.DeletePresetAsync(id, userId);
                return Ok(new { message = "Preset deleted successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Preset with ID {id} not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("You are not authorized to delete this preset");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting preset");
                return StatusCode(500, "An error occurred while deleting the preset");
            }
        }

        [HttpPost("{id}/apply")]
        public async Task<IActionResult> ApplyPreset(int id, [FromBody] ApplyPresetRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var window = await _presetService.ApplyPresetAsync(id, request.TargetDate, userId);
                return Ok(window);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Preset with ID {id} not found");
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying preset");
                return StatusCode(500, "An error occurred while applying the preset");
            }
        }
    }
}