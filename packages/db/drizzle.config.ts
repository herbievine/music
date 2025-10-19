import { defineConfig } from "drizzle-kit";
import { configDotenv } from 'dotenv'

configDotenv()

export default defineConfig({
  dialect: "sqlite",
  out: "drizzle",
  schema: "./src/index.ts",
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
