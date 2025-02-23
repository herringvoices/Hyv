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
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName));
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
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<TagalongDto, Tagalong>()
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
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));
        CreateMap<WindowParticipantDto, WindowParticipant>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));

        // ================================
        // 5. WindowVisibility <-> WindowVisibilityDto
        // ================================
        CreateMap<WindowVisibility, WindowVisibilityDto>();
        CreateMap<WindowVisibilityDto, WindowVisibility>();

        // ================================
        // 6. Hangout <-> HangoutDto
        // ================================
        CreateMap<Hangout, HangoutDto>()
            .ForMember(dest => dest.Guests, opt => opt.Ignore()); // Adjust if you need guest mapping
        CreateMap<HangoutDto, Hangout>()
            .ForMember(dest => dest.HangoutRequests, opt => opt.Ignore())
            .ForMember(dest => dest.HangoutGuests, opt => opt.Ignore());

        // ================================
        // 7. HangoutRequest <-> HangoutRequestDto
        // ================================
        CreateMap<HangoutRequest, HangoutRequestDto>()
            .ForMember(dest => dest.Recipients, opt => opt.MapFrom(src => src.RequestRecipients))
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
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));
        CreateMap<PresetParticipantDto, PresetParticipant>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Preset, opt => opt.Ignore());

        // ================================
        // 13. PresetVisibility <-> PresetVisibilityDto
        // ================================
        CreateMap<PresetVisibility, PresetVisibilityDto>();
        CreateMap<PresetVisibilityDto, PresetVisibility>()
            .ForMember(dest => dest.Preset, opt => opt.Ignore())
            .ForMember(dest => dest.FriendshipCategory, opt => opt.Ignore());
    }
}
