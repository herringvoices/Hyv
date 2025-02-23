namespace Hyv.DTOs
{
    public class HangoutGuestDto
    {
        public int Id { get; set; }
        public int HangoutId { get; set; }
        public string? UserId { get; set; }
        public DateTime JoinedAt { get; set; }
        public HangoutDto? Hangout { get; set; }
        public UserDto? User { get; set; }
    }
}
