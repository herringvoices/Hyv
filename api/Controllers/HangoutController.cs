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
    }
}
