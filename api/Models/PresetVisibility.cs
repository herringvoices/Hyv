using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class PresetVisibility
    {
        public int Id { get; set; }
        public int PresetId { get; set; }
        public int CategoryId { get; set; }

        // Navigation properties
        [ForeignKey("PresetId")]
        public virtual Preset Preset { get; set; }

        [ForeignKey("CategoryId")]
        public virtual FriendshipCategory FriendshipCategory { get; set; }
    }
}
