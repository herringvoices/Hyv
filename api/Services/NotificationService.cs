using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface INotificationService
    {
        Task<RelationshipNotificationCountDto> GetPendingCountsAsync();
        Task<HangoutNotificationCountDto> GetHangoutNotificationCountsAsync();
    }

    public class NotificationService : INotificationService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public NotificationService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<RelationshipNotificationCountDto> GetPendingCountsAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?.Value;
            if (string.IsNullOrEmpty(currentUserId))
                return new RelationshipNotificationCountDto
                {
                    FriendRequestCount = 0,
                    TagalongRequestCount = 0,
                };

            // Count pending friendships where current user is the recipient
            var pendingFriendshipCount = await _context.Friendships.CountAsync(f =>
                f.RecipientId == currentUserId && f.Status == Status.Pending
            );

            // Count pending tagalongs where current user is the recipient
            var pendingTagalongCount = await _context.Tagalongs.CountAsync(t =>
                t.RecipientId == currentUserId && t.Status == Status.Pending
            );

            return new RelationshipNotificationCountDto
            {
                FriendRequestCount = pendingFriendshipCount,
                TagalongRequestCount = pendingTagalongCount,
            };
        }

        public async Task<HangoutNotificationCountDto> GetHangoutNotificationCountsAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?.Value;
            if (string.IsNullOrEmpty(currentUserId))
                return new HangoutNotificationCountDto
                {
                    HangoutRequestCount = 0,
                    JoinRequestCount = 0,
                };

            // Count pending hangout requests where current user is a recipient
            var pendingHangoutRequestCount = await _context.HangoutRequestRecipients.CountAsync(
                hr => hr.UserId == currentUserId && hr.RecipientStatus == Status.Pending
            );

            // Get hangouts where the current user is a guest/participant
            var userHangouts = await _context
                .HangoutGuests.Where(hg => hg.UserId == currentUserId)
                .Select(hg => hg.HangoutId)
                .Distinct()
                .ToListAsync();

            // Count pending join requests for hangouts where the user is a guest
            var pendingJoinRequestCount = await _context.JoinRequests.CountAsync(jr =>
                userHangouts.Contains(jr.HangoutId) && jr.Status == Status.Pending
            );

            return new HangoutNotificationCountDto
            {
                HangoutRequestCount = pendingHangoutRequestCount,
                JoinRequestCount = pendingJoinRequestCount,
            };
        }
    }
}
