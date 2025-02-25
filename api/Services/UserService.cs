using System.Collections.Generic;
using System.Threading.Tasks;
using Hyv.Data;
using Hyv.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<bool> DeleteAllUsersAsync(); // Add this method to the interface
    }

    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly HyvDbContext _context; // Add the context

        public UserService(UserManager<User> userManager, HyvDbContext context)
        {
            _userManager = userManager;
            _context = context; // Initialize the context
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _userManager.Users.ToListAsync();
        }

        public async Task<bool> DeleteAllUsersAsync()
        {
            // Remove all users
            _context.Users.RemoveRange(_context.Users);

            // Save changes
            int result = await _context.SaveChangesAsync();
            return result > 0;
        }
    }
}
