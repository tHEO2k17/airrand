import { createDb, type Database } from "@airrand/database";
import { getDatabaseUrl } from "./env.js";

export const db: Database = createDb(getDatabaseUrl());
