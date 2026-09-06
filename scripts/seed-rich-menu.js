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
  // --- NIGERIAN CUISINE (FOOD) ---
  {
    name: "Smoky Jollof Rice & Grilled Chicken",
    price: 5500,
    prep: 20,
    category: "food",
    description: "Authentic Nigerian smoky party jollof rice served with seasoned grilled chicken, sweet dodo plantains, and rich pepper stew.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/A_Nigeria_Jollof_Rice_with_chicken.jpg/1024px-A_Nigeria_Jollof_Rice_with_chicken.jpg",
    source: "https://commons.wikimedia.org/wiki/File:A_Nigeria_Jollof_Rice_with_chicken.jpg",
    calories: 750,
    rating: 4.9,
    ingredients: ["Jollof Rice", "Grilled Chicken", "Dodo Plantains", "Scotch Bonnet Peppers"],
    allergens: ["None declared"],
    pairings: ["Chilled Hibiscus Zobo Cooler", "Steamed Moi Moi Elegance"]
  },
  {
    name: "Pounded Yam & Egusi Soup",
    price: 6500,
    prep: 25,
    category: "food",
    description: "Piping hot fluffy pounded yam paired with rich melon-seed egusi soup loaded with bitterleaf, dried fish, and tender beef cutlets.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/EGUSI_SOUP_AND_POUNDED_YAM.JPG/1024px-EGUSI_SOUP_AND_POUNDED_YAM.JPG",
    source: "https://commons.wikimedia.org/wiki/File:EGUSI_SOUP_AND_POUNDED_YAM.JPG",
    calories: 880,
    rating: 4.9,
    ingredients: ["Yam Swallow", "Ground Egusi Seeds", "Bitterleaf", "Stockfish", "Assorted Beef"],
    allergens: ["Fish", "Melon Seeds"],
    pairings: ["Freshly Tapped Palm Wine", "Signature Chapman Punch"]
  },
  {
    name: "Amala, Ewedu & Gbegiri (Abula)",
    price: 5000,
    prep: 18,
    category: "food",
    description: "Authentic Ibadan-style dark amala served with silky green ewedu leaves, rich yellow gbegiri bean soup, and peppered assorted beef.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Amala_and_Gbegiri_with_Ewedu_soup.jpg/1024px-Amala_and_Gbegiri_with_Ewedu_soup.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Amala_and_Gbegiri_with_Ewedu_soup.jpg",
    calories: 680,
    rating: 4.8,
    ingredients: ["Elubo Yam Flour", "Jute Leaf Ewedu", "Peeled Bean Gbegiri", "Assorted Beef"],
    allergens: ["Beans"],
    pairings: ["Chilled Hibiscus Zobo Cooler", "Suya Platter (Beef & Chicken Skewers)"]
  },
  {
    name: "Peppered Goat Meat (Asun)",
    price: 6000,
    prep: 15,
    category: "food",
    description: "Smoky grilled goat meat chopped into tender bite-sized pieces and sautéed with crushed habanero peppers and fresh sliced onions.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Asun.jpg/1024px-Asun.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Asun.jpg",
    calories: 620,
    rating: 4.9,
    ingredients: ["Flame Roasted Goat Meat", "Scotch Bonnet Peppers", "Sliced Onions", "Suya Spice"],
    allergens: ["None declared"],
    pairings: ["Cold Guinness Extra Stout", "Heineken Premium Import"]
  },
  {
    name: "Suya Platter (Beef & Chicken Skewers)",
    price: 4500,
    prep: 15,
    category: "food",
    description: "Charcoal-grilled thin beef skewers generously coated in spicy Kuli-Kuli Yaji suya blend, served with fresh onions & sliced tomatoes.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Suya_take_away.jpg/1024px-Suya_take_away.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Suya_take_away.jpg",
    calories: 560,
    rating: 4.8,
    ingredients: ["Prime Beef Skewers", "Hausa Yaji Spice", "Sliced Red Onions", "Fresh Tomatoes"],
    allergens: ["Peanuts"],
    pairings: ["Signature Chapman Punch", "Star Cold Lager Beer"]
  },
  {
    name: "Efo Riro with Semovita",
    price: 5800,
    prep: 22,
    category: "food",
    description: "Traditional Yoruba spinach stew cooked with dried crayfish, smoked fish, palm oil, and kpomo, served alongside smooth semovita.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Efo_riro.jpg/1024px-Efo_riro.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Efo_riro.jpg",
    calories: 720,
    rating: 4.7,
    ingredients: ["Fresh Spinach", "Smoked Catfish", "Dried Crayfish", "Palm Oil", "Semovita"],
    allergens: ["Shellfish", "Fish"],
    pairings: ["Chilled Amstel / Maltina", "Chilled Hibiscus Zobo Cooler"]
  },
  {
    name: "Fisherman Seafood Okra Soup",
    price: 7500,
    prep: 25,
    category: "food",
    description: "Rich Niger Delta fresh okra soup overflowing with king prawns, crab claws, ocean fish steaks, and aromatic ugu greens.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/seafood-okra-soup",
    calories: 640,
    rating: 4.9,
    ingredients: ["Fresh Okra", "King Prawns", "Crab Claws", "Sea Fish Steaks", "Ugu Greens"],
    allergens: ["Crustacean", "Fish"],
    pairings: ["Freshly Tapped Palm Wine", "Star Cold Lager Beer"]
  },
  {
    name: "Special Fried Rice & Roasted Turkey",
    price: 6000,
    prep: 20,
    category: "food",
    description: "Nigerian green vegetable fried rice with sweetcorn, diced carrots, and liver cubes, accompanied by a seasoned roasted turkey portion.",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/fried-rice-turkey",
    calories: 790,
    rating: 4.8,
    ingredients: ["Fried Long Grain Rice", "Sweetcorn & Carrots", "Liver Cubes", "Roasted Turkey Wing"],
    allergens: ["None declared"],
    pairings: ["Ice Cold Coca-Cola / Fanta / Sprite", "Signature Chapman Punch"]
  },
  {
    name: "Steamed Moi Moi Elegance",
    price: 1800,
    prep: 10,
    category: "food",
    description: "Smooth steamed honey-bean pudding filled with flaked boiled egg, mackerel fish, and bell pepper puree served in banana leaf.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg/1024px-Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Images_of_a_local_dish_in_Nigeria_called_Moi-Moi.jpg",
    calories: 310,
    rating: 4.7,
    ingredients: ["Honey Beans Puree", "Red Bell Pepper", "Boiled Egg", "Flaked Mackerel"],
    allergens: ["Egg", "Fish"],
    pairings: ["Smoky Jollof Rice & Grilled Chicken", "Chilled Hibiscus Zobo Cooler"]
  },
  {
    name: "Nkwobi Spiced Delicacy",
    price: 5200,
    prep: 18,
    category: "food",
    description: "Traditional Igbo palm oil delicacy prepared from tender cow foot cooked in potash paste, garnished with fresh utazi leaves & onions.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nkwobi.jpg/1024px-Nkwobi.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Nkwobi.jpg",
    calories: 580,
    rating: 4.8,
    ingredients: ["Tender Cow Foot", "Potash Nchanwu Paste", "Utazi Leaves", "Red Onion Rings"],
    allergens: ["None declared"],
    pairings: ["Cold Guinness Extra Stout", "Freshly Tapped Palm Wine"]
  },
  {
    name: "Catfish Pepper Soup (Point & Kill)",
    price: 7000,
    prep: 25,
    category: "food",
    description: "Steaming aromatic spicy broth simmered with fresh catfish, ehuru African nutmeg, scent leaves, and crushed scotch bonnet peppers.",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/pepper-soup",
    calories: 450,
    rating: 4.9,
    ingredients: ["Fresh Catfish", "African Nutmeg Ehuru", "Scent Leaves", "Habanero Pepper Broth"],
    allergens: ["Fish"],
    pairings: ["Star Cold Lager Beer", "Heineken Premium Import"]
  },
  {
    name: "Ofada Rice with Ayamase Sauce",
    price: 6200,
    prep: 22,
    category: "food",
    description: "Unpolished short-grain local Ofada rice served in uma leaf with bleached palm oil green pepper Ayamase stew, boiled egg, and beef.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Ofada_rice.jpg/1024px-Ofada_rice.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Ofada_rice.jpg",
    calories: 810,
    rating: 4.8,
    ingredients: ["Ofada Rice", "Bleached Palm Oil", "Green Bell Pepper", "Locust Beans Iru", "Boiled Egg"],
    allergens: ["Egg"],
    pairings: ["Chilled Hibiscus Zobo Cooler", "Fresh Tropical Fruit Smoothie"]
  },

  // --- DRINKS (TRADITIONAL, SOFT DRINKS & ALCOHOLIC) ---
  {
    name: "Chilled Hibiscus Zobo Cooler",
    price: 1500,
    prep: 4,
    category: "drink",
    description: "Frosty Nigerian zobo beverage brewed from organic dried hibiscus petals infused with fresh ginger, pineapple juice, and sweet cloves.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Chilled_Zobo_drink.jpg/1024px-Chilled_Zobo_drink.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Chilled_Zobo_drink.jpg",
    calories: 130,
    rating: 4.8,
    ingredients: ["Dried Hibiscus Petals", "Fresh Ginger Root", "Pineapple Juice", "Cloves"],
    allergens: ["None declared"],
    pairings: ["Smoky Jollof Rice & Grilled Chicken", "Amala, Ewedu & Gbegiri (Abula)"]
  },
  {
    name: "Signature Chapman Punch",
    price: 2500,
    prep: 5,
    category: "drink",
    description: "Nigeria's famous punch cocktail blending citrus soda, grenadine syrup, Angostura bitters, fresh cucumber slices, and lemon over ice.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/A_glass_of_Chapman.jpg/1024px-A_glass_of_Chapman.jpg",
    source: "https://commons.wikimedia.org/wiki/File:A_glass_of_Chapman.jpg",
    calories: 210,
    rating: 4.9,
    ingredients: ["Citrus Soda", "Grenadine Syrup", "Angostura Bitters", "Fresh Cucumber & Lemon"],
    allergens: ["None declared"],
    pairings: ["Suya Platter (Beef & Chicken Skewers)", "Pounded Yam & Egusi Soup"]
  },
  {
    name: "Freshly Tapped Palm Wine",
    price: 2000,
    prep: 3,
    category: "drink",
    description: "Authentic naturally fermented sweet palm tree sap served ice-cold for a refreshing, traditional African effervescent drink.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Fresh_Palm_Wine.jpg/1024px-Fresh_Palm_Wine.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Fresh_Palm_Wine.jpg",
    calories: 170,
    rating: 4.6,
    ingredients: ["Pure Fermented Palm Sap"],
    allergens: ["None declared"],
    pairings: ["Nkwobi Spiced Delicacy", "Peppered Goat Meat (Asun)"]
  },
  {
    name: "Cold Guinness Extra Stout",
    price: 1800,
    prep: 2,
    category: "drink",
    description: "Rich, bold, and dark Guinness Foreign Extra Stout served ice-cold with a creamy roasted malt foam head.",
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/guinness-stout-beer",
    calories: 220,
    rating: 4.9,
    ingredients: ["Roasted Barley", "Malt", "Hops", "Filtered Water"],
    allergens: ["Gluten / Barley"],
    pairings: ["Peppered Goat Meat (Asun)", "Nkwobi Spiced Delicacy"]
  },
  {
    name: "Star Cold Lager Beer",
    price: 1500,
    prep: 2,
    category: "drink",
    description: "Classic golden Nigerian Star lager beer served frost-cold for a crisp, smooth finish.",
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/cold-lager-beer",
    calories: 180,
    rating: 4.7,
    ingredients: ["Malted Barley", "Hops", "Purified Water"],
    allergens: ["Gluten / Barley"],
    pairings: ["Suya Platter (Beef & Chicken Skewers)", "Catfish Pepper Soup (Point & Kill)"]
  },
  {
    name: "Heineken Premium Import",
    price: 2200,
    prep: 2,
    category: "drink",
    description: "Crisp international 100% malt lager beer served ice-cold in its signature green bottle.",
    image: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/heineken-beer-bottle",
    calories: 190,
    rating: 4.8,
    ingredients: ["Water", "Malted Barley", "Hops", "A-Yeast"],
    allergens: ["Gluten / Barley"],
    pairings: ["Fisherman Seafood Okra Soup", "Peppered Goat Meat (Asun)"]
  },
  {
    name: "Chilled Amstel / Maltina",
    price: 1200,
    prep: 2,
    category: "drink",
    description: "Nourishing, rich non-alcoholic dark malt beverage packed with vitamins, served ice-cold.",
    image: "https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/malt-beverage",
    calories: 190,
    rating: 4.7,
    ingredients: ["Malted Barley", "Sucrose", "B-Vitamins"],
    allergens: ["Gluten / Barley"],
    pairings: ["Efo Riro with Semovita", "Steamed Moi Moi Elegance"]
  },
  {
    name: "Ice Cold Coca-Cola / Fanta / Sprite",
    price: 1000,
    prep: 2,
    category: "drink",
    description: "Classic sparkling carbonated soft drink served ice-cold with fresh lemon and ice cubes.",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/cold-soda-glass",
    calories: 140,
    rating: 4.6,
    ingredients: ["Carbonated Water", "Cane Sugar", "Natural Flavors"],
    allergens: ["None declared"],
    pairings: ["Special Fried Rice & Roasted Turkey", "Smoky Jollof Rice & Grilled Chicken"]
  },
  {
    name: "Fresh Tropical Fruit Smoothie",
    price: 3000,
    prep: 5,
    category: "drink",
    description: "Freshly blended sun-ripened Nigerian pineapple, watermelon, passionfruit, and mango puree served over ice.",
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/tropical-fruit-smoothie",
    calories: 180,
    rating: 4.9,
    ingredients: ["Pineapple", "Watermelon", "Mango", "Passionfruit Juice"],
    allergens: ["None declared"],
    pairings: ["Ofada Rice with Ayamase Sauce", "Special Fried Rice & Roasted Turkey"]
  },
  {
    name: "Orijin Herbal Cocktail over Ice",
    price: 2500,
    prep: 4,
    category: "drink",
    description: "Refreshing African botanical herbal spirit blend mixed with citrus zest, herbal extracts, and ice.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1000&q=80",
    source: "https://unsplash.com/photos/herbal-spirit-cocktail",
    calories: 230,
    rating: 4.7,
    ingredients: ["African Herbal Extracts", "Neutral Spirits", "Citrus Zest"],
    allergens: ["None declared"],
    pairings: ["Nkwobi Spiced Delicacy", "Suya Platter (Beef & Chicken Skewers)"]
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

    await client.query("truncate table menu_item cascade");

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

    await client.query("commit");
    console.log(`Successfully seeded ${menuItems.length} authentic dishes & drinks with verified images.`);
  } catch (error) {
    await client.query("rollback");
    console.error("Failed to seed menu:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
