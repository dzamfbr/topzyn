import "server-only";
import mysql from "mysql2";

type PromisePool = ReturnType<ReturnType<typeof mysql.createPool>["promise"]>;

type PoolHolder = typeof globalThis & {
  __topzynTiDbPool?: PromisePool;
};

function decodeInlineCertificate(value: string): string {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function createPool() {
  const sslCa = process.env.TIDB_SSL_CA
    ? decodeInlineCertificate(process.env.TIDB_SSL_CA)
    : undefined;
  const sslOptions = sslCa
    ? { minVersion: "TLSv1.2" as const, rejectUnauthorized: true, ca: sslCa }
    : { minVersion: "TLSv1.2" as const, rejectUnauthorized: true };
  const baseOptions = {
    ssl: sslOptions,
    waitForConnections: true,
    connectionLimit: 8,
    maxIdle: 8,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };

  if (process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);
    return mysql
      .createPool({
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : Number(process.env.TIDB_PORT ?? 4000),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ""),
        ...baseOptions,
      })
      .promise();
  }

  if (!isTiDbConfigured()) {
    throw new Error("TiDB environment variables are not configured.");
  }

  return mysql
    .createPool({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT ?? 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE,
      ...baseOptions,
    })
    .promise();
}

export function isTiDbConfigured(): boolean {
  if (process.env.DATABASE_URL) {
    return true;
  }

  return Boolean(
    process.env.TIDB_HOST &&
      process.env.TIDB_USER &&
      process.env.TIDB_PASSWORD &&
      process.env.TIDB_DATABASE,
  );
}

export function getTiDbPool(): PromisePool {
  const globalPool = globalThis as PoolHolder;
  if (!globalPool.__topzynTiDbPool) {
    globalPool.__topzynTiDbPool = createPool();
  }
  return globalPool.__topzynTiDbPool;
}

export async function queryRows<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const pool = getTiDbPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
