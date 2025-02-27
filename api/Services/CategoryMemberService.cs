using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Hyv.Data;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface ICategoryMemberService
    {
        Task<bool> AddUserToCategoryAsync(int categoryId, string friendId);
        Task<bool> RemoveUserFromCategoryAsync(int categoryId, string friendId);
    }

    public class CategoryMemberService : ICategoryMemberService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CategoryMemberService(HyvDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> AddUserToCategoryAsync(int categoryId, string friendId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return false;

            // Verify the category belongs to the current user
            var category = await _context.FriendshipCategories.FirstOrDefaultAsync(c =>
                c.Id == categoryId && c.UserId == currentUserId
            );

            if (category == null)
                return false;

            // Check if friendship exists
            var friendshipExists = await _context.Friendships.AnyAsync(f =>
                (
                    f.SenderId == currentUserId
                    && f.RecipientId == friendId
                    && f.Status == Status.Accepted
                )
                || (
                    f.SenderId == friendId
                    && f.RecipientId == currentUserId
                    && f.Status == Status.Accepted
                )
            );

            if (!friendshipExists)
                return false;

            // Check if the user is already in this category
            var existingMember = await _context.CategoryMembers.FirstOrDefaultAsync(c =>
                c.CategoryId == categoryId && c.FriendId == friendId
            );

            if (existingMember != null)
                return true; // Already exists, consider it success

            // Add the user to the category
            var categoryMember = new CategoryMember
            {
                CategoryId = categoryId,
                FriendId = friendId,
            };

            _context.CategoryMembers.Add(categoryMember);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> RemoveUserFromCategoryAsync(int categoryId, string friendId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return false;

            // Verify the category belongs to the current user
            var category = await _context.FriendshipCategories.FirstOrDefaultAsync(c =>
                c.Id == categoryId && c.UserId == currentUserId
            );

            if (category == null)
                return false;

            // Find the category member entry
            var categoryMember = await _context.CategoryMembers.FirstOrDefaultAsync(c =>
                c.CategoryId == categoryId && c.FriendId == friendId
            );

            if (categoryMember == null)
                return false;

            _context.CategoryMembers.Remove(categoryMember);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
    }
}
