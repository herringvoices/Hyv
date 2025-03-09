using System.ComponentModel.DataAnnotations.Schema;

namespace Hyv.Models
{
    public class CategoryMember
    {
        public int Id { get; set; }
        
        [ForeignKey("FriendshipCategory")]
        public int CategoryId { get; set; }  // Keep original property name with ForeignKey attribute
        public string FriendId { get; set; }

        // Navigation properties
        public virtual FriendshipCategory FriendshipCategory { get; set; }
        public virtual User Friend { get; set; }
    }
}
