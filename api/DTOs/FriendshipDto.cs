using System;

namespace Hyv.DTOs
{
    public class FriendshipDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int RecepientId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
        public UserDto? Sender { get; set; }
        public UserDto? Recipient { get; set; }
    }
}
