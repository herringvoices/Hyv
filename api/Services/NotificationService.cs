using System.Linq;
using System.Threading.Tasks;
using Hyv.Data;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface INotificationService
    {
        Task<RelationshipNotificationCountDto> GetPendingCountsAsync();
    }

    public class NotificationService : INotificationService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificationService(HyvDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
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
    }

    public class RelationshipNotificationCountDto
    {
        public int FriendRequestCount { get; set; }
        public int TagalongRequestCount { get; set; }
        public int Total => FriendRequestCount + TagalongRequestCount;
    }
}
