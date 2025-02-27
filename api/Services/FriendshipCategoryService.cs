using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IFriendshipCategoryService
    {
        Task<bool> CreateCategoryAsync(string name);
        Task<IEnumerable<FriendshipCategoryDto>> GetAllCategoriesAsync();
        Task<bool> UpdateCategoryNameAsync(int categoryId, string newName);
        Task<bool> DeleteCategoryAsync(int categoryId); // Added method
    }

    public class FriendshipCategoryService : IFriendshipCategoryService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public FriendshipCategoryService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
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

        public async Task<IEnumerable<FriendshipCategoryDto>> GetAllCategoriesAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return Enumerable.Empty<FriendshipCategoryDto>();

            var categories = await _context
                .FriendshipCategories.Include(fc => fc.CategoryMembers)
                .ThenInclude(cm => cm.Friend)
                .Where(fc => fc.UserId == currentUserId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<FriendshipCategoryDto>>(categories);
        }

        public async Task<bool> UpdateCategoryNameAsync(int categoryId, string newName)
        {
            if (string.IsNullOrEmpty(newName))
                return false;

            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return false;

            var category = await _context.FriendshipCategories.FirstOrDefaultAsync(c =>
                c.Id == categoryId && c.UserId == currentUserId
            );

            if (category == null)
                return false;

            category.Name = newName;
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> DeleteCategoryAsync(int categoryId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return false;

            // Find the category and verify ownership
            var category = await _context
                .FriendshipCategories.Include(c => c.CategoryMembers)
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == currentUserId);

            if (category == null)
                return false;

            // Remove related category members first
            _context.CategoryMembers.RemoveRange(category.CategoryMembers);

            // Remove the category itself
            _context.FriendshipCategories.Remove(category);

            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
    }
}
