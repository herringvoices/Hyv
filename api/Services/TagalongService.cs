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
    }
}
