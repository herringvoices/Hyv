namespace Hyv.DTOs
{
    public class WindowParticipantDto
    {
        public int Id { get; set; }
        public int WindowId { get; set; }
        public string? UserId { get; set; }

        // Remove circular reference to Window
        // public WindowDto? Window { get; set; }
        public UserDto? User { get; set; }
    }
}
