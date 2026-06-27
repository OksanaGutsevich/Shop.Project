import "dotenv/config";

import { Express } from "express";
import { Connection } from "mysql2/promise";
import { initDataBase } from "./Server/services/db";
import { initServer } from "./Server/services/server";
import ShopAPI from "./Shop.Api";
import ShopAdmin from "./Shop.Admin";

export let server: Express;
export let connection: Connection;

async function launchApplication() {
  server = initServer();

  // Логирование делаем ЗДЕСЬ, когда dotenv уже точно отработал
  console.log("✅ DEBUG: DB_USER =", process.env.DB_USER);
  console.log("✅ DEBUG: DB_NAME =", process.env.DB_NAME);

  connection = await initDataBase();

  initRouter();
}

function initRouter() {
  // Защита на случай, если логика изменится и connection окажется не инициализирован
  if (!connection) {
    throw new Error("Database connection is not initialized");
  }

  const shopApi = ShopAPI(connection);
  server.use("/api", shopApi);

  const shopAdmin = ShopAdmin();
  server.use("/admin", shopAdmin);

  // Удаляем универсальный обработчик "/"
  server.use("/", (_, res) => {
    res.send("React App");
  });
}

// Запускаем один раз и корректно обрабатываем ошибки
launchApplication().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
