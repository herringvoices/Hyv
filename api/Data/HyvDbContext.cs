using Hyv.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Data
{
    public class HyvDbContext : IdentityDbContext<User>
    {
        public HyvDbContext(DbContextOptions<HyvDbContext> options)
            : base(options) { }

        public DbSet<Window> Windows { get; set; }
        public DbSet<Tagalong> Tagalongs { get; set; }
        public DbSet<WindowParticipant> WindowParticipants { get; set; }
        public DbSet<Hangout> Hangouts { get; set; }
        public DbSet<FriendshipCategory> FriendshipCategories { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<CategoryMember> CategoryMembers { get; set; }
        public DbSet<Preset> Presets { get; set; }
        public DbSet<PresetVisibility> PresetVisibilities { get; set; }
        public DbSet<PresetParticipant> PresetParticipants { get; set; }
        public DbSet<JoinRequest> JoinRequests { get; set; }
        public DbSet<HangoutRequest> HangoutRequests { get; set; }
        public DbSet<HangoutRequestRecipient> HangoutRequestRecipients { get; set; }
        public DbSet<HangoutGuest> HangoutGuests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Tagalong relationships
            modelBuilder
                .Entity<Tagalong>()
                .HasOne(t => t.Sender)
                .WithMany(u => u.SentTagalongs)
                .HasForeignKey(t => t.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Tagalong>()
                .HasOne(t => t.Recipient)
                .WithMany(u => u.ReceivedTagalongs)
                .HasForeignKey(t => t.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Window relationships
            modelBuilder
                .Entity<Window>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Window>()
                .HasOne(w => w.Hangout)
                .WithMany()
                .HasForeignKey(w => w.HangoutId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure WindowParticipant relationships
            modelBuilder
                .Entity<WindowParticipant>()
                .HasOne(wp => wp.Window)
                .WithMany(w => w.WindowParticipants)
                .HasForeignKey(wp => wp.WindowId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<WindowParticipant>()
                .HasOne(wp => wp.User)
                .WithMany(u => u.WindowParticipants)
                .HasForeignKey(wp => wp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Friendship relationships
            modelBuilder
                .Entity<Friendship>()
                .HasOne(f => f.Sender)
                .WithMany(u => u.SentFriendships)
                .HasForeignKey(f => f.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Friendship>()
                .HasOne(f => f.Recipient)
                .WithMany(u => u.ReceivedFriendships)
                .HasForeignKey(f => f.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure CategoryMember relationships
            modelBuilder
                .Entity<CategoryMember>()
                .HasOne(cm => cm.FriendshipCategory)
                .WithMany(fc => fc.CategoryMembers)
                .HasForeignKey(cm => cm.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<CategoryMember>()
                .HasOne(cm => cm.Friend)
                .WithMany() // Potentially use .WithMany(u => u.CategoryMemberships), but this is not necessary and  requires more configuration
                .HasForeignKey(cm => cm.FriendId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Preset relationships
            modelBuilder
                .Entity<Preset>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<PresetParticipant>()
                .HasOne(pp => pp.Preset)
                .WithMany(p => p.PresetParticipants)
                .HasForeignKey(pp => pp.PresetId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<PresetParticipant>()
                .HasOne(pp => pp.User)
                .WithMany()
                .HasForeignKey(pp => pp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<PresetVisibility>()
                .HasOne(pv => pv.Preset)
                .WithMany(p => p.PresetVisibilities)
                .HasForeignKey(pv => pv.PresetId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure JoinRequest relationships
            modelBuilder
                .Entity<JoinRequest>()
                .HasOne(jr => jr.Hangout)
                .WithMany()
                .HasForeignKey(jr => jr.HangoutId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<JoinRequest>()
                .HasOne(jr => jr.User)
                .WithMany()
                .HasForeignKey(jr => jr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure HangoutRequest relationships
            modelBuilder
                .Entity<HangoutRequest>()
                .HasOne(hr => hr.Hangout)
                .WithMany(h => h.HangoutRequests)
                .HasForeignKey(hr => hr.HangoutId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<HangoutRequest>()
                .HasOne(hr => hr.Sender)
                .WithMany()
                .HasForeignKey(hr => hr.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<HangoutRequest>()
                .HasMany(hr => hr.Recipients)
                .WithOne()
                .HasForeignKey(hg => hg.HangoutId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure HangoutRequestRecipient relationships
            modelBuilder
                .Entity<HangoutRequestRecipient>()
                .HasOne(hrr => hrr.HangoutRequest)
                .WithMany(hr => hr.RequestRecipients)
                .HasForeignKey(hrr => hrr.HangoutRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<HangoutRequestRecipient>()
                .HasOne(hrr => hrr.User)
                .WithMany()
                .HasForeignKey(hrr => hrr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure HangoutGuest relationships
            modelBuilder
                .Entity<HangoutGuest>()
                .HasOne(hg => hg.Hangout)
                .WithMany(h => h.HangoutGuests) 
                .HasForeignKey(hg => hg.HangoutId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<HangoutGuest>()
                .HasOne(hg => hg.User)
                .WithMany()
                .HasForeignKey(hg => hg.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
