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
    public interface ITagalongService
    {
        Task<bool> SendTagalongRequestAsync(string recipientId);
        Task<IEnumerable<TagalongDto>> GetPendingTagalongRequestsAsync(bool? userIsSender = null);
        Task<bool> DeleteAllTagalongRequestsAsync();
        Task<bool> RespondToTagalongRequestAsync(int requestId, string status);

        // Add the missing method to remove a specific tagalong
        Task<bool> RemoveTagalongAsync(int tagalongId);

        // Add new method to remove all tagalongs between two users
        Task<bool> RemoveTagalongsBetweenUsersAsync(string userId1, string userId2);

        // Add new method to find tagalongs between users
        Task<IEnumerable<int>> GetTagalongIdsBetweenUsersAsync(string userId1, string userId2);

        // Add new method to check if a tagalong exists between users
        Task<bool> HasTagalongWithUserAsync(string userId);

        // Change the return type of GetAcceptedTagalongsAsync to return TagalongFriendDto
        Task<IEnumerable<TagalongFriendDto>> GetAcceptedTagalongsAsync();
    }

    public class TagalongService : ITagalongService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public TagalongService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<bool> SendTagalongRequestAsync(string recipientId)
        {
            var senderId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (senderId == null || senderId == recipientId)
                return false;

            bool exists = await _context.Tagalongs.AnyAsync(t =>
                (t.SenderId == senderId && t.RecipientId == recipientId)
                || (t.SenderId == recipientId && t.RecipientId == senderId)
            );
            if (exists)
                return false;

            var tagalong = new Tagalong
            {
                SenderId = senderId,
                RecipientId = recipientId,
                CreatedAt = DateTime.UtcNow,
                Status = Status.Pending,
            };

            _context.Tagalongs.Add(tagalong);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<TagalongDto>> GetPendingTagalongRequestsAsync(
            bool? userIsSender = null
        )
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;
            if (currentUserId == null)
                return new List<TagalongDto>();

            var query = _context
                .Tagalongs.Include(t => t.Sender)
                .Include(t => t.Recipient)
                .Where(t => t.Status == Status.Pending);

            if (userIsSender.HasValue)
                query = userIsSender.Value
                    ? query.Where(t => t.SenderId == currentUserId)
                    : query.Where(t => t.RecipientId == currentUserId);
            else
                query = query.Where(t =>
                    t.SenderId == currentUserId || t.RecipientId == currentUserId
                );

            var pendingRequests = await query.ToListAsync();
            return _mapper.Map<IEnumerable<TagalongDto>>(pendingRequests);
        }

        public async Task<bool> DeleteAllTagalongRequestsAsync()
        {
            _context.Tagalongs.RemoveRange(_context.Tagalongs);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> RespondToTagalongRequestAsync(int requestId, string status)
        {
            var tagalong = await _context.Tagalongs.FindAsync(requestId);
            if (tagalong == null)
                return false;

            if (status == "Accepted")
                tagalong.Status = Status.Accepted;
            else if (status == "Rejected")
                tagalong.Status = Status.Rejected;
            else
                return false;

            _context.Tagalongs.Update(tagalong);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> RemoveTagalongAsync(int tagalongId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            var tagalong = await _context.Tagalongs.FindAsync(tagalongId);

            if (tagalong == null)
                return false;

            // If currentUserId is provided, verify permissions
            if (
                !string.IsNullOrEmpty(currentUserId)
                && tagalong.SenderId != currentUserId
                && tagalong.RecipientId != currentUserId
            )
                return false;

            _context.Tagalongs.Remove(tagalong);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> RemoveTagalongsBetweenUsersAsync(string userId1, string userId2)
        {
            if (string.IsNullOrEmpty(userId1) || string.IsNullOrEmpty(userId2))
                return false;

            var tagalongs = await _context
                .Tagalongs.Where(t =>
                    (t.SenderId == userId1 && t.RecipientId == userId2)
                    || (t.SenderId == userId2 && t.RecipientId == userId1)
                )
                .ToListAsync();

            if (!tagalongs.Any())
                return true; // No tagalongs found is still a success

            _context.Tagalongs.RemoveRange(tagalongs);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<int>> GetTagalongIdsBetweenUsersAsync(
            string userId1,
            string userId2
        )
        {
            if (string.IsNullOrEmpty(userId1) || string.IsNullOrEmpty(userId2))
                return new List<int>();

            return await _context
                .Tagalongs.Where(t =>
                    (t.SenderId == userId1 && t.RecipientId == userId2)
                    || (t.SenderId == userId2 && t.RecipientId == userId1)
                )
                .Select(t => t.Id)
                .ToListAsync();
        }

        public async Task<bool> HasTagalongWithUserAsync(string userId)
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(userId))
                return false;

            return await _context.Tagalongs.AnyAsync(t =>
                (t.SenderId == currentUserId && t.RecipientId == userId)
                || (t.SenderId == userId && t.RecipientId == currentUserId)
            );
        }

        public async Task<IEnumerable<TagalongFriendDto>> GetAcceptedTagalongsAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (currentUserId == null)
                return new List<TagalongFriendDto>();

            // Get all tagalongs where the current user is either sender or recipient
            // and the status is Accepted
            var query = await _context
                .Tagalongs.Include(t => t.Sender)
                .Include(t => t.Recipient)
                .Where(t =>
                    t.Status == Status.Accepted
                    && (t.SenderId == currentUserId || t.RecipientId == currentUserId)
                )
                .ToListAsync();

            // Transform the results to just include the other user as a friend
            var friendDtos = query
                .Select(t =>
                {
                    // Determine which user is the friend (not the current user)
                    var friend = t.SenderId == currentUserId ? t.Recipient : t.Sender;

                    // Map to our friend DTO
                    return new TagalongFriendDto
                    {
                        TagalongId = t.Id,
                        UserId = friend.Id,
                        FirstName = friend.FirstName,
                        LastName = friend.LastName,
                        Email = friend.Email,
                    };
                })
                .ToList();

            return friendDtos;
        }
    }
}
