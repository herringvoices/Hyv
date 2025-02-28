using System;
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
    public interface IFriendService
    {
        Task<IEnumerable<UserDto>> GetFriendsAsync(string search);
        Task<bool> RemoveFriendAsync(string friendId);
        Task<bool> BlockUserAsync(string userIdToBlock);
    }

    public class FriendService : IFriendService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;
        private readonly ITagalongService _tagalongService;

        public FriendService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper,
            ITagalongService tagalongService
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
            _tagalongService = tagalongService;
        }

        public async Task<IEnumerable<UserDto>> GetFriendsAsync(string search)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (currentUserId == null)
                return new List<UserDto>();

            // Union friends from both sides.
            var friendsFromSender = _context
                .Friendships.Where(f => f.Status == Status.Accepted && f.SenderId == currentUserId)
                .Select(f => f.Recipient);
            var friendsFromRecipient = _context
                .Friendships.Where(f =>
                    f.Status == Status.Accepted && f.RecipientId == currentUserId
                )
                .Select(f => f.Sender);
            var unionFriends = friendsFromSender.Union(friendsFromRecipient);

            // Materialize the union result.
            var friendList = await unionFriends.ToListAsync();

            // Apply search filter in-memory.
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                friendList = friendList
                    .Where(u =>
                        u.UserName.ToLower().Contains(lowerSearch)
                        || u.FullName.ToLower().Contains(lowerSearch)
                    )
                    .ToList();
            }

            return _mapper.Map<IEnumerable<UserDto>>(friendList);
        }

        public async Task<bool> RemoveFriendAsync(string friendId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (string.IsNullOrEmpty(currentUserId) || currentUserId == friendId)
                return false;

            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                (f.SenderId == currentUserId && f.RecipientId == friendId)
                || (f.SenderId == friendId && f.RecipientId == currentUserId)
            );

            if (friendship == null)
                return false;

            // Remove any tagalongs between these users
            var tagalongIds = await _tagalongService.GetTagalongIdsBetweenUsersAsync(
                currentUserId,
                friendId
            );
            foreach (var tagalongId in tagalongIds)
            {
                await _tagalongService.RemoveTagalongAsync(tagalongId);
            }

            _context.Friendships.Remove(friendship);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> BlockUserAsync(string userIdToBlock)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (string.IsNullOrEmpty(currentUserId) || currentUserId == userIdToBlock)
                return false;

            // Remove any tagalongs between these users
            var tagalongIds = await _tagalongService.GetTagalongIdsBetweenUsersAsync(
                currentUserId,
                userIdToBlock
            );
            foreach (var tagalongId in tagalongIds)
            {
                await _tagalongService.RemoveTagalongAsync(tagalongId);
            }

            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                (f.SenderId == currentUserId && f.RecipientId == userIdToBlock)
                || (f.SenderId == userIdToBlock && f.RecipientId == currentUserId)
            );

            if (friendship != null)
            {
                friendship.Status = Status.Rejected;
                _context.Friendships.Update(friendship);
            }
            else
            {
                _context.Friendships.Add(
                    new Friendship
                    {
                        SenderId = currentUserId,
                        RecipientId = userIdToBlock,
                        Status = Status.Rejected,
                        CreatedAt = DateTime.UtcNow,
                    }
                );
            }
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
