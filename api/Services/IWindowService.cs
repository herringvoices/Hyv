using Hyv.DTOs;

namespace Hyv.Services
{
    public interface IWindowService
    {
        Task<WindowDto> CreateWindowAsync(WindowDto windowDto);
        Task<IEnumerable<WindowDto>> GetWindowsByDateRangeAsync(
            DateTime start,
            DateTime end,
            string userId
        );
    }
}
