import "dotenv/config";
import fs from "fs";

const envPath = require.resolve(".env");
const rawContent = fs.readFileSync(envPath, "utf8");

console.log("📁 Путь к .env:", envPath);
console.log("\n📄 Сырое содержимое .env:\n", rawContent);
console.log("\n🔑 DB_USER:", process.env.DB_USER);
console.log("🔑 DB_NAME:", process.env.DB_NAME);

if (!process.env.DB_USER) {
  console.error(
    "\n❌ ОШИБКА: DB_USER не загрузился! Проблема в файле .env или dotenv.",
  );
  process.exit(1);
}
