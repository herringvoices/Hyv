using System;
using System.Collections.Generic;
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
    public interface IFriendRequestService
    {
        Task<bool> SendFriendRequestAsync(string recipientId);

        // Updated method signature with optional userIsSender filter.
        Task<IEnumerable<FriendshipDto>> GetPendingFriendRequestsAsync(bool? userIsSender = null);

        // New method: delete all friend requests.
        Task<bool> DeleteAllFriendRequestsAsync();
    }

    public class FriendRequestService : IFriendRequestService
    {
        private readonly UserManager<User> _userManager;
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public FriendRequestService(
            UserManager<User> userManager,
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _userManager = userManager;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<bool> SendFriendRequestAsync(string recipientId)
        {
            var senderId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (senderId == null || senderId == recipientId)
                return false;

            // Optionally check if recipient exists
            var recipient = await _userManager.FindByIdAsync(recipientId);
            if (recipient == null)
                return false;

            // Optionally check if friendship already exists
            bool exists = await _context.Friendships.AnyAsync(f =>
                (f.SenderId == senderId && f.RecipientId == recipientId)
                || (f.SenderId == recipientId && f.RecipientId == senderId)
            );
            if (exists)
                return false;

            var friendship = new Friendship
            {
                SenderId = senderId,
                RecipientId = recipientId,
                CreatedAt = DateTime.UtcNow,
                Status = Status.Pending,
            };

            _context.Friendships.Add(friendship);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<FriendshipDto>> GetPendingFriendRequestsAsync(
            bool? userIsSender = null
        )
        {
            // Retrieve logged in user id from claims.
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (currentUserId == null)
                return new List<FriendshipDto>();

            var pendingQuery = _context
                .Friendships.Include(f => f.Sender)
                .Include(f => f.Recipient)
                .Where(f => f.Status == Status.Pending);

            if (userIsSender.HasValue)
            {
                if (userIsSender.Value)
                    pendingQuery = pendingQuery.Where(f => f.SenderId == currentUserId);
                else
                    pendingQuery = pendingQuery.Where(f => f.RecipientId == currentUserId);
            }
            else
            {
                pendingQuery = pendingQuery.Where(f =>
                    f.SenderId == currentUserId || f.RecipientId == currentUserId
                );
            }

            var pendingRequests = await pendingQuery.ToListAsync();
            return _mapper.Map<IEnumerable<FriendshipDto>>(pendingRequests);
        }

        public async Task<bool> DeleteAllFriendRequestsAsync()
        {
            // Remove all friend request (friendship) records.
            _context.Friendships.RemoveRange(_context.Friendships);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
