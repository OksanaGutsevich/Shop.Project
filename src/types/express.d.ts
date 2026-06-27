import "express-session";

declare module "express-session" {
  interface SessionData {
    username?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session?: import("express-session").Session & SessionData;
    }
  }
}
