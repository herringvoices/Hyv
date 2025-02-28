using System.Collections.Generic;
using System.Globalization;
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
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<bool> DeleteAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(string userId);
        Task<UserDto> UpdateUserAsync(UserUpdateDto userUpdateDto); // Added missing method

        // Optional filter params
        Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(
            string query = null, // Make query properly optional by giving it a default value
            bool? friends = null,
            bool? nonFriends = null,
            int? categoryId = null
        );

        // New dedicated method for getting users by category
        Task<IEnumerable<UserDto>> GetUsersByCategoryIdAsync(int categoryId);
    }

    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserService(
            UserManager<User> userManager,
            HyvDbContext context,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor
        )
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
            _context.Users.RemoveRange(_context.Users);

            int result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<UserDto> GetUserByIdAsync(string userId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            var user = await _userManager
                .Users.Include(u => u.SentFriendships)
                .ThenInclude(f => f.Recipient)
                .Include(u => u.ReceivedFriendships)
                .ThenInclude(f => f.Sender)
                .Include(u => u.SentTagalongs)
                .ThenInclude(t => t.Recipient)
                .Include(u => u.ReceivedTagalongs)
                .ThenInclude(t => t.Sender)
                .Include(u => u.WindowParticipants)
                .ThenInclude(wp => wp.Window)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return null;

            var userDto = _mapper.Map<UserDto>(user);

            // Apply business logic filtering after mapping

            // 1. Filter friendships (both sent and received) by "Accepted" status
            var sentAcceptedFriendships =
                user.SentFriendships?.Where(f => f.Status == Status.Accepted)
                    .Select(f => _mapper.Map<FriendshipDto>(f))
                ?? Enumerable.Empty<FriendshipDto>();

            var receivedAcceptedFriendships =
                user.ReceivedFriendships?.Where(f => f.Status == Status.Accepted)
                    .Select(f => _mapper.Map<FriendshipDto>(f))
                ?? Enumerable.Empty<FriendshipDto>();

            userDto.Friendships = sentAcceptedFriendships.Concat(receivedAcceptedFriendships);

            // 2. Filter tagalongs (both sent and received) by "Accepted" status AND involving current user
            var sentAcceptedTagalongs =
                user.SentTagalongs?.Where(t =>
                        t.Status == Status.Accepted
                        && (t.SenderId == currentUserId || t.RecipientId == currentUserId)
                    )
                    .Select(t => _mapper.Map<TagalongDto>(t)) ?? Enumerable.Empty<TagalongDto>();

            var receivedAcceptedTagalongs =
                user.ReceivedTagalongs?.Where(t =>
                        t.Status == Status.Accepted
                        && (t.SenderId == currentUserId || t.RecipientId == currentUserId)
                    )
                    .Select(t => _mapper.Map<TagalongDto>(t)) ?? Enumerable.Empty<TagalongDto>();

            userDto.Tagalongs = sentAcceptedTagalongs.Concat(receivedAcceptedTagalongs);

            // 3. Filter for active windows the user is participating in
            userDto.OpenWindows =
                user.WindowParticipants?.Where(wp => wp.Window?.Active == true)
                    .Select(wp => _mapper.Map<WindowDto>(wp.Window))
                ?? Enumerable.Empty<WindowDto>();

            // 4. Modified: Get categories created by the logged-in user where the fetched user is a member
            if (!string.IsNullOrEmpty(currentUserId))
            {
                var categories = await _context
                    .FriendshipCategories.Include(fc => fc.CategoryMembers)
                    .ThenInclude(cm => cm.Friend)
                    .Where(fc =>
                        fc.UserId == currentUserId
                        && fc.CategoryMembers.Any(cm => cm.FriendId == userId)
                    )
                    .ToListAsync();

                userDto.FriendshipCategories = _mapper.Map<IEnumerable<FriendshipCategoryDto>>(
                    categories
                );
            }
            else
            {
                userDto.FriendshipCategories = Enumerable.Empty<FriendshipCategoryDto>();
            }

            return userDto;
        }

        public async Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(
            string query = null, // Make query properly optional by giving it a default value
            bool? friends = null,
            bool? nonFriends = null,
            int? categoryId = null
        )
        {
            // Only check for query if no other filters are provided
            if (
                string.IsNullOrEmpty(query)
                && !categoryId.HasValue
                && !friends.HasValue
                && !nonFriends.HasValue
            )
            {
                // Return empty result if no search criteria provided
                return new List<UserDto>();
            }

            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            var friendsFromSender = _context
                .Friendships.Where(f => f.Status == Status.Accepted && f.SenderId == currentUserId)
                .Select(f => f.RecipientId);
            var friendsFromRecipient = _context
                .Friendships.Where(f =>
                    f.Status == Status.Accepted && f.RecipientId == currentUserId
                )
                .Select(f => f.SenderId);
            var friendIds = await friendsFromSender.Union(friendsFromRecipient).ToListAsync();

            var rejectedFromSender = _context
                .Friendships.Where(f => f.Status == Status.Rejected && f.SenderId == currentUserId)
                .Select(f => f.RecipientId);
            var rejectedFromRecipient = _context
                .Friendships.Where(f =>
                    f.Status == Status.Rejected && f.RecipientId == currentUserId
                )
                .Select(f => f.SenderId);
            var rejectedIds = await rejectedFromSender.Union(rejectedFromRecipient).ToListAsync();

            var usersQuery = _userManager
                .Users.Where(u => u.Id != currentUserId)
                .Where(u => !rejectedIds.Contains(u.Id));

            // Only apply username filtering if query is provided and not empty
            if (!string.IsNullOrEmpty(query))
            {
                usersQuery = usersQuery.Where(u =>
                    EF.Functions.Like(u.UserName.ToLower(), $"%{query.ToLower()}%")
                );
            }

            if (friends.HasValue && friends.Value)
            {
                usersQuery = usersQuery.Where(u => friendIds.Contains(u.Id));
            }

            if (nonFriends.HasValue && nonFriends.Value)
            {
                usersQuery = usersQuery.Where(u => !friendIds.Contains(u.Id));
            }

            if (categoryId.HasValue)
            {
                // Fix the category filtering to find users who are members of the specified category
                // using the correct CategoryId property name
                var categoryMemberIds = await _context
                    .CategoryMembers.Where(cm =>
                        cm.CategoryId == categoryId.Value
                        && cm.FriendshipCategory.UserId == currentUserId
                    )
                    .Select(cm => cm.FriendId)
                    .ToListAsync();

                usersQuery = usersQuery.Where(u => categoryMemberIds.Contains(u.Id));
            }

            var users = await usersQuery.ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<IEnumerable<UserDto>> GetUsersByCategoryIdAsync(int categoryId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Enumerable.Empty<UserDto>();
            }

            // Get all friendIds who are members of this category using the correct property name
            var categoryMemberIds = await _context
                .CategoryMembers.Where(cm =>
                    cm.CategoryId == categoryId && cm.FriendshipCategory.UserId == currentUserId
                )
                .Select(cm => cm.FriendId)
                .ToListAsync();

            if (categoryMemberIds.Count == 0)
            {
                return Enumerable.Empty<UserDto>();
            }

            // Get the actual users
            var users = await _userManager
                .Users.Where(u => categoryMemberIds.Contains(u.Id))
                .ToListAsync();

            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDto> UpdateUserAsync(UserUpdateDto userUpdateDto)
        {
            var user = await _userManager.FindByIdAsync(userUpdateDto.Id);
            if (user == null)
                return null;

            // Only update name fields
            user.FirstName = userUpdateDto.FirstName ?? user.FirstName;
            user.LastName = userUpdateDto.LastName ?? user.LastName;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return null;

            return await GetUserByIdAsync(user.Id);
        }
    }
}

