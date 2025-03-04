using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Hyv.Data;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IHangoutService
    {
        Task<HangoutRequestDto> CreateHangoutRequestAsync(HangoutRequestCreateDto createDto);
        // Add other existing methods here
    }

    public class HangoutService : IHangoutService
    {
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper;

        public HangoutService(HyvDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

        // Add other existing methods here
    }
}
