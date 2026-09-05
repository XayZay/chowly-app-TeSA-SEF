create extension if not exists pgcrypto;

create table if not exists waiter (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists chef (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists bartender (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists menu_item (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price > 0),
  prep_time_minutes integer not null check (prep_time_minutes > 0),
  category text not null check (category in ('food', 'drink')),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists "order" (
  id uuid primary key default gen_random_uuid(),
  waiter_id uuid references waiter(id),
  chef_id uuid references chef(id),
  bartender_id uuid references bartender(id),
  status text not null default 'placed' check (status in ('placed', 'in_progress', 'ready', 'served')),
  wait_time_minutes integer not null,
  is_paid boolean not null default false,
  placed_at timestamptz not null default now(),
  served_at timestamptz
);

create table if not exists order_item (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references "order"(id) on delete cascade,
  menu_item_id uuid not null references menu_item(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price > 0)
);

create table if not exists complaint (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references "order"(id) on delete cascade,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  submitted_at timestamptz not null default now()
);

create table if not exists rating (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references "order"(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  comment text,
  submitted_at timestamptz not null default now()
);

create table if not exists payment (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references "order"(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  is_pretend boolean not null default true,
  paid_at timestamptz not null default now()
);

insert into waiter (name)
select name from (values ('Amara'), ('Daniel'), ('Sofia')) as seed(name)
where not exists (select 1 from waiter where waiter.name = seed.name);

insert into chef (name)
select name from (values ('Chef Kemi'), ('Chef Bruno'), ('Chef Ada')) as seed(name)
where not exists (select 1 from chef where chef.name = seed.name);

insert into bartender (name)
select name from (values ('Mason'), ('Tariq'), ('Leah')) as seed(name)
where not exists (select 1 from bartender where bartender.name = seed.name);

insert into menu_item (name, price, prep_time_minutes, category, is_available)
select name, price, prep_time_minutes, category, true
from (
  values
    ('Jollof Arancini', 8.50, 12, 'food'),
    ('Suya Steak Bowl', 16.00, 18, 'food'),
    ('Plantain Tacos', 11.25, 10, 'food'),
    ('Coconut Rice Prawns', 19.75, 22, 'food'),
    ('Zobo Spritz', 6.50, 4, 'drink'),
    ('Ginger Lime Cooler', 5.75, 3, 'drink'),
    ('Chapman Royale', 7.25, 5, 'drink')
) as seed(name, price, prep_time_minutes, category)
where not exists (select 1 from menu_item where menu_item.name = seed.name);
