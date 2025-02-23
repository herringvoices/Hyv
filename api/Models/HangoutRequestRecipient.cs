namespace Hyv.Models
{
    public class HangoutRequestRecipient
    {
        public int Id { get; set; }
        public int HangoutRequestId { get; set; }
        public string UserId { get; set; }
        public Status RecipientStatus { get; set; }
        public DateTime InvitedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual HangoutRequest HangoutRequest { get; set; }
        public virtual User User { get; set; }
    }
}
