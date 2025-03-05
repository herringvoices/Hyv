using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IHangoutService
    {
        Task<HangoutRequestDto> CreateHangoutRequestAsync(HangoutRequestCreateDto createDto);
        Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestRecipientsAsync();
        Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestsForUserAsync(string userId);
        // Add other existing methods here
    }

    public class HangoutService : IHangoutService
    {
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HangoutService(
            HyvDbContext context,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor
        )
        {
            _context = context;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<HangoutRequestDto> CreateHangoutRequestAsync(
            HangoutRequestCreateDto createDto
        )
        {
            // First create a Hangout entity
            var hangout = new Hangout
            {
                Title = createDto.Title,
                Description = createDto.Description,
                ConfirmedStart = createDto.ProposedStart ?? DateTime.UtcNow,
                ConfirmedEnd = createDto.ProposedEnd ?? DateTime.UtcNow.AddHours(1),
                Active = false,
            };

            // Add the hangout to the context
            await _context.Hangouts.AddAsync(hangout);
            await _context.SaveChangesAsync();

            // Now create the hangout request entity from the DTO
            var hangoutRequest = _mapper.Map<HangoutRequest>(createDto);

            // Associate with the newly created hangout
            hangoutRequest.HangoutId = hangout.Id;

            // Set creation date to now if not provided
            if (hangoutRequest.CreatedAt == default)
            {
                hangoutRequest.CreatedAt = DateTime.UtcNow;
            }

            // Add the new hangout request to the context
            await _context.HangoutRequests.AddAsync(hangoutRequest);

            // Save to get the generated ID
            await _context.SaveChangesAsync();

            // Create a recipient entry for each user ID
            if (createDto.RecipientUserIds?.Any() == true)
            {
                var recipients = createDto.RecipientUserIds.Select(
                    userId => new HangoutRequestRecipient
                    {
                        HangoutRequestId = hangoutRequest.Id,
                        UserId = userId,
                        RecipientStatus = Status.Pending, // Default status
                        InvitedAt = DateTime.UtcNow,
                    }
                );

                await _context.HangoutRequestRecipients.AddRangeAsync(recipients);
                await _context.SaveChangesAsync();
            }

            // Fetch the complete hangout request with recipients
            var completeHangoutRequest = await _context
                .HangoutRequests.Include(hr => hr.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .Include(hr => hr.Hangout)
                .Include(hr => hr.Sender)
                .FirstOrDefaultAsync(hr => hr.Id == hangoutRequest.Id);

            // Map to DTO and return
            return _mapper.Map<HangoutRequestDto>(completeHangoutRequest);
        }

        public async Task<
            List<HangoutRequestRecipientDto>
        > GetPendingHangoutRequestRecipientsAsync()
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId))
            {
                return new List<HangoutRequestRecipientDto>();
            }

            // Get all pending requests where the current user is a recipient
            var pendingRequests = await _context
                .HangoutRequestRecipients.Where(rr =>
                    rr.UserId == currentUserId && rr.RecipientStatus == Status.Pending
                )
                // Include the HangoutRequest with Sender info
                .Include(rr => rr.HangoutRequest)
                .ThenInclude(hr => hr.Sender)
                // Include the User info of the recipient
                .Include(rr => rr.User)
                // Include all other recipients of the same HangoutRequest
                .Include(rr => rr.HangoutRequest.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .ToListAsync();

            return _mapper.Map<List<HangoutRequestRecipientDto>>(pendingRequests);
        }

        public async Task<List<HangoutRequestRecipientDto>> GetPendingHangoutRequestsForUserAsync(
            string userId
        )
        {
            var currentUserId = _httpContextAccessor
                .HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(userId))
            {
                return new List<HangoutRequestRecipientDto>();
            }

            // Get all pending requests where:
            // - The specified user is the recipient
            // - The current user is the sender
            // - The status is pending
            var pendingRequests = await _context
                .HangoutRequestRecipients.Where(rr =>
                    rr.UserId == userId
                    && rr.RecipientStatus == Status.Pending
                    && rr.HangoutRequest.SenderId == currentUserId
                )
                // Include the HangoutRequest with Sender info
                .Include(rr => rr.HangoutRequest)
                .ThenInclude(hr => hr.Sender)
                // Include the User info of the recipient
                .Include(rr => rr.User)
                // Include all other recipients of the same HangoutRequest
                .Include(rr => rr.HangoutRequest.RequestRecipients)
                .ThenInclude(rr => rr.User)
                .ToListAsync();

            return _mapper.Map<List<HangoutRequestRecipientDto>>(pendingRequests);
        }

        // Add other existing methods here
    }
}
