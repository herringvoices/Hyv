using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendshipCategoryController : ControllerBase
    {
        private readonly IFriendshipCategoryService _friendshipCategoryService;

        public FriendshipCategoryController(IFriendshipCategoryService friendshipCategoryService)
        {
            _friendshipCategoryService = friendshipCategoryService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromQuery] string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            var result = await _friendshipCategoryService.CreateCategoryAsync(name);
            if (!result)
            {
                return BadRequest(new { message = "Failed to create category." });
            }

            return Ok(new { message = "Category created successfully." });
        }
    }
}