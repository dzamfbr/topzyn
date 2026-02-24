import "server-only";

import mysql, { type Pool } from "mysql2/promise";

type GlobalPoolHolder = typeof globalThis & {
  __topzynTiDbPool?: Pool;
};

function getSslOption() {
  const enabled = (process.env.TIDB_ENABLE_SSL ?? "true").toLowerCase() !== "false";
  if (!enabled) {
    return undefined;
  }
  return {};
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Environment variable ${name} belum diisi.`);
  }
  return value;
}

export function getDbPool(): Pool {
  const holder = globalThis as GlobalPoolHolder;
  if (holder.__topzynTiDbPool) {
    return holder.__topzynTiDbPool;
  }

  const host = requireEnv("TIDB_HOST");
  const user = requireEnv("TIDB_USER");
  const password = requireEnv("TIDB_PASSWORD");
  const database = process.env.TIDB_DATABASE?.trim() || "topzyn";
  const portRaw = Number.parseInt(process.env.TIDB_PORT ?? "4000", 10);
  const port = Number.isFinite(portRaw) ? portRaw : 4000;

  holder.__topzynTiDbPool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl: getSslOption(),
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    enableKeepAlive: true,
  });

  return holder.__topzynTiDbPool;
}

