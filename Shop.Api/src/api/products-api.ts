import { Request, Response, Router } from "express";
import { RowDataPacket } from "mysql2";
import { ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";
import { getConnection } from "../../../Server/services/db";
import {
  IProductEntity,
  ICommentEntity,
  IProductSearchFilter,
  IProductSearchQuery,
  ProductCreatePayload,
} from "../../types";
import { IProduct, IComment, IImage } from "@Shared/types";
import { mapProductsEntity, mapCommentEntity } from "../services/mapping";
import getProductsFilterQuery from "../helpers";
import INSERT_PRODUCT_QUERY from "../services/queries";
import { body, param, validationResult } from "express-validator";

export const productsRouter = Router();

interface IImageEntity extends RowDataPacket {
  image_id: string;
  url: string;
  product_id: string;
  main: number; // 1 — обложка, 0 — дополнительное
}

const mapImageEntity = (entity: IImageEntity): IImage => ({
  id: entity.image_id,
  productId: entity.product_id,
  isMain: entity.main === 1,
  url: entity.url || "",
});

const INSERT_INTO_IMAGES = `
  INSERT INTO images (image_id, product_id, main, url)
  VALUES ?
`;

const throwServerError = (res: Response, e: Error) => {
  console.debug(e.message);
  res.status(500);
  res.send("Something went wrong");
};

//функция обогащения данных
export const enhanceProductsWithMedia = (
  products: IProduct[],
  commentRows: ICommentEntity[],
  imageRows: IImageEntity[],
): IProduct[] => {
  const commentsByProductId = new Map<string, IComment[]>();
  const imagesByProductId = new Map<string, IImage[]>();

  // Группируем комментарии
  for (const commentEntity of commentRows) {
    const comment = mapCommentEntity(commentEntity);
    const existingComments = commentsByProductId.get(comment.productId) ?? [];
    commentsByProductId.set(comment.productId, [...existingComments, comment]);
  }

  // Группируем изображения
  for (const imageEntity of imageRows) {
    const image = mapImageEntity(imageEntity);
    const productId = imageEntity.product_id; // берём из entity
    const existingImages = imagesByProductId.get(productId) ?? [];
    imagesByProductId.set(productId, [...existingImages, image]);
  }

  // Добавляем медиа к продуктам
  for (const product of products) {
    // Комментарии
    product.comments = commentsByProductId.get(product.id) ?? [];

    // Изображения
    const productImages = imagesByProductId.get(product.id) ?? [];
    product.images = productImages;

    // Обложка (главное изображение)
    let mainImage = productImages.find((img) => img.isMain);

    // Если нет явной обложки, берём первое доступное изображение
    if (!mainImage && productImages.length > 0) {
      mainImage = productImages[0];
      // Опционально: обновляем флаг isMain у первого изображения
      mainImage.isMain = true;
    }

    product.thumbnail = mainImage || null;
  }

  return products;
};
//конец функции обогащения данных

//GET‑метод "/ "для списка товаров
productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const connection = getConnection();
    const [productRows] = await connection.query<IProductEntity[]>(
      "SELECT * FROM products",
    );

    const [commentRows] = await connection.query<ICommentEntity[]>(
      "SELECT * FROM comments",
    );

    const [imageRows] = await connection.query<IImageEntity[]>(
      "SELECT * FROM images",
    );

    const products = mapProductsEntity(productRows);
    const result = enhanceProductsWithMedia(products, commentRows, imageRows);

    res.json(result);
  } catch (e) {
    throwServerError(res, e);
  }
});

//Get-метод для поиска товаров по фильтру
productsRouter.get(
  "/search",
  async (req: Request<{}, {}, {}, IProductSearchQuery>, res: Response) => {
    try {
      // Функция безопасного парсинга чисел
      const safeParseFloat = (
        value: string | string[] | undefined,
      ): number | undefined => {
        if (typeof value !== "string") return undefined;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
      };

      // Преобразование типов из запроса в фильтр
      const filter: IProductSearchFilter = {
        title: req.query.title,
        description: req.query.description,
        priceFrom: safeParseFloat(req.query.priceFrom),
        priceTo: safeParseFloat(req.query.priceTo),
      };

      console.log("Raw query params:", req.query);
      console.log("Filter object:", filter);

      const [query, values] = getProductsFilterQuery(filter);
      console.log("Generated SQL:", query);
      console.log("Parameters:", values);

      const connection = getConnection();
      const [rows] = await connection.query<IProductEntity[]>(query, values);

      if (!rows?.length) {
        res.json({ products: [], total: 0 });
        return;
      }

      // Получаем только комментарии для найденных продуктов
      const productIds = rows.map((p) => p.product_id);
      if (productIds.length === 0) {
        res.json(rows);
        return;
      }

      // Динамически генерируем плейсхолдеры для IN
      const placeholders = productIds.map(() => "?").join(",");
      const commentsQuery = `SELECT * FROM comments WHERE product_id IN (${placeholders})`;
      const [commentRows] = await connection.query<ICommentEntity[]>(
        commentsQuery,
        productIds,
      );

      const products = mapProductsEntity(rows);
      // Получаем изображения для найденных продуктов
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => "?").join(",");
        const imagesQuery = `SELECT * FROM images WHERE product_id IN (${placeholders})`;
        const [imageRows] = await connection.query<IImageEntity[]>(
          imagesQuery,
          productIds,
        );

        const result = enhanceProductsWithMedia(
          products,
          commentRows,
          imageRows,
        );
        res.json(result);
      } else {
        res.json({ products: [], total: 0 });
      }
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

// API get-метод: товар по id

productsRouter.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const connection = getConnection();
      const [rows] = await connection.query<IProductEntity[]>(
        "SELECT * FROM products WHERE product_id = ?",
        [req.params.id],
      );

      if (!rows?.[0]) {
        res.status(404);
        res.send(`Product with id ${req.params.id} is not found`);
        return;
      }

      const [[comments], [images]] = await Promise.all([
        connection.query<ICommentEntity[]>(
          "SELECT * FROM comments WHERE product_id = ?",
          [req.params.id],
        ),
        connection.query<IImageEntity[]>(
          "SELECT * FROM images WHERE product_id = ?",
          [req.params.id],
        ),
      ]);

      const product = mapProductsEntity(rows)[0];
      const enrichedProduct = enhanceProductsWithMedia(
        [product],
        comments,
        images,
      )[0];

      res.json(enrichedProduct);
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

// PATCH /:id — частичное обновление полей товара (title, description, price)
productsRouter.patch(
  "/:id",
  async (
    req: Request<
      { id: string },
      {},
      { title?: string; description?: string; price?: number | string }
    >,
    res: Response,
  ) => {
    try {
      const productId = req.params.id;
      const { title, description, price } = req.body;

      if (
        title === undefined &&
        description === undefined &&
        price === undefined
      ) {
        res.status(400);
        return res.json({
          error:
            "At least one of the fields is required: title, description, price",
        });
      }

      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (title !== undefined) {
        updates.push("title = ?");
        values.push(title);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
      }
      if (price !== undefined) {
        const priceValue =
          typeof price === "string" ? parseFloat(price) : price;
        if (!Number.isNaN(priceValue as number)) {
          updates.push("price = ?");
          values.push(priceValue as number);
        }
      }

      if (updates.length === 0) {
        res.status(400);
        return res.json({ error: "No valid fields to update" });
      }

      const sql = `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`;
      values.push(productId);

      const connection = getConnection();
      const [result] = await connection.query<ResultSetHeader>(sql, values);

      if ((result as ResultSetHeader).affectedRows === 0) {
        res.status(404);
        return res.json({ error: `Product with id ${productId} not found` });
      }

      res.json({ success: true, message: "Product updated", id: productId });
    } catch (e) {
      throwServerError(res, e as Error);
    }
  },
);

//метод для добавления товара в БД

productsRouter.post(
  "/",
  async (
    req: Request<{}, {}, ProductCreatePayload & { images?: string[] }>,
    res: Response,
  ) => {
    try {
      const { title, description, price, images = [] } = req.body;
      const productId = randomUUID();
      const connection = getConnection();

      // 1. Создаём товар
      await connection.query(INSERT_PRODUCT_QUERY, [
        productId,
        title || null,
        description || null,
        price || null,
      ]);

      let imagesData: IImage[] = [];

      // 2. Если есть изображения — добавляем их массово
      if (images.length > 0) {
        const imagesRows = images.map((url, index) => ({
          image_id: randomUUID(),
          product_id: productId,
          main: index === 0 ? 1 : 0,
          url,
        }));

        imagesData = imagesRows.map((img) =>
          mapImageEntity(img as unknown as IImageEntity),
        );

        const valuesBatch = imagesRows.map((img) => [
          img.image_id,
          img.product_id,
          img.main,
          img.url,
        ]);

        await connection.query(INSERT_INTO_IMAGES, [valuesBatch]);
      }

      // 3. Формируем IProduct
      const createdProduct: IProduct = {
        id: productId,
        title: title || "",
        description: description || "",
        price: typeof price === "number" ? price : parseFloat(price || "0"),
        comments: [],
        images: imagesData,
        thumbnail: imagesData.length > 0 ? imagesData[0] : null,
      };

      // ✅ ЛОГ В ТЕРМИНАЛ: успешное создание
      console.log(
        `✅ Product created successfully: id=${productId}, title="${title}"`,
      );

      res.status(201).json(createdProduct);
    } catch (e) {
      // ❌ ЛОГ В ТЕРМИНАЛ: ошибка создания
      console.error(
        `❌ Failed to create product:`,
        e instanceof Error ? e.message : e,
      );
      throwServerError(res, e as Error);
    }
  },
);

//POST для добавления изображений к существующему товару

productsRouter.post(
  "/:id/images",
  async (
    req: Request<{ id: string }, {}, { images: string[] }>,
    res: Response,
  ) => {
    try {
      const productId = req.params.id;
      const { images } = req.body;
      const connection = getConnection();

      const imagesData = images.map((url, index) => [
        randomUUID(),
        productId,
        index === 0 ? 1 : 0,
        url,
      ]);

      await connection.query(INSERT_INTO_IMAGES, [imagesData]);

      res.status(201).json({
        message: `Images added to product ${productId}`,
        count: images.length,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//метод для удаления товара в БД (с каскадным удалением)
productsRouter.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const connection = getConnection();
      const productId = req.params.id;

      // Начинаем транзакцию для атомарности операций
      await connection.beginTransaction();

      try {
        // 1. Удаляем комментарии
        await connection.query("DELETE FROM comments WHERE product_id = ?", [
          productId,
        ]);

        // 2. Удаляем изображения
        await connection.query("DELETE FROM images WHERE product_id = ?", [
          productId,
        ]);

        // 3. Удаляем товар
        const [info] = await connection.query<ResultSetHeader>(
          "DELETE FROM products WHERE product_id = ?",
          [productId],
        );

        if (info.affectedRows === 0) {
          await connection.rollback();
          res.status(404);
          return res.send(`Product with id ${productId} is not found`);
        }

        await connection.commit();

        console.log(
          `Product with ID ${productId} and all related data were successfully deleted`,
        );

        res.status(200).json({
          message: `Product and all related data deleted successfully`,
          productId: productId,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//POST для удаления изображений
productsRouter.post(
  "/:id/images/delete",
  async (
    req: Request<{ id: string }, {}, { imageIds: string[] }>,
    res: Response,
  ) => {
    try {
      console.log(
        `DEBUG images/delete called for productId=${req.params.id}, body=`,
        req.body,
      );
      const productId = req.params.id;
      const { imageIds } = req.body;
      const connection = getConnection();

      // 1. Валидация входных данных
      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        res.status(400);
        return res.json({
          error: "imageIds array is required and cannot be empty",
        });
      }

      // 2. Проверяем существование товара
      const [productCheck] = await connection.query<IProductEntity[]>(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
      );

      if (!productCheck?.[0]) {
        res.status(404);
        return res.json({
          error: `Product with id ${productId} not found`,
        });
      }

      // 3. Проверяем, что все переданные imageIds существуют и принадлежат этому товару
      const placeholders = imageIds.map(() => "?").join(",");
      const checkQuery = `
        SELECT image_id
        FROM images
        WHERE image_id IN (${placeholders}) AND product_id = ?
      `;
      const [existingImages] = await connection.query<IImageEntity[]>(
        checkQuery,
        [...imageIds, productId],
      );

      const existingImageIds = existingImages.map((img) => img.image_id);
      const missingIds = imageIds.filter(
        (id) => !existingImageIds.includes(id),
      );

      if (missingIds.length > 0) {
        res.status(400);
        return res.json({
          error: "Some image IDs do not exist or do not belong to this product",
          missingIds,
        });
      }

      // 4. Удаляем изображения
      const deleteQuery = `DELETE FROM images WHERE image_id IN (${placeholders})`;
      const [result] = await connection.query<ResultSetHeader>(
        deleteQuery,
        imageIds,
      );

      res.status(200).json({
        message: `Successfully deleted ${result.affectedRows} images`,
        deletedCount: result.affectedRows,
        productId: productId,
        deletedImageIds: imageIds,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

// POST для обновления обложки (thumbnail) по id изображения
productsRouter.post(
  "/update-thumbnail/:id",
  async (
    req: Request<{ id: string }, {}, { newThumbnailId: string }>,
    res: Response,
  ) => {
    try {
      const productId = req.params.id;
      const { newThumbnailId } = req.body;
      const connection = getConnection();

      // Проверяем существование товара
      const [productCheck] = await connection.query<IProductEntity[]>(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
      );

      if (!productCheck?.[0]) {
        res.status(404);
        return res.json({ error: `Product with id ${productId} not found` });
      }

      // Сбрасываем флаг main у всех изображений товара
      await connection.query(
        "UPDATE images SET main = 0 WHERE product_id = ?",
        [productId],
      );

      // Устанавливаем main = 1 для указанного изображения
      const [result] = await connection.query<ResultSetHeader>(
        "UPDATE images SET main = 1 WHERE image_id = ? AND product_id = ?",
        [newThumbnailId, productId],
      );

      if (result.affectedRows === 0) {
        res.status(404);
        return res.json({
          error: `Image with id ${newThumbnailId} not found for product ${productId}`,
        });
      }

      res.json({
        message: `Thumbnail updated for product ${productId}`,
        imageId: newThumbnailId,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//методы для "похожих товаров"

//-------------------------------------------- GET /:id/similar — получение списка похожих товаров
productsRouter.get(
  "/:id/similar",
  [param("id").isUUID().withMessage("Product ID must be a valid UUID")],
  async (req: Request<{ id: string }>, res: Response) => {
    // Проверка результатов валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    try {
      const productId = req.params.id;
      const connection = getConnection();

      // Проверяем существование основного товара
      const [productCheck] = await connection.query<IProductEntity[]>(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
      );

      if (!productCheck?.[0]) {
        res.status(404);
        return res.json({ error: `Product with id ${productId} not found` });
      }

      // Получаем ID похожих товаров
      const [similarIds] = await connection.query<RowDataPacket[]>(
        `SELECT similar_product_id
         FROM product_similarities
         WHERE product_id = ?
         ORDER BY created_at DESC`,
        [productId],
      );

      if (similarIds.length === 0) {
        return res.json({ similarProducts: [], count: 0 });
      }

      // Извлекаем полные данные о похожих товарах
      const similarProductIds = similarIds.map((row) => row.similar_product_id);
      const placeholders = similarProductIds.map(() => "?").join(",");

      const [productRows] = await connection.query<IProductEntity[]>(
        `SELECT * FROM products WHERE product_id IN (${placeholders})`,
        similarProductIds,
      );

      // Получаем медиа для похожих товаров
      if (productRows.length > 0) {
        const productIds = productRows.map((p) => p.product_id);
        const commentsQuery = `SELECT * FROM comments WHERE product_id IN (${placeholders})`;
        const [commentRows] = await connection.query<ICommentEntity[]>(
          commentsQuery,
          productIds,
        );

        const imagesQuery = `SELECT * FROM images WHERE product_id IN (${placeholders})`;
        const [imageRows] = await connection.query<IImageEntity[]>(
          imagesQuery,
          productIds,
        );

        const products = mapProductsEntity(productRows);
        const enrichedProducts = enhanceProductsWithMedia(
          products,
          commentRows,
          imageRows,
        );

        res.json({
          similarProducts: enrichedProducts,
          count: enrichedProducts.length,
        });
      } else {
        res.json({ similarProducts: [], count: 0 });
      }
    } catch (e) {
      throwServerError(res, e as Error);
    }
  },
);

//---------------------------------------------POST /:id/similar — добавление похожих товаров
interface AddSimilarProductsRequest {
  similarProductIds: string[];
}

productsRouter.post(
  "/:id/similar",
  [
    param("id").isUUID().withMessage("Product ID must be a valid UUID"),
    body("similarProductIds")
      .isArray()
      .withMessage("similarProductIds must be an array"),
    body("similarProductIds.*")
      .isUUID()
      .withMessage("Each product ID must be a valid UUID"),
  ],
  async (
    req: Request<{ id: string }, {}, AddSimilarProductsRequest>,
    res: Response,
  ) => {
    try {
      // Проверка результатов валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const productId = req.params.id;
      const { similarProductIds } = req.body;
      const connection = getConnection();

      // Проверяем существование основного товара
      const [productCheck] = await connection.query<IProductEntity[]>(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
      );

      if (!productCheck?.[0]) {
        res.status(404);
        return res.json({ error: `Product with id ${productId} not found` });
      }

      // Проверяем существование всех указанных похожих товаров
      const placeholders = similarProductIds.map(() => "?").join(",");
      const [existingProducts] = await connection.query<IProductEntity[]>(
        `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
        similarProductIds,
      );

      const existingIds = existingProducts.map((p) => p.product_id);
      const invalidIds = similarProductIds.filter(
        (id) => !existingIds.includes(id),
      );

      if (invalidIds.length > 0) {
        res.status(400);
        return res.json({
          error: "Some product IDs do not exist",
          invalidIds,
        });
      }

      // Удаляем дубликаты и исключаем связь товара с самим собой
      const uniqueIds = [...new Set(similarProductIds)].filter(
        (id) => id !== productId,
      );

      if (uniqueIds.length === 0) {
        res.status(400);
        return res.json({
          error:
            "No valid product IDs to add (all are duplicates or self-references)",
        });
      }

      // Формируем данные для вставки
      const insertData = uniqueIds.map((similarId) => [productId, similarId]);

      // Вставляем связи, игнорируя дубликаты
      const INSERT_SIMILAR = `
        INSERT IGNORE INTO product_similarities (product_id, similar_product_id)
        VALUES ?
      `;

      await connection.query(INSERT_SIMILAR, [insertData]);

      res.status(201).json({
        message: `Successfully added ${uniqueIds.length} similar product links`,
        productId: productId,
        addedCount: uniqueIds.length,
        similarProductIds: uniqueIds,
      });
    } catch (e) {
      throwServerError(res, e as Error);
    }
  },
);

//--------------------------------------DELETE /:id/similar — удаление связей похожих товаров
interface DeleteSimilarProductsRequest {
  similarProductIds?: string[]; // Если пустой массив или отсутствует — удаляем все связи
}

productsRouter.delete(
  "/:id/similar",
  [
    param("id").isUUID().withMessage("Product ID must be a valid UUID"),
    body("similarProductIds")
      .optional()
      .isArray()
      .withMessage("similarProductIds must be an array if provided"),
    body("similarProductIds.*")
      .optional()
      .isUUID()
      .withMessage("Each product ID must be a valid UUID"),
  ],
  async (
    req: Request<{ id: string }, {}, DeleteSimilarProductsRequest>,
    res: Response,
  ) => {
    // Проверка результатов валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    try {
      const productId = req.params.id;
      const { similarProductIds } = req.body;
      const connection = getConnection();

      // Проверяем существование товара
      const [productCheck] = await connection.query<IProductEntity[]>(
        "SELECT product_id FROM products WHERE product_id = ?",
        [productId],
      );

      if (!productCheck?.[0]) {
        res.status(404);
        return res.json({ error: `Product with id ${productId} not found` });
      }

      let deletedCount = 0;

      if (similarProductIds && similarProductIds.length > 0) {
        // Удаляем конкретные связи
        const placeholders = similarProductIds.map(() => "?").join(",");
        const DELETE_SPECIFIC = `
          DELETE FROM product_similarities
          WHERE product_id = ? AND similar_product_id IN (${placeholders})
        `;

        const [result] = await connection.query<ResultSetHeader>(
          DELETE_SPECIFIC,
          [productId, ...similarProductIds],
        );
        deletedCount = result.affectedRows;
      } else {
        // Удаляем все связи для товара
        const DELETE_ALL = `
          DELETE FROM product_similarities
          WHERE product_id = ?
        `;

        const [result] = await connection.query<ResultSetHeader>(DELETE_ALL, [
          productId,
        ]);
        deletedCount = result.affectedRows;
      }

      res.json({
        message: `Successfully deleted ${deletedCount} similar product links`,
        productId: productId,
        deletedCount: deletedCount,
      });
    } catch (e) {
      throwServerError(res, e as Error);
    }
  },
);
