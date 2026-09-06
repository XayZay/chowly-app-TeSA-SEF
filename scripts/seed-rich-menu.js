const fs = require("fs");
const { Pool } = require("pg");

const envLine = fs
  .readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="));

if (!envLine) {
  throw new Error("DATABASE_URL is missing from .env");
}

const connectionString = envLine
  .replace(/^DATABASE_URL=/, "")
  .trim()
  .replace(/^["']|["']$/g, "");

const menuItems = [
  {
    name: "Jollof Rice and Chicken",
    price: 4500,
    prep: 20,
    category: "food",
    description: "Smoky tomato-pepper rice served with grilled chicken; a party-table Nigerian classic with a deep red stew base and warm spice.",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/A_Nigeria_Jollof_Rice_with_chicken.jpg/960px-A_Nigeria_Jollof_Rice_with_chicken.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    source: "https://commons.wikimedia.org/wiki/File:A_Nigeria_Jollof_Rice_with_chicken.jpg",
    calories: 720,
    rating: 4.8,
    ingredients: ["Jollof rice", "Grilled chicken", "Tomato stew", "Scotch bonnet"],
    allergens: ["None declared"],
    pairings: ["Zobo Drink", "Moi Moi"]
  },
  {
    name: "Pounded Yam and Egusi",
    price: 5200,
    prep: 25,
    category: "food",
    description: "Soft pounded yam paired with egusi soup, a Nigerian melon-seed soup often cooked with vegetables, fish, meat, and palm oil.",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/EGUSI_SOUP_AND_POUNDED_YAM.JPG/960px-EGUSI_SOUP_AND_POUNDED_YAM.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    source: "https://artsandculture.google.com/asset/egusi-soup-and-pounded-yam/nAHf02t0JGz5zw?hl=en",
    calories: 860,
    rating: 4.9,
    ingredients: ["Pounded yam", "Egusi seeds", "Leafy vegetables", "Assorted meat"],
    allergens: ["Fish", "Seeds"],
    pairings: ["Chapman", "Fresh Palm Wine"]
  },
  {
    name: "Amala and Ewedu",
    price: 4000,
    prep: 18,
    category: "food",
    description: "A Yoruba favourite built around amala, silky ewedu, gbegiri, pepper stew, and assorted beef for a rich swallow plate.",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Amala_and_Gbegiri_with_Ewedu_soup.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Amala_and_Gbegiri_with_Ewedu_soup.jpg",
    calories: 690,
    rating: 4.7,
    ingredients: ["Yam flour amala", "Ewedu", "Gbegiri", "Pepper stew"],
    allergens: ["Beans"],
    pairings: ["Zobo Drink", "Suya Platter"]
  },
  {
    name: "Suya Platter",
    price: 3500,
    prep: 15,
    category: "food",
    description: "Thin-sliced grilled meat seasoned with yaji spice, served with onions and tomatoes in the style of Nigeria's beloved evening street food.",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Suya_take_away.jpg/960px-Suya_take_away.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    source: "https://en.wikipedia.org/wiki/Suya",
    calories: 540,
    rating: 4.8,
    ingredients: ["Beef suya", "Yaji spice", "Onions", "Tomatoes"],
    allergens: ["Peanuts"],
    pairings: ["Chapman", "Fresh Palm Wine"]
  },
  {
    name: "Moi Moi",
    price: 1200,
    prep: 10,
    category: "food",
    description: "Steamed Nigerian bean pudding made from peeled beans, peppers, onions, oil, and spices; light enough as a side and filling as a snack.",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg/960px-Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    source: "https://en.wikipedia.org/wiki/Moin_moin",
    calories: 280,
    rating: 4.6,
    ingredients: ["Beans", "Red pepper", "Onion", "Crayfish"],
    allergens: ["Fish"],
    pairings: ["Jollof Rice and Chicken", "Zobo Drink"]
  },
  {
    name: "Zobo Drink",
    price: 1000,
    prep: 4,
    category: "drink",
    description: "A chilled Nigerian hibiscus drink brewed from dried hibiscus leaves with spices, commonly served cold as a refreshing local beverage.",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Chilled_Zobo_drink.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Chilled_Zobo_drink.jpg",
    calories: 120,
    rating: 4.7,
    ingredients: ["Hibiscus", "Ginger", "Pineapple", "Spices"],
    allergens: ["None declared"],
    pairings: ["Jollof Rice and Chicken", "Moi Moi"]
  },
  {
    name: "Chapman",
    price: 1800,
    prep: 5,
    category: "drink",
    description: "Nigeria's famous non-alcoholic punch, usually mixed with citrus soda, grenadine, bitters, cucumber, lemon, and ice.",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/02/A_glass_of_Chapman.jpg",
    source: "https://en.wikipedia.org/wiki/Chapman_(drink)",
    calories: 180,
    rating: 4.8,
    ingredients: ["Citrus soda", "Grenadine", "Bitters", "Cucumber"],
    allergens: ["None declared"],
    pairings: ["Suya Platter", "Pounded Yam and Egusi"]
  },
  {
    name: "Fresh Palm Wine",
    price: 1500,
    prep: 3,
    category: "drink",
    description: "Fresh palm wine is a traditional fermented palm-sap drink enjoyed across West Africa, served chilled here for a crisp finish.",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/86/Fresh_Palm_Wine.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Fresh_Palm_Wine.jpg",
    calories: 160,
    rating: 4.5,
    ingredients: ["Palm sap", "Natural fermentation"],
    allergens: ["None declared"],
    pairings: ["Suya Platter", "Pounded Yam and Egusi"]
  }
];

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("alter table menu_item add column if not exists description text");
    await client.query("alter table menu_item add column if not exists image_url text");
    await client.query("alter table menu_item add column if not exists source_url text");
    await client.query("alter table menu_item add column if not exists calories integer");
    await client.query("alter table menu_item add column if not exists rating numeric(2,1) default 4.7");
    await client.query("alter table menu_item add column if not exists ingredients text[] default '{}'");
    await client.query("alter table menu_item add column if not exists allergens text[] default '{}'");
    await client.query("alter table menu_item add column if not exists pairings text[] default '{}'");

    for (const item of menuItems) {
      await client.query(
        `
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
        values ($1, $2, $3, $4, true, $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict do nothing
        `,
        [
          item.name,
          item.price,
          item.prep,
          item.category,
          item.description,
          item.image,
          item.source,
          item.calories,
          item.rating,
          item.ingredients,
          item.allergens,
          item.pairings
        ]
      );

      await client.query(
        `
        update menu_item
        set
          price = $2,
          prep_time_minutes = $3,
          category = $4,
          is_available = true,
          description = $5,
          image_url = $6,
          source_url = $7,
          calories = $8,
          rating = $9,
          ingredients = $10,
          allergens = $11,
          pairings = $12
        where name = $1
        `,
        [
          item.name,
          item.price,
          item.prep,
          item.category,
          item.description,
          item.image,
          item.source,
          item.calories,
          item.rating,
          item.ingredients,
          item.allergens,
          item.pairings
        ]
      );
    }

    await client.query(
      `
      with ranked as (
        select
          mi.id,
          row_number() over (
            partition by mi.name
            order by
              case when exists (select 1 from order_item oi where oi.menu_item_id = mi.id) then 0 else 1 end,
              mi.created_at
          ) as rn
        from menu_item mi
      )
      delete from menu_item mi
      using ranked
      where mi.id = ranked.id
        and ranked.rn > 1
        and not exists (select 1 from order_item oi where oi.menu_item_id = mi.id)
      `
    );

    await client.query(
      `
      with ranked as (
        select id, row_number() over (partition by name order by created_at) as rn
        from menu_item
      )
      update menu_item
      set is_available = false
      where id in (select id from ranked where rn > 1)
      `
    );

    await client.query("commit");

    const { rows } = await client.query(
      `
      select
        name,
        count(*)::int as total,
        count(*) filter (where is_available)::int as visible,
        bool_and(image_url is not null) as has_image,
        bool_and(description is not null) as has_description
      from menu_item
      group by name
      order by name
      `
    );
    console.table(rows);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
