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
    }

    public class FriendService : IFriendService
    {
        private readonly HyvDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public FriendService(
            HyvDbContext context,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
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
    }
}
