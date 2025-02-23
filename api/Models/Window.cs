using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class Window
    {
        public int Id { get; set; }
        public string UserId { get; set; }

        public string Title { get; set; } = "";
        public string PreferredActivity { get; set; } = "";
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public int DaysOfNoticeNeeded { get; set; }
        public bool Active { get; set; } = true;
        public int? HangoutId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [ForeignKey("HangoutId")]
        public virtual Hangout Hangout { get; set; }

        public virtual ICollection<WindowParticipant> WindowParticipants { get; set; } =
            new List<WindowParticipant>();
        public virtual ICollection<WindowVisibility> WindowVisibilities { get; set; } =
            new List<WindowVisibility>();
    }
}
