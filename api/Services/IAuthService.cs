using System.Threading.Tasks;
using Hyv.DTOs;

namespace Hyv.Services
{
    public interface IAuthService
    {
        Task<AuthResultDto> LoginAsync(LoginDto loginDto);
        Task<AuthResultDto> GetCurrentUserAsync();
        Task<AuthResultDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResultDto> LogoutAsync();
    }
}
