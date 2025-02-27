using System.Security.Claims;
using System.Threading.Tasks;
using Hyv.Data;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IFriendshipCategoryService
    {
        Task<bool> CreateCategoryAsync(string name);
    }

    public class FriendshipCategoryService : IFriendshipCategoryService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FriendshipCategoryService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> CreateCategoryAsync(string name)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return false;
            }

            var category = new FriendshipCategory { UserId = currentUserId, Name = name };

            _context.FriendshipCategories.Add(category);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
    }
}
