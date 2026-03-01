import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    const sql = neon(process.env.DATABASE_URL!);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}
