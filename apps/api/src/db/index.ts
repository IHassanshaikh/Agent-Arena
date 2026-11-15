import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

class Database {
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      console.log('[DB] Connecting to PostgreSQL via DATABASE_URL...');
      this.pool = new Pool({ connectionString: databaseUrl });
    } else {
      const dataDir = path.resolve(__dirname, '../../data/pgdata');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      console.log(`[DB] Initializing embedded PostgreSQL (PGlite) at ${dataDir}...`);
      this.pglite = new PGlite(dataDir);
    }

    await this.runMigrations();
    this.initialized = true;
    console.log('[DB] Database initialized successfully.');
  }

  private async runMigrations(): Promise<void> {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split on semicolons for robust multi-statement execution across drivers
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.query(statement);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.initialized && !this.pool && !this.pglite) {
      await this.init();
    }

    if (this.pool) {
      const res = await this.pool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    }

    if (this.pglite) {
      const res = await this.pglite.query<T>(sql, params);
      return { rows: res.rows as T[], rowCount: res.rows?.length ?? 0 };
    }

    throw new Error('[DB] Database is not initialized.');
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
    if (this.pglite) {
      await this.pglite.close();
    }
    this.initialized = false;
  }
}

export const db = new Database();

