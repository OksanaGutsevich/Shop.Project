import express, { Express } from "express";
import { productsRouter } from "./controllers/products.controller";
import layouts from "express-ejs-layouts";
import bodyParser from "body-parser";
import { authRouter, validateSession } from "./controllers/auth.controller";
import session from "express-session";
import adminPagesRouter from "./controllers/newproduct.controller";

export default function ShopAdmin(): Express {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "super-secret-key-change-in-prod",
      saveUninitialized: false,
      resave: false,
    }),
  );

  app.set("view engine", "ejs");
  app.set("views", "Shop.Admin/views");
  app.use(layouts);
  app.use(express.static(__dirname + "/public"));

  app.use(validateSession);

  app.use(adminPagesRouter); // /admin/new-product

  app.use("/", productsRouter); // все остальные пути

  app.use("/auth", authRouter); // /auth

  return app;
}

export function Session(): Express {
  const app = express();

  return app;
}
