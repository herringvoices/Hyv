using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class HangoutGuest
    {
        public int Id { get; set; }

        public int HangoutId { get; set; }
        public string UserId { get; set; }
        public DateTime JoinedAt { get; set; }

        // Navigation properties
        // Remove the [ForeignKey] from HangoutId property and place on the navigation property:
        [ForeignKey("HangoutId")]
        public virtual Hangout Hangout { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
