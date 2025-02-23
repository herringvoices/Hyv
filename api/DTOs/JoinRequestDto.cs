using Hyv.Models;

namespace Hyv.DTOs
{
    public class JoinRequestDto
    {
        public int Id { get; set; }
        public int HangoutId { get; set; }
        public string? UserId { get; set; }
        public Status Status { get; set; }
        public HangoutDto? Hangout { get; set; }
        public UserDto? User { get; set; }
    }
}
