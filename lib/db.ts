import mysql, { type RowDataPacket, type OkPacket, type ResultSetHeader } from 'mysql2/promise';
import { config } from './config';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4',
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const p = getPool();
  const [rows] = await p.execute<T[]>(sql, params);
  return rows;
}

export type { OkPacket, ResultSetHeader };
