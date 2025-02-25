using System.ComponentModel.DataAnnotations;

namespace Hyv.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(30, MinimumLength = 3)]
        [RegularExpression(
            @"^[a-zA-Z0-9_-]+$",
            ErrorMessage = "Username can only contain letters, numbers, underscores and hyphens"
        )]
        public string UserName { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
