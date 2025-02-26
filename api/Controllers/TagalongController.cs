using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
    }

    public class SendTagalongDto
    {
        public string RecipientId { get; set; }
    }
}
