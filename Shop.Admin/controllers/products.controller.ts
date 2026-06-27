import { Router, Request, Response } from "express";
import { getProducts } from "../models/products.model";
import { IProductFilterPayload } from "@Shared/types";
import { searchProducts } from "../models/products.model";
import { getProduct } from "../models/products.model";
import { removeProduct } from "../models/products.model";
import { IProductEditData } from "../types";
import { updateProduct } from "../models/products.model";
import { updateThumbnail } from "../models/products.model";
import { updateProductPartial } from "../models/products.model";
import { IProductUpdatePayload } from "../types";
import { throwServerError } from "./helper";
import {
  getSimilarProductsDirect,
  deleteSimilarProductLinksDirect,
} from "../models/similar.model";

export const productsRouter = Router();

productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    console.log((req.session as any).username);
    const products = await getProducts();
    res.render("products", {
      items: products,
      queryParams: {},
    });
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get(
  "/search",
  async (req: Request<{}, {}, {}, IProductFilterPayload>, res: Response) => {
    try {
      const products = await searchProducts(req.query);
      res.render("products", {
        items: products,
        queryParams: req.query,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//-------------метод для страницы с описанием и редактированием товара, а также связанными товарами
//-------------из таблицы product_similarities
productsRouter.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const product = await getProduct(req.params.id);
      if (!product) {
        return res.render("product/empty-product", { id: req.params.id });
      }

      // Получаем похожие товары через новую модель
      const similarProducts = await getSimilarProductsDirect(req.params.id);

      res.render("product/product", {
        item: product,
        similarProducts,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//роут (удаление связей похожих товаров)
productsRouter.post(
  "/:id/similar/remove",
  async (
    req: Request<{ id: string }, {}, { ids: string[] }>,
    res: Response,
  ) => {
    try {
      const productId = req.params.id;
      const idsToRemove = req.body.ids || [];

      if (!idsToRemove || idsToRemove.length === 0) {
        // Если ничего не выбрано — просто редиректим или возвращаем успех
        const adminPath = process.env.ADMIN_PATH || "/admin";
        return res.redirect(`${adminPath}/${productId}`);
      }

      await deleteSimilarProductLinksDirect(productId, idsToRemove);

      // ✅ Редирект обратно на страницу этого товара
      res.redirect(`/admin/${productId}`);
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

productsRouter.get(
  "/remove-product/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const username = (req.session as any)?.username;

      // Если username не равен "admin" (включая случаи undefined, null, "editor" и т.д.)
      if (username !== "admin") {
        return res.status(403).send("Forbidden");
      }

      await removeProduct(req.params.id);

      res.redirect(`/${process.env.ADMIN_PATH}`);
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//контроллер для сохранения товара
productsRouter.post(
  "/save/:id",
  async (req: Request<{ id: string }, {}, IProductEditData>, res: Response) => {
    try {
      // updateProduct теперь пробрасывает ошибку, если что-то пошло не так
      await updateProduct(req.params.id, req.body);

      // Лучше делать редирект, а не просто "OK", чтобы избежать повторной отправки формы
      // (защита от двойного сабмита при обновлении страницы)
      const adminPath = process.env.ADMIN_PATH || "admin";
      return res.redirect(`/${adminPath}`);
    } catch (e) {
      return throwServerError(res, e as Error);
    }
  },
);

//контроллер для работы с изображением-обложкой товара (mainImage)
productsRouter.post(
  "/update-thumbnail/:id",
  async (
    req: Request<{ id: string }, {}, { newThumbnailId: string }>,
    res: Response,
  ) => {
    const productId = req.params.id;
    const newThumbnailId = req.body.newThumbnailId;

    if (!newThumbnailId) {
      return res.status(400).json({ error: "newThumbnailId is required" });
    }

    try {
      await updateThumbnail(productId, newThumbnailId);
      return res
        .status(200)
        .json({ success: true, message: "Thumbnail updated" });
    } catch (e: any) {
      if (e.status === 400) {
        return res.status(400).json({ error: e.message });
      }
      console.error("Error in update-thumbnail:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Обновление полей title, description и price
productsRouter.patch(
  "/:id",
  async (
    req: Request<{ id: string }, {}, IProductUpdatePayload>,
    res: Response,
  ) => {
    const productId = req.params.id;
    const payload = req.body;

    if (
      payload.title === undefined &&
      payload.description === undefined &&
      payload.price === undefined
    ) {
      return res.status(400).json({
        error:
          "At least one of the fields is required: title, description, price",
      });
    }

    try {
      // ✅ Вызываем именно partial-версию
      await updateProductPartial(productId, payload);

      res.status(200).json({
        success: true,
        message: "Product updated",
        id: productId,
      });
    } catch (e) {
      throwServerError(res, e as Error);
    }
  },
);
