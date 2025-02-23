using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class HangoutRequest
    {
        public int Id { get; set; }

        [ForeignKey("HangoutId")] // can be omitted if using Fluent API
        public int HangoutId { get; set; }

        public string SenderId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? ProposedStart { get; set; }
        public DateTime? ProposedEnd { get; set; }
        public bool IsOpen { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Hangout Hangout { get; set; }

        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; }

        public virtual ICollection<HangoutGuest> Recipients { get; set; }
        public virtual ICollection<HangoutRequestRecipient> RequestRecipients { get; set; }
    }
}
