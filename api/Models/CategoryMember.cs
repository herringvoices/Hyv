namespace Hyv.Models
{
    public class CategoryMember
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string FriendId { get; set; }

        // Navigation properties
        public virtual FriendshipCategory FriendshipCategory { get; set; }
        public virtual User Friend { get; set; }
    }
}
