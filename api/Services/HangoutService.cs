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
        Task<IEnumerable<HangoutDto>> GetHangoutsByUserIdAsync(
            string userId,
            bool? past = null,
            int? limit = null,
            int? offset = 0
        );

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

        public async Task<IEnumerable<HangoutDto>> GetHangoutsByUserIdAsync(
            string userId,
            bool? past = null,
            int? limit = null,
            int? offset = 0
        )
        {
            var now = DateTime.UtcNow;

            // Start with base query for this user's hangouts
            var query = _context
                .HangoutGuests.Where(hg => hg.UserId == userId)
                .Include(hg => hg.Hangout)
                .ThenInclude(h => h.HangoutGuests)
                .ThenInclude(hg => hg.User)
                .AsQueryable();

            // Filter based on past parameter
            if (past.HasValue)
            {
                if (past.Value)
                {
                    // Past hangouts (end date is in the past)
                    query = query.Where(hg => hg.Hangout.ConfirmedEnd < now);
                    // Order by most recent first
                    query = query.OrderByDescending(hg => hg.Hangout.ConfirmedEnd);
                }
                else
                {
                    // Future hangouts (start date is in the future)
                    query = query.Where(hg => hg.Hangout.ConfirmedStart > now);
                    // Order by earliest first
                    query = query.OrderBy(hg => hg.Hangout.ConfirmedStart);
                }
            }
            else
            {
                // All hangouts, ordered by date (future first, then past)
                query = query
                    .OrderBy(hg => hg.Hangout.ConfirmedStart < now)
                    .ThenBy(hg => hg.Hangout.ConfirmedStart);
            }

            // Apply pagination
            if (offset.HasValue && offset.Value > 0)
            {
                query = query.Skip(offset.Value);
            }

            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Take(limit.Value);
            }

            // Execute query and map results
            var hangoutGuests = await query.ToListAsync();

            // Map the hangouts and include guest information
            var hangoutDtos = hangoutGuests
                .Select(hg =>
                {
                    var hangoutDto = _mapper.Map<HangoutDto>(hg.Hangout);
                    hangoutDto.Guests = hg
                        .Hangout.HangoutGuests.Select(g => _mapper.Map<UserDto>(g.User))
                        .ToList();
                    return hangoutDto;
                })
                .Distinct() // Ensure unique hangouts
                .ToList();

            return hangoutDtos;
        }

        public async Task<HangoutRequestDto> CreateHangoutRequestAsync(
            HangoutRequestCreateDto createDto
        )
        {
            // Create the hangout request entity from the DTO
            var hangoutRequest = _mapper.Map<HangoutRequest>(createDto);

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
