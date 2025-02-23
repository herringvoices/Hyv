using System.ComponentModel.DataAnnotations.Schema;
using Hyv.Models;

namespace Hyv.Models
{
    public class JoinRequest
    {
        public int Id { get; set; }

        [ForeignKey("Hangout")]
        public int HangoutId { get; set; }

        public string UserId { get; set; }

        public Status Status { get; set; }

        // Navigation properties
        public virtual Hangout Hangout { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
