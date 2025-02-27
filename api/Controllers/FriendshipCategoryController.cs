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

        [HttpGet]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _friendshipCategoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromQuery] string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            var result = await _friendshipCategoryService.UpdateCategoryNameAsync(id, name);
            if (!result)
            {
                return BadRequest(new { message = "Failed to update category." });
            }

            return Ok(new { message = "Category updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var result = await _friendshipCategoryService.DeleteCategoryAsync(id);
            if (!result)
            {
                return BadRequest(new { message = "Failed to delete category." });
            }

            return Ok(new { message = "Category deleted successfully." });
        }
    }
}
