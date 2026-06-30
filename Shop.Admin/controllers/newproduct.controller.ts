import { Router, Request, Response } from "express";
import { createProduct } from "../models/products.model";
import { getAllProducts } from "../models/similar.model";

const adminPagesRouter = Router();

const ensureAdmin = (req: Request, res: Response, next: () => void) => {
  const session = req.session as any;
  console.log("=== DEBUG ensureAdmin ===");
  console.log("Session object:", session);
  console.log("username:", session?.username);
  console.log("Full session JSON:", JSON.stringify(session, null, 2));
  console.log("==========================");

  const user = session?.username;
  if (user !== "admin") {
    console.warn("Access denied: user is not admin. Redirecting to login...");
    // Если у тебя редирект на /admin/auth/login делается где-то ещё — он сработает здесь
    return res.redirect(`/${process.env.ADMIN_PATH || "admin"}/auth/login`);
  }
  next();
};

// Страница создания товара: GET /admin/new-product
adminPagesRouter.get(
  "/new-product",
  ensureAdmin,
  (req: Request, res: Response) => {
    res.render("product/new-product", {
      currentPage: "new-product",
      layout: "layout", // ← Явно указываем layout
    });
  },
);

// Создание товара: POST /admin/new-product
adminPagesRouter.post(
  "/new-product",
  ensureAdmin,
  async (req: Request, res: Response) => {
    try {
      const rawImages = req.body.images;
      const images: string[] = [];
      if (typeof rawImages === "string" && rawImages.trim().length > 0) {
        images.push(
          ...rawImages
            .split(/\r\n|,/g)
            .map((url) => url.trim())
            .filter((url) => url),
        );
      }

      const product = await createProduct({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        images, // теперь это массив
      });

      return res.redirect(`/${process.env.ADMIN_PATH || "admin"}/products`);
    } catch (err: any) {
      console.error("Failed to create product:", err);
      return res.status(500).send("Failed to create product");
    }
  },
);

export default adminPagesRouter;
