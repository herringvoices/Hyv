using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class Friendship
    {
        public int Id { get; set; }

        [ForeignKey("Sender")]
        public string SenderId { get; set; }

        [ForeignKey("Recipient")]
        public string RecipientId { get; set; } 

        public DateTime CreatedAt { get; set; }
        public Status Status { get; set; }

        // Navigation properties
        public virtual User Sender { get; set; }
        public virtual User Recipient { get; set; }
    }
}
