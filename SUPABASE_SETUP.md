# M.A.G.E. Guild — Supabase Database Setup Guide

Follow these steps in order. Each step builds on the previous one.

---

## Step 1 — Verify Your Environment Variables

Open your project's `.env.local` file and confirm it has:

```
NEXT_PUBLIC_SUPABASE_URL=https://swylpdkkrxfsopdlpwfw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__stL1ZrwONSYoKZOe4L5ZQ_S8C232Mo
SUPABASE_SERVICE_ROLE_KEY=sb_secret_qhBRoD7MCF4TeS73ShcrvA_gazum-XyC
NEXTAUTH_SECRET=259b10b0-41d4-4741-8c9b-9990be985c79
```

If those are present, you're good.

---

## Step 2 — Open SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project **DavePunzalan16's Project**
3. Click **SQL Editor** on the left sidebar
4. Click **New Query**
5. Paste the SQL from each step below and click **Run**

---

## Step 3 — Create the `profiles` Table

This links to Supabase Auth users automatically.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  course text,
  college text,
  year_level text,
  student_id text,
  phone text,
  role text default 'member' check (role in ('admin', 'officer', 'member')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  interests text[],
  preferred_department text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policy: users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Policy: admins can view all profiles
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: admins can update all profiles
create policy "Admins can update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );
```

**Run it.** Then go to Table Editor — you'll see `profiles` appear.

---

## Step 4 — Auto-create profile on signup (Trigger)

This automatically creates a profile row when a new user signs up.

```sql
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case
      when new.email = 'admin@gmail.com' then 'admin'
      else 'member'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: runs after a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Run it.**

---

## Step 5 — Create the `events` Table

```sql
create table events (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  long_description text,
  date text,
  time text,
  location text,
  tags text[],
  highlights text[],
  status text default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  max_slots integer,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table events enable row level security;

-- Everyone can read events
create policy "Anyone can view events"
  on events for select
  using (true);

-- Only admins/officers can insert events
create policy "Admins can manage events"
  on events for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'officer')
    )
  );
```

**Run it.**

---

## Step 6 — Create the `event_registrations` Table

```sql
create table event_registrations (
  id bigint generated always as identity primary key,
  event_id bigint references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table event_registrations enable row level security;

create policy "Users can view own registrations"
  on event_registrations for select
  using (auth.uid() = user_id);

create policy "Users can register for events"
  on event_registrations for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all registrations"
  on event_registrations for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'officer')
    )
  );
```

**Run it.**

---

## Step 7 — Create the `attendance` Table

```sql
create table attendance (
  id bigint generated always as identity primary key,
  event_id bigint references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'present' check (status in ('present', 'absent', 'late')),
  checked_in_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table attendance enable row level security;

create policy "Users can view own attendance"
  on attendance for select
  using (auth.uid() = user_id);

create policy "Admins/officers can manage attendance"
  on attendance for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'officer')
    )
  );
```

**Run it.**

---

## Step 8 — Create the `announcements` Table

```sql
create table announcements (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  priority text default 'normal' check (priority in ('normal', 'urgent')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table announcements enable row level security;

-- Everyone can read announcements
create policy "Anyone can view announcements"
  on announcements for select
  using (true);

-- Only admins can post announcements
create policy "Admins can manage announcements"
  on announcements for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );
```

**Run it.**

---

## Step 9 — Create the `gallery` Table

```sql
create table gallery (
  id bigint generated always as identity primary key,
  title text not null,
  category text,
  image_url text not null,
  alt_text text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table gallery enable row level security;

-- Everyone can view gallery
create policy "Anyone can view gallery"
  on gallery for select
  using (true);

-- Only admins can manage gallery
create policy "Admins can manage gallery"
  on gallery for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );
```

**Run it.**

---

## Step 10 — Create the `membership_applications` Table

```sql
create table membership_applications (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  student_id text,
  college text,
  course text,
  year_level text,
  interests text[],
  preferred_department text,
  why_join text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table membership_applications enable row level security;

create policy "Users can view own applications"
  on membership_applications for select
  using (auth.uid() = user_id);

create policy "Users can submit applications"
  on membership_applications for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage applications"
  on membership_applications for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );
```

**Run it.**

---

## Step 11 — Create the Admin User

Go to **SQL Editor** and run:

```sql
-- This creates the admin user in Supabase Auth
-- You can also do this via the Authentication tab > Add User

-- If using the Auth tab method:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: admin@gmail.com
-- 4. Password: admin123
-- 5. Check "Auto-confirm user"
```

**OR** use the Supabase Dashboard:
1. Go to **Authentication** (left sidebar)
2. Click **Add User** button (top right)
3. Enter:
   - Email: `admin@gmail.com`
   - Password: `admin123`
   - Check ✅ **Auto Confirm User**
4. Click **Create User**

The trigger from Step 4 will automatically create a profile with `role = 'admin'`.

---

## Step 12 — Verify Everything Works

After running all SQL:

1. Go to **Table Editor** — you should see:
   - `profiles`
   - `events`
   - `event_registrations`
   - `attendance`
   - `announcements`
   - `gallery`
   - `membership_applications`

2. Go to **Authentication** > **Users** — you should see:
   - `admin@gmail.com` (confirmed)

3. Go to your site `http://localhost:3000/auth/signin`:
   - Login with `admin@gmail.com` / `admin123`
   - You should land on the **Admin Dashboard**

---

## Step 13 — Optional: Supabase Storage (for image uploads)

If you want to upload gallery/event images:

1. Go to **Storage** in the sidebar
2. Click **Create a new bucket**
3. Name: `images`
4. Make it **Public** (toggle on)
5. Click **Create bucket**

Then create policies:
```sql
-- Allow authenticated users to upload to images bucket
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

-- Allow public to view images
create policy "Anyone can view images"
  on storage.objects for select
  using (bucket_id = 'images');
```

---

## Table Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked to auth.users) |
| `events` | Guild events |
| `event_registrations` | Who registered for which event |
| `attendance` | Event attendance records |
| `announcements` | Guild announcements |
| `gallery` | Gallery image entries |
| `membership_applications` | "Become a Member" form submissions |

---

## What Happens Next

Once you've run all the SQL above:
- The website login will work with `admin@gmail.com` / `admin123`
- Normal users can sign up and their profile is auto-created
- The admin dashboard will connect to real data from these tables
- You can manage everything from the Supabase Table Editor or from the admin panel

Let me know when you've completed these steps and I'll wire the dashboard to pull real data from Supabase!
