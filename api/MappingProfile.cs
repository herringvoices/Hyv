using System;
using System.Linq;
using AutoMapper;
using Hyv.DTOs;
using Hyv.Models;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ================================
        // 1. User <-> UserDto
        // ================================
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.ProfilePicture, opt => opt.MapFrom(src => src.ProfilePicture))
            // Ignore these collections as they'll be handled manually in the service
            .ForMember(dest => dest.Friendships, opt => opt.Ignore())
            .ForMember(dest => dest.Tagalongs, opt => opt.Ignore())
            .ForMember(dest => dest.FriendshipCategories, opt => opt.Ignore())
            .ForMember(dest => dest.OpenWindows, opt => opt.Ignore());
        CreateMap<UserDto, User>();

        // ================================
        // 2. Friendship, Category, etc.
        // ================================
        CreateMap<Friendship, FriendshipDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<FriendshipDto, Friendship>()
            .ForMember(
                dest => dest.Status,
                opt => opt.MapFrom(src => Enum.Parse<Status>(src.Status))
            );

        CreateMap<FriendshipCategory, FriendshipCategoryDto>()
            .ForMember(
                dest => dest.Friends,
                opt => opt.MapFrom(src => src.CategoryMembers.Select(cm => cm.Friend))
            );
        CreateMap<FriendshipCategoryDto, FriendshipCategory>()
            .ForMember(dest => dest.CategoryMembers, opt => opt.Ignore());

        CreateMap<CategoryMember, CategoryMemberDto>();
        CreateMap<CategoryMemberDto, CategoryMember>();

        CreateMap<Tagalong, TagalongDto>()
            .ForMember(dest => dest.SenderId, opt => opt.MapFrom(src => src.SenderId))
            .ForMember(dest => dest.RecipientId, opt => opt.MapFrom(src => src.RecipientId))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<TagalongDto, Tagalong>()
            .ForMember(dest => dest.SenderId, opt => opt.MapFrom(src => src.SenderId))
            .ForMember(dest => dest.RecipientId, opt => opt.MapFrom(src => src.RecipientId))
            .ForMember(
                dest => dest.Status,
                opt => opt.MapFrom(src => Enum.Parse<Status>(src.Status))
            );

        // ================================
        // 3. Window <-> WindowDto (FullCalendar with ExtendedProps)
        // ================================
        CreateMap<Window, WindowDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.Start))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.End))
            .ForMember(
                dest => dest.ExtendedProps,
                opt =>
                    opt.MapFrom(
                        (src, dest, destMember, ctx) =>
                            new WindowExtendedPropsDto
                            {
                                UserId = src.UserId,
                                PreferredActivity = src.PreferredActivity,
                                DaysOfNoticeNeeded = src.DaysOfNoticeNeeded,
                                Active = src.Active,
                                HangoutId = src.HangoutId,
                                // Nested objects are mapped via context
                                User =
                                    (src.User == null) ? null : ctx.Mapper.Map<UserDto>(src.User),
                                Hangout =
                                    (src.Hangout == null)
                                        ? null
                                        : ctx.Mapper.Map<HangoutDto>(src.Hangout),
                                Participants =
                                    (src.WindowParticipants == null)
                                        ? null
                                        : src
                                            .WindowParticipants.Select(p =>
                                                ctx.Mapper.Map<WindowParticipantDto>(p)
                                            )
                                            .ToList(),
                                Visibilities =
                                    (src.WindowVisibilities == null)
                                        ? null
                                        : src
                                            .WindowVisibilities.Select(v =>
                                                ctx.Mapper.Map<WindowVisibilityDto>(v)
                                            )
                                            .ToList(),
                            }
                    )
            );

        CreateMap<WindowDto, Window>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => int.Parse(src.Id)))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.Start))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.End))
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.ExtendedProps.UserId))
            .ForMember(
                dest => dest.PreferredActivity,
                opt => opt.MapFrom(src => src.ExtendedProps.PreferredActivity)
            )
            .ForMember(
                dest => dest.DaysOfNoticeNeeded,
                opt => opt.MapFrom(src => src.ExtendedProps.DaysOfNoticeNeeded)
            )
            .ForMember(dest => dest.Active, opt => opt.MapFrom(src => src.ExtendedProps.Active))
            .ForMember(
                dest => dest.HangoutId,
                opt => opt.MapFrom(src => src.ExtendedProps.HangoutId)
            )
            // Ignore nested objects on reverse mapping
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Hangout, opt => opt.Ignore())
            .ForMember(dest => dest.WindowParticipants, opt => opt.Ignore())
            .ForMember(dest => dest.WindowVisibilities, opt => opt.Ignore());

        // Nested mappings for Window sub-objects
        CreateMap<User, UserDto>();
        CreateMap<Hangout, HangoutDto>();
        CreateMap<WindowParticipant, WindowParticipantDto>();
        CreateMap<WindowVisibility, WindowVisibilityDto>();

        // ================================
        // 4. WindowParticipant <-> WindowParticipantDto
        // ================================
        CreateMap<WindowParticipant, WindowParticipantDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User));

        CreateMap<WindowParticipantDto, WindowParticipant>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.Window, opt => opt.Ignore()); // Make sure this is present

        // ================================
        // 5. WindowVisibility <-> WindowVisibilityDto
        // ================================
        CreateMap<WindowVisibility, WindowVisibilityDto>()
            .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => src.CategoryId))
            .ForMember(dest => dest.WindowId, opt => opt.MapFrom(src => src.WindowId))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category));

        CreateMap<WindowVisibilityDto, WindowVisibility>()
            .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => src.CategoryId))
            .ForMember(dest => dest.Window, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.Ignore());

        // ================================
        // 6. Hangout <-> HangoutDto
        // ================================
        CreateMap<Hangout, HangoutDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.ConfirmedStart))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.ConfirmedEnd))
            .ForMember(dest => dest.AllDay, opt => opt.MapFrom(src => false)) // Default to false
            .ForMember(dest => dest.BackgroundColor, opt => opt.UseDestinationValue()) // Use default value from DTO
            .ForMember(dest => dest.TextColor, opt => opt.UseDestinationValue()) // Use default value from DTO
            .ForMember(
                dest => dest.ExtendedProps,
                opt =>
                    opt.MapFrom(
                        (src, dest, destMember, ctx) =>
                            new ExtendedPropsDto
                            {
                                Description = src.Description,
                                Active = src.Active,
                                Guests =
                                    src.HangoutGuests != null
                                        ? src
                                            .HangoutGuests.Select(hg =>
                                                ctx.Mapper.Map<UserDto>(hg.User)
                                            )
                                            .ToList()
                                        : null,
                            }
                    )
            );

        CreateMap<HangoutDto, Hangout>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.ConfirmedStart, opt => opt.MapFrom(src => src.Start))
            .ForMember(dest => dest.ConfirmedEnd, opt => opt.MapFrom(src => src.End))
            .ForMember(
                dest => dest.Description,
                opt => opt.MapFrom(src => src.ExtendedProps.Description)
            )
            .ForMember(dest => dest.Active, opt => opt.MapFrom(src => src.ExtendedProps.Active))
            .ForMember(dest => dest.HangoutRequests, opt => opt.Ignore())
            .ForMember(dest => dest.HangoutGuests, opt => opt.Ignore());

        // ================================
        // 7. HangoutRequest <-> HangoutRequestDto
        // ================================
        CreateMap<HangoutRequest, HangoutRequestDto>()
            .ForMember(
                dest => dest.Recipients,
                opt =>
                    opt.MapFrom(src =>
                        src.RequestRecipients != null
                            ? src.RequestRecipients.Select(rr => rr.User).ToList()
                            : null
                    )
            )
            .ForMember(dest => dest.SenderId, opt => opt.MapFrom(src => src.SenderId));

        CreateMap<HangoutRequestDto, HangoutRequest>()
            .ForMember(dest => dest.RequestRecipients, opt => opt.Ignore())
            .ForMember(dest => dest.SenderId, opt => opt.MapFrom(src => src.SenderId))
            .ForMember(dest => dest.Hangout, opt => opt.Ignore())
            .ForMember(dest => dest.Sender, opt => opt.Ignore());

        // ================================
        // 8. HangoutRequestRecipient <-> HangoutRequestRecipientDto
        // ================================
        CreateMap<HangoutRequestRecipient, HangoutRequestRecipientDto>()
            .ForMember(
                dest => dest.RecipientStatus,
                opt => opt.MapFrom(src => src.RecipientStatus.ToString())
            )
            .ForMember(
                dest => dest.Invitations,
                opt =>
                    opt.MapFrom(
                        (src, dest, destMember, ctx) =>
                        {
                            // Skip if HangoutRequest or its RequestRecipients is null
                            if (src.HangoutRequest?.RequestRecipients == null)
                                return null;

                            // Get all recipients for the same hangout request
                            return src
                                .HangoutRequest.RequestRecipients
                                // Exclude the current recipient
                                .Where(rr => rr.Id != src.Id)
                                .Select(rr => new InvitationDto
                                {
                                    RecipientName = rr.User?.FullName ?? "Unknown User",
                                    RecipientStatus = rr.RecipientStatus.ToString(),
                                })
                                .ToList();
                        }
                    )
            );

        CreateMap<HangoutRequestRecipientDto, HangoutRequestRecipient>()
            .ForMember(
                dest => dest.RecipientStatus,
                opt => opt.MapFrom(src => Enum.Parse<Status>(src.RecipientStatus))
            )
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.HangoutRequest, opt => opt.Ignore());

        // ================================
        // 9. JoinRequest <-> JoinRequestDto
        // ================================
        CreateMap<JoinRequest, JoinRequestDto>();
        CreateMap<JoinRequestDto, JoinRequest>()
            .ForMember(dest => dest.Hangout, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore());

        // ================================
        // 10. HangoutGuest <-> HangoutGuestDto
        // ================================
        CreateMap<HangoutGuest, HangoutGuestDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));
        CreateMap<HangoutGuestDto, HangoutGuest>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.Hangout, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore());

        // ================================
        // 11. Preset <-> PresetDto (FullCalendar + ExtendedProps)
        // ================================
        CreateMap<Preset, PresetDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.Start))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.End))
            .ForMember(
                dest => dest.ExtendedProps,
                opt =>
                    opt.MapFrom(
                        (src, dest, destMember, ctx) =>
                            new PresetExtendedPropsDto
                            {
                                UserId = src.UserId,
                                PreferredActivity = src.PreferredActivity,
                                DaysOfNoticeNeeded = src.DaysOfNoticeNeeded,
                                CreatedAt = src.CreatedAt,
                                User =
                                    (src.User == null) ? null : ctx.Mapper.Map<UserDto>(src.User),
                                Participants =
                                    (src.PresetParticipants == null)
                                        ? null
                                        : src
                                            .PresetParticipants.Select(p =>
                                                ctx.Mapper.Map<PresetParticipantDto>(p)
                                            )
                                            .ToList(),
                                Visibilities =
                                    (src.PresetVisibilities == null)
                                        ? null
                                        : src
                                            .PresetVisibilities.Select(v =>
                                                ctx.Mapper.Map<PresetVisibilityDto>(v)
                                            )
                                            .ToList(),
                            }
                    )
            );
        CreateMap<PresetDto, Preset>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => int.Parse(src.Id)))
            .ForMember(dest => dest.Title, opt => opt.MapFrom(src => src.Title))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => src.Start))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => src.End))
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.ExtendedProps.UserId))
            .ForMember(
                dest => dest.PreferredActivity,
                opt => opt.MapFrom(src => src.ExtendedProps.PreferredActivity)
            )
            .ForMember(
                dest => dest.DaysOfNoticeNeeded,
                opt => opt.MapFrom(src => src.ExtendedProps.DaysOfNoticeNeeded)
            )
            .ForMember(
                dest => dest.CreatedAt,
                opt => opt.MapFrom(src => src.ExtendedProps.CreatedAt)
            )
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.PresetParticipants, opt => opt.Ignore())
            .ForMember(dest => dest.PresetVisibilities, opt => opt.Ignore());

        // ================================
        // 12. PresetParticipant <-> PresetParticipantDto
        // ================================
        CreateMap<PresetParticipant, PresetParticipantDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.Preset, opt => opt.Ignore());
        CreateMap<PresetParticipantDto, PresetParticipant>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Preset, opt => opt.Ignore());

        // ================================
        // 13. PresetVisibility <-> PresetVisibilityDto
        // ================================
        CreateMap<PresetVisibility, PresetVisibilityDto>()
            .ForMember(dest => dest.Preset, opt => opt.Ignore());
        CreateMap<PresetVisibilityDto, PresetVisibility>()
            .ForMember(dest => dest.Preset, opt => opt.Ignore())
            .ForMember(dest => dest.FriendshipCategory, opt => opt.Ignore());

        // ================================
        // 14. Notification DTOs
        // ================================
        CreateMap<RelationshipNotificationCountDto, RelationshipNotificationCountDto>();
        CreateMap<HangoutNotificationCountDto, HangoutNotificationCountDto>();
    }
}
