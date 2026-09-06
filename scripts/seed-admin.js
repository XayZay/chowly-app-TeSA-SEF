const fs = require("fs");
const crypto = require("crypto");
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

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await pool.query(`
    create table if not exists admin_user (
      id uuid primary key default gen_random_uuid(),
      username text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )
  `);

  await pool.query(
    `
    insert into admin_user (username, password_hash)
    values ($1, $2)
    on conflict (username)
    do update set password_hash = excluded.password_hash
    `,
    ["admin", hashPassword("admin")]
  );

  await pool.end();
  console.log("Seeded admin user: admin");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
