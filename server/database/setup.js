// database/setup.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setup() {
  try {
    console.log("🔧 Création du schéma...");
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);
    console.log("✅ Schéma créé.");

    console.log("🌱 Insertion des données de test...");
    const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
    await pool.query(seed);
    console.log("✅ Données insérées.");

    console.log("\n🚀 Base de données prête !");
    console.log("Utilisateurs de test :");
    console.log("  admin@digital.cm  / password");
    console.log("  alice@digital.cm  / password");
    console.log("  bob@digital.cm    / password");
    console.log("  claire@digital.cm / password");
  } catch (err) {
    console.error("❌ Erreur setup BDD :", err.message);
  } finally {
    await pool.end();
  }
}

setup();
