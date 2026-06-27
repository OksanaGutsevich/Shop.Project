import mysql, { Connection } from "mysql2/promise";

let connectionInstance: Connection | null = null;

export async function initDataBase(): Promise<Connection> {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  connectionInstance = await mysql.createConnection({
    host: DB_HOST || "localhost",
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  // Опционально: тест подключения, чтобы сразу увидеть проблему
  await connectionInstance.query("SELECT 1");

  console.log(`Connection to DB ${DB_NAME} established`);
  return connectionInstance;
}

export function getConnection(): Connection {
  if (!connectionInstance) {
    throw new Error("Database connection is not established");
  }
  return connectionInstance;
}
