import type { Store } from "express-session";
import type Database from "better-sqlite3";

interface SqliteStoreOptions {
  client: Database.Database;
  expired?: {
    clear?: boolean;
    intervalMs?: number;
  };
}

interface SqliteStoreConstructor {
  new (options: SqliteStoreOptions): Store;
}

declare function SqliteStoreFactory(deps: { Store: typeof Store }): SqliteStoreConstructor;

declare module "better-sqlite3-session-store" {
  export = SqliteStoreFactory;
}
