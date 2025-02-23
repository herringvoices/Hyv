namespace Hyv.DTOs
{
    public class HangoutRequestRecipientDto
    {
        public int Id { get; set; }
        public int HangoutRequestId { get; set; }
        public string? UserId { get; set; }
        public string RecipientStatus { get; set; }
        public DateTime InvitedAt { get; set; }
        public HangoutRequestDto? HangoutRequest { get; set; }
        public UserDto? User { get; set; }
    }
}
