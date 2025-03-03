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
        public async Task<IActionResult> GetWindows(
            [FromQuery] DateTime start,
            [FromQuery] DateTime end
        )
        {
            if (start == default || end == default)
            {
                return BadRequest("Both start and end date parameters are required");
            }

            // Get the current user's ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("User ID not found in token");
            }

            var userId = userIdClaim.Value;

            // Get windows for the current user and specified date range
            var windows = await _windowService.GetWindowsByDateRangeAsync(start, end, userId);
            return Ok(windows);
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
    }
}
