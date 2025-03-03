namespace Hyv.DTOs
{
    public class WindowVisibilityDto
    {
        public int Id { get; set; }
        public int WindowId { get; set; }
        public int CategoryId { get; set; }

        // Remove circular reference to Window - this is causing the StackOverflowException
        // public WindowDto? Window { get; set; }

        public FriendshipCategoryDto? Category { get; set; }
    }
}
