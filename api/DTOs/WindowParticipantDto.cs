namespace Hyv.DTOs
{
    public class WindowParticipantDto
    {
        public int Id { get; set; }
        public int WindowId { get; set; }
        public string? UserId { get; set; }
        public WindowDto? Window { get; set; }
        public UserDto? User { get; set; }
    }
}
