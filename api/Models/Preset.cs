using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class Preset
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string PreferredActivity { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public int DaysOfNoticeNeeded { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public User User { get; set; }
        public ICollection<PresetParticipant> PresetParticipants { get; set; }
        public ICollection<PresetVisibility> PresetVisibilities { get; set; }
    }
}
