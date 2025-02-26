using System.Threading.Tasks;
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

        [HttpDelete("all")]
        public async Task<IActionResult> DeleteAllFriendRequests()
        {
            var result = await _friendRequestService.DeleteAllFriendRequestsAsync();
            if (!result)
                return BadRequest(new { message = "Unable to delete friend requests." });
            return Ok(new { message = "All friend requests deleted." });
        }
    }

    public class SendFriendRequestDto
    {
        public string RecipientId { get; set; }
    }
}
