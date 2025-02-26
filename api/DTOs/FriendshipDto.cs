using System;

namespace Hyv.DTOs
{
    public class FriendshipDto
    {
        public int Id { get; set; }
        public string SenderId { get; set; }
        public string RecipientId { get; set; } // Fixed property name here
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }
        public UserDto? Sender { get; set; }
        public UserDto? Recipient { get; set; }
    }
}
