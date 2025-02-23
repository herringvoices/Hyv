using System;

namespace Hyv.DTOs
{
    public class TagalongDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int RecipientId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserDto? Sender { get; set; }
        public UserDto? Recipient { get; set; }

    
    }
}
