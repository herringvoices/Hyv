using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync(); // Updated return type
        Task<bool> DeleteAllUsersAsync();

        // Optional filter params
        Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(
            string query,
            bool? friends = null,
            bool? nonFriends = null,
            int? categoryId = null
        );
    }

    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor; // Added field

        public UserService(
            UserManager<User> userManager,
            HyvDbContext context,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor
        ) // Added parameter
        {
            _userManager = userManager;
            _context = context;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _userManager.Users.ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<bool> DeleteAllUsersAsync()
        {
            // Remove all users
            _context.Users.RemoveRange(_context.Users);

            // Save changes
            int result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(
            string query,
            bool? friends = null,
            bool? nonFriends = null,
            int? categoryId = null
        )
        {
            // Exclude logged in user using claims.
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            var usersQuery = _userManager.Users.Where(u =>
                EF.Functions.Like(u.UserName.ToLower(), $"%{query.ToLower()}%")
                && u.Id != currentUserId
            );

            if (friends.HasValue && friends.Value)
            {
                // Filter users having at least one accepted friendship.
                usersQuery = usersQuery.Where(u =>
                    u.SentFriendships.Any(f => f.Status == Status.Accepted)
                    || u.ReceivedFriendships.Any(f => f.Status == Status.Accepted)
                );
            }

            if (nonFriends.HasValue && nonFriends.Value)
            {
                // Filter users with no friendships.
                usersQuery = usersQuery.Where(u =>
                    !u.SentFriendships.Any() && !u.ReceivedFriendships.Any()
                );
            }

            if (categoryId.HasValue)
            {
                // Filter users belonging to a specific friendship category.
                usersQuery = usersQuery.Where(u =>
                    u.FriendshipCategories.Any(fc => fc.Id == categoryId.Value)
                );
            }

            var users = await usersQuery.ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }
    }
}
