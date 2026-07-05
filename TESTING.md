# M.A.G.E. Platform — Manual Test Checklist

## Authentication
- [ ] Admin login: `admin@gmail.com` / `admin123` → lands on `/dashboard/admin`
- [ ] Member signup → profile auto-created in `profiles` table
- [ ] Logout → redirects to homepage, profile dropdown disappears
- [ ] Protected routes redirect to `/auth/signin` when not logged in

## Admin Dashboard (`/dashboard/admin`)
- [ ] Overview shows real counts from Supabase (members, posts, events)
- [ ] Create Post → type content → Publish → appears in "All Posts" list
- [ ] Create Post → post appears in `/feed` after publish
- [ ] Edit post → inline edit → save → content updates
- [ ] Delete post → disappears from admin AND from feed
- [ ] Pin post → shows 📌 badge, appears first in feed
- [ ] Hide post → shows "Hidden" badge, disappears from feed

## Events (`/dashboard/admin/events`)
- [ ] Add Event with title, date, time, location → appears in list
- [ ] "Also post to Feed" checkbox → creates announcement post in feed
- [ ] Delete event → removed from list and homepage
- [ ] Events show on homepage `/` in Events section

## Gallery (`/dashboard/admin/gallery`)
- [ ] Upload image → select category → image appears in admin list
- [ ] Uploaded image shows on homepage gallery section
- [ ] Delete from admin → removed from homepage
- [ ] Category filter works on homepage gallery

## Announcements (`/dashboard/admin/announcements`)
- [ ] Create announcement → appears in list
- [ ] Shows on homepage Announcements section
- [ ] Urgent priority shows red badge
- [ ] Delete removes from homepage

## Approvals (`/dashboard/admin/approvals`)
- [ ] Non-admin user posts in feed → post marked `pending_approval`
- [ ] Pending posts appear in admin Approvals page
- [ ] Approve → post goes live in feed
- [ ] Reject → post deleted permanently

## Feed (`/feed`)
- [ ] Posts load from Supabase (not just fallback data)
- [ ] Heart reaction toggles (red fill + count changes)
- [ ] Comment: click comment icon → expand → type → Enter → comment appears
- [ ] Bookmark: click bookmark icon → toggles (filled/unfilled)
- [ ] Share: copies content to clipboard
- [ ] Category filter: switches between All/General/Artwork/etc.
- [ ] Photo upload: click Photo → choose file → preview shows → Post → image in feed
- [ ] Admin posts appear immediately (no approval needed)
- [ ] Fallback posts show when DB is empty

## Profile (`/profile`)
- [ ] Shows name, email, bio from Supabase profiles table
- [ ] Avatar uploaded from edit page shows here
- [ ] Favorites show (anime, game, manga, character)
- [ ] Genres show (anime, game, manga pills)
- [ ] Badges section displays

## Edit Profile (`/profile/edit`)
- [ ] Change display name → saves to Supabase → shows on profile
- [ ] Change bio → saves → shows on profile
- [ ] Upload avatar → preview shows → save → avatar appears everywhere (navbar, feed, profile)
- [ ] Select genres → save → shows on profile
- [ ] Enter favorites → save → shows on profile

## Analytics (`/dashboard/admin/analytics`)
- [ ] All counts are REAL (from Supabase, not hardcoded)
- [ ] Engagement rate calculated from interactions/posts
- [ ] Trending posts section shows posts with most reactions

## RLS Policies (verify in Supabase)
- [ ] `profiles`: SELECT → true (public), UPDATE → own only
- [ ] `posts`: SELECT → true, INSERT → own, UPDATE/DELETE → own or admin
- [ ] `reactions`: SELECT → true, INSERT → own, DELETE → own
- [ ] `comments`: SELECT → true, INSERT → own, DELETE → own or admin
- [ ] `gallery`: SELECT → true, INSERT/UPDATE/DELETE → admin only
- [ ] `events`: SELECT → true, INSERT/UPDATE/DELETE → admin only
- [ ] `announcements`: SELECT → true, INSERT/UPDATE/DELETE → admin only

## Performance
- [ ] Feed loads within 2 seconds
- [ ] No "infinite recursion" errors
- [ ] No 500 errors on any page
- [ ] Images from Supabase Storage display correctly
- [ ] Loading skeletons show while data fetches
