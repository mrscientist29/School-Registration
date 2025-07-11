import { pool } from "./db";

async function seedAdmin() {
  const client = await pool.connect();
  try {
    // Always upsert admin school and credentials
    await client.query(
      `INSERT INTO schools (school_code, school_name, school_address) VALUES ($1, $2, $3) ON CONFLICT (school_code) DO NOTHING`,
      ["admin_school", "Admin School", "Admin Address"]
    );
    await client.query(
      `INSERT INTO school_credentials (school_code, username, password, is_active) VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, is_active = EXCLUDED.is_active, school_code = EXCLUDED.school_code`,
      ["admin_school", "admin", "admin123", true]
    );
    console.log("Admin credentials ensured in school_credentials table");
  } finally {
    client.release();
  }
}

seedAdmin().then(() => process.exit(0));
