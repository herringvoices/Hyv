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
    }
}
