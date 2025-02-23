namespace Hyv.Models
{
    public class FriendshipCategory
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }

        // Navigation properties
        public virtual User User { get; set; }
        public virtual ICollection<CategoryMember> CategoryMembers { get; set; } =
            new List<CategoryMember>();
    }
}
