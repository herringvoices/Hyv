using System.Collections.Generic;

namespace Hyv.DTOs
{
    public class UserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }

        // Added related collections
        public IEnumerable<FriendshipDto> Friendships { get; set; } = new List<FriendshipDto>();
        public IEnumerable<TagalongDto> Tagalongs { get; set; } = new List<TagalongDto>();
        public IEnumerable<FriendshipCategoryDto> FriendshipCategories { get; set; } =
            new List<FriendshipCategoryDto>();
        public IEnumerable<WindowDto> OpenWindows { get; set; } = new List<WindowDto>();

        public IEnumerable<HangoutDto> PastHangouts { get; set; } = new List<HangoutDto>();
        public IEnumerable<HangoutDto> UpcomingHangouts { get; set; } = new List<HangoutDto>();
        public IEnumerable<HangoutRequestDto> UpcomingHangoutRequests { get; set; } =
            new List<HangoutRequestDto>();
        public IEnumerable<JoinRequestDto> UpcomingJoinRequests { get; set; } =
            new List<JoinRequestDto>();
    }
}
