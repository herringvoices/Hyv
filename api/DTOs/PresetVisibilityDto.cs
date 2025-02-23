namespace Hyv.DTOs
{
    public class PresetVisibilityDto
    {
        public int Id { get; set; }
        public int PresetId { get; set; }
        public int CategoryId { get; set; }
        public PresetDto? Preset { get; set; }
        public FriendshipCategoryDto? Category { get; set; }
    }
}
