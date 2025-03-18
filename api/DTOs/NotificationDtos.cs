namespace Hyv.DTOs
{
    public class RelationshipNotificationCountDto
    {
        public int FriendRequestCount { get; set; }
        public int TagalongRequestCount { get; set; }
        public int Total => FriendRequestCount + TagalongRequestCount;
    }

    public class HangoutNotificationCountDto
    {
        public int HangoutRequestCount { get; set; }
        public int JoinRequestCount { get; set; }
        public int Total => HangoutRequestCount + JoinRequestCount;
    }
}
