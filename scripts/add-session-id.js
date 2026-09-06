const fs = require("fs");
const { Pool } = require("pg");

const envLine = fs
  .readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="));

const connectionString = envLine
  .replace(/^DATABASE_URL=/, "")
  .trim()
  .replace(/^["']|["']$/g, "");

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await pool.query('ALTER TABLE "order" ADD COLUMN IF NOT EXISTS session_id text');
    console.log("session_id added successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
