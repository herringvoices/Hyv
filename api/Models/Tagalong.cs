using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class Tagalong
    {
        public int Id { get; set; }

        [ForeignKey("Sender")]
        public string SenderId { get; set; }

        [ForeignKey("Recipient")]
        public string RecipientId { get; set; }

        public Status Status { get; set; } = Status.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Sender { get; set; }
        public virtual User Recipient { get; set; }
    }
}
