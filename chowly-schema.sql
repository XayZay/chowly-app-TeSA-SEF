create extension if not exists pgcrypto;

create table if not exists admin_user (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

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
  description text,
  image_url text,
  source_url text,
  calories integer,
  rating numeric(2,1) default 4.7,
  ingredients text[] default '{}',
  allergens text[] default '{}',
  pairings text[] default '{}',
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

insert into menu_item (
  name,
  price,
  prep_time_minutes,
  category,
  is_available,
  description,
  image_url,
  source_url,
  calories,
  rating,
  ingredients,
  allergens,
  pairings
)
select
  name,
  price,
  prep_time_minutes,
  category,
  true,
  description,
  image_url,
  source_url,
  calories,
  rating,
  ingredients,
  allergens,
  pairings
from (
  values
    ('Jollof Rice and Chicken', 4500.00, 20, 'food', 'Smoky tomato-pepper rice served with grilled chicken; a party-table Nigerian classic with a deep red stew base and warm spice.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/A_Nigeria_Jollof_Rice_with_chicken.jpg/960px-A_Nigeria_Jollof_Rice_with_chicken.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'https://commons.wikimedia.org/wiki/File:A_Nigeria_Jollof_Rice_with_chicken.jpg', 720, 4.8, array['Jollof rice', 'Grilled chicken', 'Tomato stew', 'Scotch bonnet'], array['None declared'], array['Zobo Drink', 'Moi Moi']),
    ('Pounded Yam and Egusi', 5200.00, 25, 'food', 'Soft pounded yam paired with egusi soup, a Nigerian melon-seed soup often cooked with vegetables, fish, meat, and palm oil.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/EGUSI_SOUP_AND_POUNDED_YAM.JPG/960px-EGUSI_SOUP_AND_POUNDED_YAM.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'https://artsandculture.google.com/asset/egusi-soup-and-pounded-yam/nAHf02t0JGz5zw?hl=en', 860, 4.9, array['Pounded yam', 'Egusi seeds', 'Leafy vegetables', 'Assorted meat'], array['Fish', 'Seeds'], array['Chapman', 'Fresh Palm Wine']),
    ('Amala and Ewedu', 4000.00, 18, 'food', 'A Yoruba favourite built around amala, silky ewedu, gbegiri, pepper stew, and assorted beef for a rich swallow plate.', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Amala_and_Gbegiri_with_Ewedu_soup.jpg', 'https://commons.wikimedia.org/wiki/File:Amala_and_Gbegiri_with_Ewedu_soup.jpg', 690, 4.7, array['Yam flour amala', 'Ewedu', 'Gbegiri', 'Pepper stew'], array['Beans'], array['Zobo Drink', 'Suya Platter']),
    ('Suya Platter', 3500.00, 15, 'food', 'Thin-sliced grilled meat seasoned with yaji spice, served with onions and tomatoes in the style of Nigeria’s beloved evening street food.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Suya_take_away.jpg/960px-Suya_take_away.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'https://en.wikipedia.org/wiki/Suya', 540, 4.8, array['Beef suya', 'Yaji spice', 'Onions', 'Tomatoes'], array['Peanuts'], array['Chapman', 'Fresh Palm Wine']),
    ('Moi Moi', 1200.00, 10, 'food', 'Steamed Nigerian bean pudding made from peeled beans, peppers, onions, oil, and spices; light enough as a side and filling as a snack.', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg/960px-Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', 'https://en.wikipedia.org/wiki/Moin_moin', 280, 4.6, array['Beans', 'Red pepper', 'Onion', 'Crayfish'], array['Fish'], array['Jollof Rice and Chicken', 'Zobo Drink']),
    ('Zobo Drink', 1000.00, 4, 'drink', 'A chilled Nigerian hibiscus drink brewed from dried hibiscus leaves with spices, commonly served cold as a refreshing local beverage.', 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Chilled_Zobo_drink.jpg', 'https://commons.wikimedia.org/wiki/File:Chilled_Zobo_drink.jpg', 120, 4.7, array['Hibiscus', 'Ginger', 'Pineapple', 'Spices'], array['None declared'], array['Jollof Rice and Chicken', 'Moi Moi']),
    ('Chapman', 1800.00, 5, 'drink', 'Nigeria’s famous non-alcoholic punch, usually mixed with citrus soda, grenadine, bitters, cucumber, lemon, and ice.', 'https://upload.wikimedia.org/wikipedia/commons/0/02/A_glass_of_Chapman.jpg', 'https://en.wikipedia.org/wiki/Chapman_(drink)', 180, 4.8, array['Citrus soda', 'Grenadine', 'Bitters', 'Cucumber'], array['None declared'], array['Suya Platter', 'Pounded Yam and Egusi']),
    ('Fresh Palm Wine', 1500.00, 3, 'drink', 'Fresh palm wine is a traditional fermented palm-sap drink enjoyed across West Africa, served chilled here for a crisp finish.', 'https://upload.wikimedia.org/wikipedia/commons/8/86/Fresh_Palm_Wine.jpg', 'https://commons.wikimedia.org/wiki/File:Fresh_Palm_Wine.jpg', 160, 4.5, array['Palm sap', 'Natural fermentation'], array['None declared'], array['Suya Platter', 'Pounded Yam and Egusi'])
) as seed(name, price, prep_time_minutes, category, description, image_url, source_url, calories, rating, ingredients, allergens, pairings)
where not exists (select 1 from menu_item where menu_item.name = seed.name);
