import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

const { db } = await import("./index");
const { seedDatabase } = await import("./seed");

await seedDatabase(db);
console.log("Seed complete");
process.exit(0);
