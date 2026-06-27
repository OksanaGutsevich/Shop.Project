import { RowDataPacket } from "mysql2";
import pool from "../../db";
import { IProduct } from "@Shared/types";

const host = `http://${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;

export async function getSimilarProductsDirect(
  productId: string,
): Promise<IProduct[]> {
  const conn = await pool.getConnection();
  try {
    // 1. Получаем ID связанных товаров
    const [idsRows] = await conn.query<RowDataPacket[]>(
      `SELECT similar_product_id FROM product_similarities WHERE product_id = ?`,
      [productId],
    );

    if (!idsRows || idsRows.length === 0) {
      return [];
    }

    const similarIds = idsRows.map((r: any) => r.similar_product_id);
    const placeholders = similarIds.map(() => "?").join(",");

    // 2. Получаем основные данные товаров (только то, что реально нужно для карточки)
    const [productsRows] = await conn.query<RowDataPacket[]>(
      `SELECT product_id, title, price FROM products WHERE product_id IN (${placeholders})`,
      similarIds,
    );

    if (!productsRows || productsRows.length === 0) {
      return [];
    }

    // 3. МАППИНГ С ЗАГЛУШКАМИ: Приводим сырые данные к строгому типу IProduct
    return productsRows.map((row) => ({
      id: row.product_id,
      title: row.title,
      price: typeof row.price === "number" ? row.price : parseFloat(row.price),

      // --- ЗАГЛУШКИ ДЛЯ СТРОГОГО ИНТЕРФЕЙСА ---
      description: "", // Обязательно: строка
      comments: undefined, // Опционально: можно оставить undefined
      images: [], // Обязательно: пустой массив вместо undefined
      thumbnail: null, // Обязательно: null вместо undefined
    }));
  } catch (error) {
    console.error("Error fetching similar products:", error);
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Удаляет связи «похожих товаров» напрямую из БД (транзакционно).
 * Это аналог того, что ты хотел в контроллере, но вынесенный в модель.
 */
export async function deleteSimilarProductLinksDirect(
  productId: string,
  idsToRemove: string[],
): Promise<void> {
  if (!idsToRemove || idsToRemove.length === 0) {
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const placeholders = idsToRemove.map(() => "?").join(",");

    // Удаляем прямые связи: product_id -> similar_product_id
    await conn.query(
      `DELETE FROM product_similarities 
       WHERE product_id = ? AND similar_product_id IN (${placeholders})`,
      [productId, ...idsToRemove],
    );

    // Опционально: удаляем обратные связи (симметричность)
    await conn.query(
      `DELETE FROM product_similarities 
       WHERE similar_product_id = ? AND product_id IN (${placeholders})`,
      [productId, ...idsToRemove],
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
