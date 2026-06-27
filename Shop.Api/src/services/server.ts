import express, { Express } from "express";

export function initServer(): Express {
  const app = express();

  const jsonMiddleware = express.json();
  app.use(jsonMiddleware);

  const DEFAULT_PORT = Number(process.env.PORT) || 3000;

  const server = app.listen(DEFAULT_PORT, () => {
    console.log(`Server running on port ${DEFAULT_PORT}`);
  });

  server.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE") {
      const fallbackPort = DEFAULT_PORT + 1;
      console.warn(`Port ${DEFAULT_PORT} in use, trying ${fallbackPort}`);
      app.listen(fallbackPort, () =>
        console.log(`Server running on port ${fallbackPort}`),
      );
    } else {
      console.error(err);
      process.exit(1);
    }
  });

  return app;
}
