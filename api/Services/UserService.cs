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
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<bool> DeleteAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(string userId);

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
                .Include(u => u.FriendshipCategories)
                .ThenInclude(fc => fc.CategoryMembers)
                .ThenInclude(cm => cm.Friend)
                .Include(u => u.WindowParticipants)
                .ThenInclude(wp => wp.Window)
                // Include hangout-related entities
                .Include(u => u.HangoutGuests)
                .ThenInclude(hg => hg.Hangout)
                .Include(u => u.HangoutRequestRecipients)
                .ThenInclude(hrr => hrr.HangoutRequest)
                .Include(u => u.JoinRequests)
                .ThenInclude(jr => jr.Hangout)
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

            // 2. Filter tagalongs (both sent and received) by "Accepted" status
            var sentAcceptedTagalongs =
                user.SentTagalongs?.Where(t => t.Status == Status.Accepted)
                    .Select(t => _mapper.Map<TagalongDto>(t)) ?? Enumerable.Empty<TagalongDto>();

            var receivedAcceptedTagalongs =
                user.ReceivedTagalongs?.Where(t => t.Status == Status.Accepted)
                    .Select(t => _mapper.Map<TagalongDto>(t)) ?? Enumerable.Empty<TagalongDto>();

            userDto.Tagalongs = sentAcceptedTagalongs.Concat(receivedAcceptedTagalongs);

            // 3. Filter for active windows the user is participating in
            userDto.OpenWindows =
                user.WindowParticipants?.Where(wp => wp.Window?.Active == true)
                    .Select(wp => _mapper.Map<WindowDto>(wp.Window))
                ?? Enumerable.Empty<WindowDto>();

            // 4. FriendshipCategories are already loaded - no additional filtering needed
            userDto.FriendshipCategories =
                user.FriendshipCategories?.Select(fc => _mapper.Map<FriendshipCategoryDto>(fc))
                ?? Enumerable.Empty<FriendshipCategoryDto>();

            // Filter hangouts by date
            var now = DateTime.UtcNow;

            // Past hangouts - completed before now
            userDto.PastHangouts =
                user.HangoutGuests?.Where(hg => hg.Hangout != null && hg.Hangout.ConfirmedEnd < now)
                    .Select(hg => _mapper.Map<HangoutDto>(hg.Hangout))
                ?? Enumerable.Empty<HangoutDto>();

            // Upcoming hangouts - start after now
            userDto.UpcomingHangouts =
                user.HangoutGuests?.Where(hg =>
                        hg.Hangout != null && hg.Hangout.ConfirmedStart > now
                    )
                    .Select(hg => _mapper.Map<HangoutDto>(hg.Hangout))
                ?? Enumerable.Empty<HangoutDto>();

            // Upcoming hangout requests - proposed start after now
            userDto.UpcomingHangoutRequests =
                user.HangoutRequestRecipients?.Where(hrr =>
                        hrr.HangoutRequest != null
                        && hrr.HangoutRequest.ProposedStart.HasValue
                        && hrr.HangoutRequest.ProposedStart.Value > now
                    )
                    .Select(hrr => _mapper.Map<HangoutRequestDto>(hrr.HangoutRequest))
                ?? Enumerable.Empty<HangoutRequestDto>();

            // Upcoming join requests - related to hangouts starting after now
            userDto.UpcomingJoinRequests =
                user.JoinRequests?.Where(jr =>
                        jr.Hangout != null && jr.Hangout.ConfirmedStart > now
                    )
                    .Select(jr => _mapper.Map<JoinRequestDto>(jr))
                ?? Enumerable.Empty<JoinRequestDto>();

            return userDto;
        }

        public async Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(
            string query,
            bool? friends = null,
            bool? nonFriends = null,
            int? categoryId = null
        )
        {
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
                .Users.Where(u =>
                    EF.Functions.Like(u.UserName.ToLower(), $"%{query.ToLower()}%")
                    && u.Id != currentUserId
                )
                .Where(u => !rejectedIds.Contains(u.Id));

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
                usersQuery = usersQuery.Where(u =>
                    u.FriendshipCategories.Any(fc => fc.Id == categoryId.Value)
                );
            }

            var users = await usersQuery.ToListAsync();
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }
    }
}
