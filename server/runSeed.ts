#!/usr/bin/env tsx

import 'dotenv/config';
import { seedDatabase } from "./seedDatabase";

console.log("🚀 Starting Money Flow database seeding...");

seedDatabase()
  .then(() => {
    console.log("✅ Database seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });