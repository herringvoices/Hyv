using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendController : ControllerBase
    {
        private readonly IFriendService _friendService;

        public FriendController(IFriendService friendService)
        {
            _friendService = friendService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFriends([FromQuery] string search)
        {
            var friends = await _friendService.GetFriendsAsync(search);
            return Ok(friends);
        }

        // New: Unfriend endpoint.
        [HttpDelete("{friendId}")]
        public async Task<IActionResult> Unfriend(string friendId)
        {
            var removed = await _friendService.RemoveFriendAsync(friendId);
            if (!removed)
                return NotFound();
            return NoContent();
        }

        // New: Block endpoint.
        [HttpPost("{userIdToBlock}/block")]
        public async Task<IActionResult> BlockUser(string userIdToBlock)
        {
            var blocked = await _friendService.BlockUserAsync(userIdToBlock);
            if (!blocked)
                return BadRequest(new { message = "Blocking failed." });
            return NoContent();
        }
    }
}
