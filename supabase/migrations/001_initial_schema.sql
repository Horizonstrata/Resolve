-- Schemes: strata schemes managed by Joel's staff
create table schemes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Users: admin staff and committee members
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  scheme_id   uuid references schemes(id) on delete cascade,
  role        text not null check (role in ('admin', 'committee')),
  full_name   text not null,
  email       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Motions: raised by admin or committee members
create table motions (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid not null references schemes(id) on delete cascade,
  created_by  uuid not null references users(id),
  title       text not null,
  description text,
  status      text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- Votes: one per user per motion
create table votes (
  id          uuid primary key default gen_random_uuid(),
  motion_id   uuid not null references motions(id) on delete cascade,
  user_id     uuid not null references users(id),
  vote        boolean not null,
  voted_at    timestamptz not null default now(),
  unique (motion_id, user_id)
);

-- Motion outcomes: recorded after voting closes
create table motion_outcomes (
  id           uuid primary key default gen_random_uuid(),
  motion_id    uuid not null references motions(id) on delete cascade unique,
  recorded_by  uuid not null references users(id),
  outcome      text not null,
  action_taken text,
  recorded_at  timestamptz not null default now()
);

-- Motion comments: in-app discussion tied to a motion
create table motion_comments (
  id          uuid primary key default gen_random_uuid(),
  motion_id   uuid not null references motions(id) on delete cascade,
  user_id     uuid not null references users(id),
  comment     text not null,
  created_at  timestamptz not null default now()
);

-- Row Level Security
alter table schemes         enable row level security;
alter table users           enable row level security;
alter table motions         enable row level security;
alter table votes           enable row level security;
alter table motion_outcomes enable row level security;
alter table motion_comments enable row level security;

-- Admins can do everything
create policy "admins_all_schemes"         on schemes         for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
create policy "admins_all_users"           on users           for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
create policy "admins_all_motions"         on motions         for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
create policy "admins_all_votes"           on votes           for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
create policy "admins_all_outcomes"        on motion_outcomes for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
create policy "admins_all_comments"        on motion_comments for all using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- Committee members can see their own scheme
create policy "committee_view_scheme"      on schemes         for select using (exists (select 1 from users where id = auth.uid() and scheme_id = schemes.id));
create policy "committee_view_users"       on users           for select using (exists (select 1 from users u where u.id = auth.uid() and u.scheme_id = users.scheme_id));
create policy "committee_view_motions"     on motions         for select using (exists (select 1 from users where id = auth.uid() and scheme_id = motions.scheme_id));
create policy "committee_insert_motions"   on motions         for insert with check (exists (select 1 from users where id = auth.uid() and role = 'committee' and scheme_id = motions.scheme_id));
create policy "committee_vote"             on votes           for insert with check (auth.uid() = user_id);
create policy "committee_view_votes"       on votes           for select using (exists (select 1 from users where id = auth.uid() and scheme_id = (select scheme_id from motions where id = votes.motion_id)));
create policy "committee_view_outcomes"    on motion_outcomes for select using (exists (select 1 from users where id = auth.uid() and scheme_id = (select scheme_id from motions where id = motion_outcomes.motion_id)));
create policy "committee_view_comments"    on motion_comments for select using (exists (select 1 from users where id = auth.uid() and scheme_id = (select scheme_id from motions where id = motion_comments.motion_id)));
create policy "committee_insert_comments"  on motion_comments for insert with check (auth.uid() = user_id);
