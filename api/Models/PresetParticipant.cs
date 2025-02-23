using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class PresetParticipant
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int PresetId { get; set; }

        // Navigation properties with explicit FK attributes:
        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("PresetId")]
        public Preset Preset { get; set; }
    }
}
