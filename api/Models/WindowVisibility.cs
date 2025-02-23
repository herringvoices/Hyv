namespace Hyv.Models
{
    public class WindowVisibility
    {
        public int Id { get; set; }
        public int WindowId { get; set; }
        public int CategoryId { get; set; }

        // Navigation properties
        public virtual Window Window { get; set; }
        public virtual FriendshipCategory Category { get; set; }
    }
}
