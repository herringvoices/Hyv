using System;

namespace Hyv.DTOs
{
    public class TagalongDto
    {
        public int Id { get; set; }
        public string SenderId { get; set; }
        public string RecipientId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; }

        // Navigation properties
        public UserDto Sender { get; set; }
        public UserDto Recipient { get; set; }
    }
}
