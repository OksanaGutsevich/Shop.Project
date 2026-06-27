import "express-session";

declare module "express-session" {
  interface SessionData {
    username?: string;
    // можно добавить другие поля сессии здесь
  }
}
