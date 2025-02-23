using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class WindowParticipant
    {
        public int Id { get; set; }
        public int WindowId { get; set; }
        public string UserId { get; set; }

        // Navigation properties
        [ForeignKey("WindowId")]
        public Window Window { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}
