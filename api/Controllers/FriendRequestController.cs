using System.Threading.Tasks;
using Hyv.Models;
using Hyv.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendRequestController : ControllerBase
    {
        private readonly IFriendRequestService _friendRequestService;

        public FriendRequestController(IFriendRequestService friendRequestService)
        {
            _friendRequestService = friendRequestService;
        }

        [HttpPost]
        public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.RecipientId))
                return BadRequest(new { message = "RecipientId is required." });

            var result = await _friendRequestService.SendFriendRequestAsync(dto.RecipientId);
            if (!result)
                return BadRequest(new { message = "Unable to send friend request." });

            return Ok(new { message = "Friend request sent." });
        }

        // Updated endpoint to accept userIsSender query parameter.
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingFriendRequests([FromQuery] bool? userIsSender)
        {
            var requests = await _friendRequestService.GetPendingFriendRequestsAsync(userIsSender);
            return Ok(requests);
        }

        [HttpPost("{requestId:int}/respond")]
        public async Task<IActionResult> RespondToFriendRequest(
            int requestId,
            [FromQuery] bool accepted
        )
        {
            if (string.IsNullOrEmpty(requestId.ToString()))
                return BadRequest(new { message = "RequestId is required." });

            var status = accepted ? "Accepted" : "Rejected";
            var result = await _friendRequestService.RespondToFriendRequestAsync(requestId, status);
            if (!result)
                return BadRequest(new { message = "Unable to respond to friend request." });

            return Ok(new { message = "Friend request response recorded." });
        }
    }

    public class SendFriendRequestDto
    {
        public string RecipientId { get; set; }
    }

    public class RespondFriendRequestDto
    {
        public string Status { get; set; }
    }
}
