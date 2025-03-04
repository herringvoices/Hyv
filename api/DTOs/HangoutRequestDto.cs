using Hyv.Models;

namespace Hyv.DTOs
{
    public class HangoutRequestDto
    {
        public int Id { get; set; }
        public int HangoutId { get; set; }
        public string? SenderId { get; set; }
        public List<string> RecipientIds { get; set; } = new();
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? ProposedStart { get; set; }
        public DateTime? ProposedEnd { get; set; }
        public bool IsOpen { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public HangoutDto? Hangout { get; set; }
        public UserDto? Sender { get; set; }
        public List<UserDto>? Recipients { get; set; }
    }

    public class HangoutRequestCreateDto : HangoutRequestDto
    {
        public List<string> RecipientUserIds { get; set; } = new();
    }
}
