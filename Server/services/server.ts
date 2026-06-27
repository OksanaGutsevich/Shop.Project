import express, { Express } from "express";

// Берём из .env, но ставим безопасные дефолты, если вдруг забыли
const host = process.env.LOCAL_HOST ?? "localhost";
const portRaw = process.env.LOCAL_PORT;
const port = portRaw ? Number(portRaw) : 3000;

if (Number.isNaN(port)) {
  throw new Error(`Invalid LOCAL_PORT value: ${portRaw}`);
}

export function initServer(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // <-- обязательно extended: true

  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });

  return app;
}
