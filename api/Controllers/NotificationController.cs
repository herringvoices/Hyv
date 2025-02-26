using System.Threading.Tasks;
using Hyv.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hyv.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("pending-counts")]
        public async Task<IActionResult> GetPendingCounts()
        {
            var counts = await _notificationService.GetPendingCountsAsync();
            return Ok(counts);
        }
    }
}
