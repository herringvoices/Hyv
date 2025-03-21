using System;
using System.Collections.Generic;
using System.Security.Claims;
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

        // Fix the constructor syntax error
        public HangoutController(IHangoutService hangoutService)
        {
            _hangoutService = hangoutService;
        }

        [HttpPost("request")]
        public async Task<ActionResult<HangoutRequestDto>> CreateHangoutRequest(
            [FromBody] HangoutRequestCreateDto createDto
        )
        {
            try
            {
                // Set the sender ID to the current user if not provided
                if (string.IsNullOrEmpty(createDto.SenderId))
                {
                    createDto.SenderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }

                // Debug logging
                Console.WriteLine(
                    $"Creating hangout request: Title={createDto.Title}, "
                        + $"SenderId={createDto.SenderId}, Recipients={string.Join(",", createDto.RecipientUserIds ?? new List<string>())}"
                );

                var result = await _hangoutService.CreateHangoutRequestAsync(createDto);

                // Update the return since GetUserHangouts no longer exists
                return CreatedAtAction("CreateHangoutRequest", new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreateHangoutRequest: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw;
            }
        }

        [HttpGet("pending-requests")]
        public async Task<
            ActionResult<List<HangoutRequestRecipientDto>>
        > GetPendingHangoutRequests()
        {
            try
            {
                var pendingRequests =
                    await _hangoutService.GetPendingHangoutRequestRecipientsAsync();
                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPendingHangoutRequests: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("pending-requests-sent-to/{userId}")]
        public async Task<
            ActionResult<List<HangoutRequestRecipientDto>>
        > GetPendingHangoutRequestsForUser(string userId)
        {
            try
            {
                var pendingRequests = await _hangoutService.GetPendingHangoutRequestsForUserAsync(
                    userId
                );
                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPendingHangoutRequestsForUser: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("request/recipient/{id}/accept")]
        public async Task<ActionResult<HangoutRequestRecipientDto>> AcceptHangoutRequest(
            int id,
            [FromQuery] bool newWindow = false
        )
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // First accept the request
                var acceptedRequest = await _hangoutService.HangoutAcceptAsync(id, userId);

                // Get the HangoutId, not the HangoutRequestId
                int hangoutId = 0;

                // The HangoutRequest should be included in the returned DTO
                if (acceptedRequest.HangoutRequest != null)
                {
                    hangoutId = acceptedRequest.HangoutRequest.HangoutId;
                }

                // Then perform cleanup based on newWindow parameter
                await _hangoutService.HangoutAcceptCleanup(hangoutId, userId, newWindow);

                return Ok(acceptedRequest);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("request/recipient/{id}/reject")]
        public async Task<ActionResult> RejectHangoutRequest(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _hangoutService.HangoutRejectAsync(id, userId);
                return Ok(new { message = "Hangout request rejected successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("{hangoutId}/join-request")]
        public async Task<ActionResult> SendJoinRequest(int hangoutId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _hangoutService.CreateJoinRequestAsync(hangoutId, userId);
                return Ok(new { message = "Join request sent successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("join-request/{joinRequestId}/accept")]
        public async Task<ActionResult> AcceptJoinRequest(
            int joinRequestId,
            [FromQuery] bool newWindow = false
        )
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var hangoutId = await _hangoutService.AcceptJoinRequestAsync(joinRequestId, userId);

                // Get the requester's userId for cleanup
                var requesterUserId = await _hangoutService.GetJoinRequestUserIdAsync(
                    joinRequestId
                );

                // Run cleanup for the requester
                await _hangoutService.HangoutAcceptCleanup(hangoutId, requesterUserId, newWindow);

                return Ok(new { message = "Join request accepted" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPost("join-request/{joinRequestId}/reject")]
        public async Task<ActionResult> RejectJoinRequest(int joinRequestId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _hangoutService.RejectJoinRequestAsync(joinRequestId, userId);
                return Ok(new { message = "Join request rejected" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpDelete("{hangoutId}/leave")]
        public async Task<ActionResult> LeaveHangout(int hangoutId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _hangoutService.LeaveHangoutAsync(hangoutId, userId);
                return Ok(new { message = "Successfully left the hangout" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpDelete("{hangoutId}")]
        public async Task<ActionResult> DeleteHangout(int hangoutId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _hangoutService.DeleteHangoutAsync(hangoutId, userId);
                return Ok(new { message = "Hangout deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPut("{hangoutId}")]
        public async Task<ActionResult<HangoutDto>> UpdateHangout(
            int hangoutId,
            [FromBody] HangoutDto hangoutDto
        )
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var updatedHangout = await _hangoutService.UpdateHangoutAsync(
                    hangoutId,
                    hangoutDto,
                    userId
                );
                return Ok(updatedHangout);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetHangouts(
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

            // Get hangouts for the current user and specified date range
            var hangouts = await _hangoutService.GetHangoutsByDateRangeAsync(start, end, userId);
            return Ok(hangouts);
        }

        [HttpGet("past")]
        public async Task<IActionResult> GetPastHangouts()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var hangouts = await _hangoutService.GetPastHangoutsForUserAsync(userId);
                return Ok(hangouts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingHangouts()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var hangouts = await _hangoutService.GetUpcomingHangoutsForUserAsync(userId);
                return Ok(hangouts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("user/{targetUserId}/past")]
        public async Task<IActionResult> GetPastHangoutsWithUser(string targetUserId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var hangouts = await _hangoutService.GetSharedHangoutsWithUserAsync(
                    targetUserId,
                    userId,
                    pastOnly: true
                );

                return Ok(hangouts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("user/{targetUserId}/upcoming")]
        public async Task<IActionResult> GetUpcomingHangoutsWithUser(string targetUserId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var hangouts = await _hangoutService.GetSharedHangoutsWithUserAsync(
                    targetUserId,
                    userId,
                    upcomingOnly: true
                );

                return Ok(hangouts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpGet("pending-join-requests")]
        public async Task<ActionResult<List<JoinRequestDto>>> GetPendingJoinRequests()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var pendingRequests = await _hangoutService.GetPendingJoinRequestsAsync(userId);
                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}
