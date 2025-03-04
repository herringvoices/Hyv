using System;
using System.Collections.Generic;
using System.Security.Claims; // Added for ClaimTypes
using System.Threading.Tasks;
using Hyv.DTOs;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HangoutController : ControllerBase
    {
        private readonly IHangoutService _hangoutService;

        public HangoutController(IHangoutService hangoutService) // Fixed constructor syntax
        {
            _hangoutService = hangoutService;
        }

        /// <summary>
        /// Get hangouts for a specific user with optional filtering and pagination
        /// </summary>
        /// <param name="userId">The user ID to get hangouts for</param>
        /// <param name="past">When true, returns past hangouts; when false, returns future hangouts; when null, returns all hangouts</param>
        /// <param name="limit">Max number of hangouts to return</param>
        /// <param name="offset">Number of hangouts to skip for pagination</param>
        /// <returns>A collection of hangouts</returns>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<HangoutDto>>> GetUserHangouts(
            string userId,
            [FromQuery] bool? past = null,
            [FromQuery] int? limit = null,
            [FromQuery] int? offset = 0
        )
        {
            var hangouts = await _hangoutService.GetHangoutsByUserIdAsync(
                userId,
                past,
                limit,
                offset
            );
            return Ok(hangouts);
        }

        /// <summary>
        /// Create a new hangout request with multiple recipients
        /// </summary>
        /// <param name="createDto">The hangout request data with recipient user IDs</param>
        /// <returns>The created hangout request</returns>
        [HttpPost("request")]
        public async Task<ActionResult<HangoutRequestDto>> CreateHangoutRequest(
            HangoutRequestCreateDto createDto
        )
        {
            // Set the sender ID to the current user if not provided
            if (string.IsNullOrEmpty(createDto.SenderId))
            {
                createDto.SenderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }

            var result = await _hangoutService.CreateHangoutRequestAsync(createDto);
            return CreatedAtAction(
                nameof(GetUserHangouts),
                new { userId = createDto.SenderId },
                result
            );
        }

        // Add other endpoints as needed
    }
}
