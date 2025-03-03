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
    public class WindowController : ControllerBase
    {
        private readonly IWindowService _windowService;

        public WindowController(IWindowService windowService)
        {
            _windowService = windowService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWindow([FromBody] WindowDto windowDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get the current user's ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("User ID not found in token");
            }

            var userId = userIdClaim.Value;

            // Initialize ExtendedProps if null
            if (windowDto.ExtendedProps == null)
            {
                windowDto.ExtendedProps = new WindowExtendedPropsDto();
            }

            // Set the UserId from the authenticated user
            windowDto.ExtendedProps.UserId = userId;

            try
            {
                var createdWindow = await _windowService.CreateWindowAsync(windowDto);
                return CreatedAtAction(
                    nameof(CreateWindow),
                    new { id = createdWindow.Id },
                    createdWindow
                );
            }
            catch (InvalidOperationException ex)
            {
                // Return a 409 Conflict response with the error message
                return Conflict(ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WindowDto>>> GetWindowsByDateRange(
            [FromQuery] DateTime start,
            [FromQuery] DateTime end
        )
        {
            try
            {
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var windows = await _windowService.GetWindowsByDateRangeAsync(start, end, userId);
                return Ok(windows);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("hive")]
        public async Task<IActionResult> GetHiveWindows(
            [FromQuery] DateTime? start = null,
            [FromQuery] DateTime? end = null,
            [FromQuery] int? categoryId = null
        )
        {
            // Get the current user's ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("User ID not found in token");
            }

            var userId = userIdClaim.Value;

            // Use the consolidated method with all parameters
            var hiveWindows = await _windowService.GetHiveWindowsAsync(
                userId,
                start,
                end,
                categoryId
            );
            return Ok(hiveWindows);
        }

        [HttpDelete("all")]
        public async Task<IActionResult> DeleteAllWindows()
        {
            try
            {
                // Get the current authenticated user's ID
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Call the service to delete all windows for this user
                int deletedCount = await _windowService.DeleteAllWindowsAsync(userId);

                // Return success with the count of deleted windows
                return Ok(
                    new
                    {
                        message = $"Successfully deleted {deletedCount} windows.",
                        count = deletedCount,
                    }
                );
            }
            catch (Exception ex)
            {
                // Return error response
                return StatusCode(500, new { error = $"Failed to delete windows: {ex.Message}" });
            }
        }

        // Add PUT endpoint for updating a window
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWindow(int id, [FromBody] WindowDto windowDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get the current user's ID from claims
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            try
            {
                var updatedWindow = await _windowService.UpdateWindowAsync(id, windowDto, userId);
                return Ok(updatedWindow);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }
    }
}
