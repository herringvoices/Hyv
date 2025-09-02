using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Hyv.DTOs;
using Hyv.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Add authorization attribute
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
            [FromQuery] string query = null, // Make query optional with a default value
            [FromQuery] bool? friends = null,
            [FromQuery] bool? nonFriends = null,
            [FromQuery] int? categoryId = null
        )
        {
            try
            {
                var users = await _userService.SearchUsersByUsernameAsync(
                    query,
                    friends,
                    nonFriends,
                    categoryId
                );
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetUsersByCategory(int categoryId)
        {
            try
            {
                var users = await _userService.GetUsersByCategoryIdAsync(categoryId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UserUpdateDto userDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || userDto.Id != userId)
            {
                return Unauthorized(new { message = "Unauthorized to update this user" });
            }

            var updatedUser = await _userService.UpdateUserAsync(userDto);
            if (updatedUser == null)
                return NotFound(new { message = "User not found" });

            return Ok(updatedUser);
        }

        [HttpPut("update-name")]
        public async Task<IActionResult> UpdateUserName([FromBody] UserUpdateDto userDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || userDto.Id != userId)
            {
                return Unauthorized(new { message = "Unauthorized to update this user" });
            }

            var updatedUser = await _userService.UpdateUserAsync(userDto);
            if (updatedUser == null)
                return NotFound(new { message = "User not found" });

            return Ok(updatedUser);
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                // Use PhotoService to upload to Cloudinary
                var photoService = HttpContext.RequestServices.GetRequiredService<IPhotoService>();
                var photoUrl = await photoService.UploadPhotoAsync(file);

                // Update user with new photo URL
                var userUpdateDto = new UserUpdateDto { Id = userId, ProfilePicture = photoUrl };

                var updatedUser = await _userService.UpdateUserAsync(userUpdateDto);
                if (updatedUser == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new { photoUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
