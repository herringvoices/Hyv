namespace Hyv.DTOs
{
    public class PresetDto
    {
        public string? Id { get; set; } // FullCalendar expects a string ID
        public string Title { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }

        // All additional properties must be inside ExtendedProps
        public PresetExtendedPropsDto ExtendedProps { get; set; }
    }

    public class PresetExtendedPropsDto
    {
        public string? UserId { get; set; }
        public string? PreferredActivity { get; set; }
        public int? DaysOfNoticeNeeded { get; set; }
        public DateTime? CreatedAt { get; set; }

        // Optional expansions - now inside ExtendedProps
        public UserDto? User { get; set; }
        public List<PresetParticipantDto>? Participants { get; set; }
        public List<PresetVisibilityDto>? Visibilities { get; set; }
    }
}
