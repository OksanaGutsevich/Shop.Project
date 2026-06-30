import axios from "axios";
import { ResultSetHeader } from "mysql2";
import { IProduct } from "@Shared/types";
import { IProductFilterPayload } from "@Shared/types";
import { IProductEditData } from "../types";
import pool from "../../db";
import { REPLACE_PRODUCT_THUMBNAIL } from "../queries";
import { IProductUpdatePayload } from "../types";

const host = `http://${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;

export async function getProducts(): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${host}/products`);
  return data || [];
}

export async function searchProducts(
  filter: IProductFilterPayload,
): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${host}/products/search`, {
    params: filter,
  });
  return data || [];
}

export interface IProductCreatePayload {
  title: string;
  description?: string;
  price: number | string;
  images?: string | string[] | undefined; // допускаем строку или массив
}

export async function createProduct(
  payload: IProductCreatePayload,
): Promise<IProduct> {
  if (!payload.title || typeof payload.title !== "string") {
    throw new Error("Title is required and must be a string.");
  }
  if (payload.price === undefined) {
    throw new Error("Price is required.");
  }

  const priceValue =
    typeof payload.price === "string"
      ? parseFloat(payload.price)
      : payload.price;
  if (!isFinite(priceValue)) {
    throw new Error("Invalid price value.");
  }

  // Нормализуем images в массив
  const imagesPayload: { url: string; main: boolean }[] = [];
  if (payload.images) {
    const urls: string[] =
      typeof payload.images === "string"
        ? splitNewImages(payload.images)
        : payload.images; // если уже массив

    urls.forEach((url, index) => {
      imagesPayload.push({
        url,
        main: index === 0,
      });
    });
  }

  const requestBody = {
    title: payload.title.trim(),
    description: payload.description?.trim(),
    price: priceValue,
    images: imagesPayload,
  };

  try {
    const response = await axios.post<IProduct>(
      `${host}/products`,
      requestBody,
    );
    return response.data;
  } catch (err: any) {
    if (err.isAxiosError) {
      throw err.response?.data || err;
    }
    throw err;
  }
}

//модель данных товара по id
export async function getProduct(id: string): Promise<IProduct | null> {
  try {
    const { data } = await axios.get<IProduct>(`${host}/products/${id}`);
    return data;
  } catch (e) {
    return null;
  }
}

//удаление товара
export async function removeProduct(id: string): Promise<void> {
  await axios.delete(`${host}/products/${id}`);
}

//метод updateProduct

function splitNewImages(str = ""): string[] {
  return str
    .split(/\r\n|,/g)
    .map((url) => url.trim())
    .filter((url) => url);
}

function compileIdsToRemove(
  data: string | string[] | undefined | null,
): string[] {
  if (data === undefined || data === null) {
    return [];
  }

  // Если пришла одна строка — разбиваем по запятой, чистим и убираем пустые
  if (typeof data === "string") {
    return data
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  // Если пришёл массив — чистим каждый элемент и убираем пустые
  return data
    .map((id) => (typeof id === "string" ? id.trim() : String(id)))
    .filter((id) => id.length > 0);
}

export async function updateProduct(
  productId: string,
  formData: IProductEditData,
): Promise<void> {
  try {
    // Сначала получаем текущее состояние товара (нужно для логики mainImage)
    const { data: currentProduct } = await axios.get<IProduct>(
      `${host}/products/${productId}`,
    );

    // --- КОММЕНТАРИИ: УДАЛЕНИЕ ---
    let commentsIdsToRemove: string[] = [];
    if (formData.commentsToRemove) {
      commentsIdsToRemove = compileIdsToRemove(formData.commentsToRemove);
      if (commentsIdsToRemove.length > 0) {
        await Promise.all(
          commentsIdsToRemove.map((commentId) =>
            axios.delete(`${host}/comments/${commentId}`),
          ),
        );
      }
    }

    // --- КОММЕНТАРИИ: СОЗДАНИЕ НОВЫХ ---
    if (formData.newComments && formData.newComments.length > 0) {
      await Promise.all(
        formData.newComments
          .filter((c) => c && c.trim().length > 0)
          .map((text) =>
            axios.post(`${host}/comments`, {
              productId,
              text: text.trim(),
            }),
          ),
      );
    }

    // --- КОММЕНТАРИИ: ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ---
    if (formData.editedComments && formData.editedComments.length > 0) {
      const removedSet = new Set(commentsIdsToRemove);
      await Promise.all(
        formData.editedComments
          .filter(
            (item) =>
              item.id && item.text !== undefined && !removedSet.has(item.id),
          )
          .map(({ id, text }) =>
            axios.patch(`${host}/comments/${id}`, { text: text.trim() }),
          ),
      );
    }

    // --- ИЗОБРАЖЕНИЯ: УДАЛЕНИЕ ---
    if (formData.imagesToRemove) {
      const imagesIdsToRemove = compileIdsToRemove(formData.imagesToRemove);
      if (imagesIdsToRemove.length > 0) {
        console.log("DEBUG: sending to backend:", imagesIdsToRemove);
        try {
          await axios.post(`${host}/products/${productId}/images/delete`, {
            imageIds: imagesIdsToRemove,
          });
          console.log("Images removed successfully");
        } catch (err: any) {
          console.error("Failed to remove images:", err.response?.data, err);
        }
      }
    }

    // --- ИЗОБРАЖЕНИЯ: ДОБАВЛЕНИЕ НОВЫХ ---
    if (formData.newImages) {
      const urls = splitNewImages(formData.newImages);
      const images = urls.map((url) => ({ url, main: false }));

      if (!currentProduct.thumbnail) {
        images[0].main = true;
      }

      const urlsOnly = images.map((i) => i.url);
      await axios.post(`${host}/products/${productId}/images`, {
        images: urlsOnly,
      });
    }

    // --- ОБНОВЛЕНИЕ MAIN IMAGE (ОБЛОЖКИ) ---
    if (
      formData.mainImage &&
      formData.mainImage !== currentProduct?.thumbnail?.id
    ) {
      await axios.post(`${host}/products/update-thumbnail/${productId}`, {
        newThumbnailId: formData.mainImage,
      });
    }

    // --- ОСНОВНЫЕ ПОЛЯ (title, description, price) — ЧЕРЕЗ МОДЕЛЬ (БД) ---
    await updateProductPartial(productId, {
      title: formData.title,
      description: formData.description,
      price: formData.price, // строка или число — внутри partial будет parseFloat
    });
  } catch (e) {
    const err: any = e;
    if (err.isAxiosError) {
      try {
        console.error("Axios error in updateProduct:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
        });
      } catch (inner) {
        console.error("Failed to log axios error details:", inner);
      }
    } else {
      console.error("Error in updateProduct:", err);
    }
    throw e;
  }
}

//Работа с изображением-обложкой товара (mainImage)
interface AppError extends Error {
  status?: number;
}

export async function updateThumbnail(
  productId: string,
  newThumbnailId: string,
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Ищем текущую обложку (картинку с main = 1)
    const [currentRows] = await conn.query<any[]>(
      `SELECT image_id, main FROM images WHERE product_id = ? AND main = 1 LIMIT 1`,
      [productId],
    );

    const currentThumbnail = currentRows[0];
    if (!currentThumbnail) {
      const err = Object.assign(
        new Error("Current product has no thumbnail. Cannot update."),
        { status: 400 },
      );
      throw err;
    }

    const currentId = currentThumbnail.id;

    // Если выбрали ту же картинку — ничего не делаем
    if (currentId === newThumbnailId) {
      await conn.commit();
      return;
    }

    // 2. Проверяем, что новая картинка существует и принадлежит этому товару
    const [newRows] = await conn.query<any[]>(
      `SELECT image_id FROM images WHERE id = ? AND product_id = ?`,
      [newThumbnailId, productId],
    );

    if (!newRows[0]) {
      const err = Object.assign(
        new Error(
          `Image with id '${newThumbnailId}' does not exist for this product.`,
        ),
        { status: 400 },
      );
      throw err;
    }

    // 3. Атомарное переключение через один UPDATE с CASE
    const [info] = await conn.query(REPLACE_PRODUCT_THUMBNAIL, [
      currentId, // WHEN id = ? THEN 0 (старая)
      newThumbnailId, // WHEN id = ? THEN 1 (новая)
      currentId, // WHERE id IN (?, ?)
      newThumbnailId,
      productId, // AND product_id = ? (защита)
    ]);

    console.log("Affected rows (images):", (info as any).affectedRows);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// функция специально для PATCH API (частичное обновление)
export async function updateProductPartial(
  productId: string,
  data: IProductUpdatePayload,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.price !== undefined) {
      // Если в БД цена число, а приходит строка - приводим
      const priceValue =
        typeof data.price === "string" ? parseFloat(data.price) : data.price;
      if (!isNaN(priceValue as number)) {
        updates.push("price = ?");
        values.push(priceValue);
      }
    }

    if (updates.length === 0) {
      await connection.rollback();
      throw new Error("No fields to update");
    }

    const sql = `UPDATE products SET ${updates.join(", ")} WHERE product_id = ?`;
    values.push(productId);

    const [result] = await connection.query<ResultSetHeader>(sql, values);

    if ((result as ResultSetHeader).affectedRows === 0) {
      await connection.rollback();
      throw new Error(`Product with id ${productId} not found`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
