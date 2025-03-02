using System;
using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Ensure all endpoints are secured
    public class TagalongController : ControllerBase
    {
        private readonly ITagalongService _tagalongService;

        public TagalongController(ITagalongService tagalongService)
        {
            _tagalongService = tagalongService;
        }

        [HttpPost]
        public async Task<IActionResult> SendTagalongRequest([FromBody] SendTagalongDto dto)
        {
            if (string.IsNullOrEmpty(dto.RecipientId))
                return BadRequest(new { message = "RecipientId is required." });

            var result = await _tagalongService.SendTagalongRequestAsync(dto.RecipientId);
            if (!result)
                return BadRequest(new { message = "Unable to send tagalong request." });

            return Ok(new { message = "Tagalong request sent." });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingTagalongs([FromQuery] bool? userIsSender)
        {
            var requests = await _tagalongService.GetPendingTagalongRequestsAsync(userIsSender);
            return Ok(requests);
        }

        [HttpDelete("all")]
        public async Task<IActionResult> DeleteAllTagalongRequests()
        {
            var result = await _tagalongService.DeleteAllTagalongRequestsAsync();
            if (!result)
                return BadRequest(new { message = "Unable to delete tagalong requests." });
            return Ok(new { message = "All tagalong requests deleted." });
        }

        [HttpPost("{requestId:int}/respond")]
        public async Task<IActionResult> RespondToTagalongRequest(
            int requestId,
            [FromQuery] bool accepted
        )
        {
            var status = accepted ? "Accepted" : "Rejected";
            var result = await _tagalongService.RespondToTagalongRequestAsync(requestId, status);
            if (!result)
                return BadRequest(new { message = "Unable to respond to tagalong request." });
            return Ok(new { message = "Tagalong request response recorded." });
        }

        // Add the missing endpoint to remove a specific tagalong
        [HttpDelete("{tagalongId}")]
        public async Task<IActionResult> RemoveTagalong(int tagalongId)
        {
            var result = await _tagalongService.RemoveTagalongAsync(tagalongId);
            if (!result)
                return BadRequest(new { message = "Failed to remove tagalong." });

            return Ok(new { message = "Tagalong removed successfully." });
        }

        // Add endpoint to check if a tagalong exists with another user
        [HttpGet("exists")]
        public async Task<IActionResult> CheckTagalongExists([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { message = "UserId is required." });

            bool exists = await _tagalongService.HasTagalongWithUserAsync(userId);
            return Ok(new { exists });
        }

        // Add endpoint to get accepted tagalongs
        [HttpGet("accepted")]
        public async Task<IActionResult> GetAcceptedTagalongs()
        {
            try
            {
                var tagalongs = await _tagalongService.GetAcceptedTagalongsAsync();
                return Ok(tagalongs);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new { message = $"Error retrieving accepted tagalongs: {ex.Message}" }
                );
            }
        }
    }

    public class SendTagalongDto
    {
        public string RecipientId { get; set; }
    }
}
