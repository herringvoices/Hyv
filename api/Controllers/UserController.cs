using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(
            [FromQuery] string query,
            [FromQuery] bool? friends,
            [FromQuery] bool? nonFriends,
            [FromQuery] int? categoryId
        )
        {
            var users = await _userService.SearchUsersByUsernameAsync(
                query,
                friends,
                nonFriends,
                categoryId
            );
            return Ok(users);
        }

        [HttpDelete("delete-all")]
        public async Task<IActionResult> DeleteAllUsers()
        {
            bool success = await _userService.DeleteAllUsersAsync();
            if (success)
                return Ok(new { message = "All users deleted successfully." });
            else
                return BadRequest(new { message = "Failed to delete users." });
        }
    }
}
