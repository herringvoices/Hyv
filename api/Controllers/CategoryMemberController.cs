using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryMemberController : ControllerBase
    {
        private readonly ICategoryMemberService _categoryMemberService;

        public CategoryMemberController(ICategoryMemberService categoryMemberService)
        {
            _categoryMemberService = categoryMemberService;
        }

        [HttpPost]
        public async Task<IActionResult> AddUserToCategory(
            [FromQuery] int categoryId,
            [FromQuery] string friendId
        )
        {
            if (string.IsNullOrEmpty(friendId))
                return BadRequest(new { message = "Friend ID is required." });

            var result = await _categoryMemberService.AddUserToCategoryAsync(categoryId, friendId);
            if (!result)
                return BadRequest(new { message = "Failed to add user to category." });

            return Ok(new { message = "User added to category successfully." });
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveUserFromCategory(
            [FromQuery] int categoryId,
            [FromQuery] string friendId
        )
        {
            if (string.IsNullOrEmpty(friendId))
                return BadRequest(new { message = "Friend ID is required." });

            if (categoryId <= 0)
                return BadRequest(new { message = "Valid Category ID is required." });

            var result = await _categoryMemberService.RemoveUserFromCategoryAsync(
                categoryId,
                friendId
            );
            if (!result)
                return BadRequest(new { message = "Failed to remove user from category." });

            return Ok(new { message = "User removed from category successfully." });
        }
    }
}
