import { RowDataPacket } from "mysql2";
import pool from "../../db";
import { IProduct } from "@Shared/types";
import connectionInstance from "../../db";

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

//----------------------------------------------------------------------------------------------
export async function getAllProducts(): Promise<IProduct[]> {
  const conn = await pool.getConnection();

  try {
    // Простой SELECT всех полей. Если полей очень много, лучше явно перечислить нужные.
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM products");

    if (!rows || rows.length === 0) {
      return [];
    }

    // Маппинг сырых данных в строгий интерфейс IProduct (как в твоем примере)
    return (rows as RowDataPacket[]).map((row) => ({
      id: row.product_id || row.id, // Учитываем возможное имя колонки
      title: row.title || "",
      price:
        typeof row.price === "number"
          ? row.price
          : parseFloat(row.price || "0"),

      // Заполняем обязательные поля интерфейса заглушками
      description: row.description || "",
      comments: undefined,
      images: [],
      thumbnail: null,
    }));
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  } finally {
    // ВАЖНО: Здесь НЕТ conn.release(), так как мы не используем пул соединений.
    // Соединение остается активным для следующих запросов.
  }
}

//----------------------------------------------------------------------------------------------
export async function getAvailableCandidates(
  currentProductId: string,
): Promise<IProduct[]> {
  const conn = await pool.getConnection();

  try {
    const sql = `
      SELECT p.*
      FROM products p
      LEFT JOIN product_similarities ps 
        ON p.product_id = ps.similar_product_id 
        AND ps.product_id = ?
      WHERE p.product_id != ? 
      AND ps.product_id IS NULL
    `;

    // Передаем UUID дважды:
    // 1. Для условия JOIN (чтобы найти существующие связи)
    // 2. Для условия WHERE (чтобы исключить сам товар)
    const [rows] = await conn.query<RowDataPacket[]>(sql, [
      currentProductId,
      currentProductId,
    ]);

    if (!rows || (rows as any).length === 0) {
      return [];
    }

    return (rows as RowDataPacket[]).map((row) => ({
      id: row.product_id, // Маппинг: БД (product_id) -> JS (id)
      title: row.title || "",
      price:
        typeof row.price === "number"
          ? row.price
          : row.price
            ? parseFloat(row.price)
            : 0,
      description: row.description || "",
      comments: undefined,
      images: [],
      thumbnail: null,
    }));
  } catch (error) {
    console.error("Error in getAvailableCandidates:", error);
    throw error;
  }
}

export async function addSimilarProductLinksDirect(
  mainId: string,
  similarIds: string[],
) {
  // Если массив пустой — ничего не делаем, это безопасно
  if (!similarIds || similarIds.length === 0) {
    return;
  }

  const conn = await pool.getConnection();

  try {
    // 1. Создаём строку "(?, ?), (?, ?), ..." нужной длины
    const valuePlaceholders = similarIds.map(() => "(?, ?)").join(", ");

    // 2. Формируем плоский массив значений: [mainId, id1, mainId, id2, ...]
    const values = similarIds.flatMap((id) => [mainId, id]);

    const sql = `
      INSERT INTO product_similarities (product_id, similar_product_id)
      VALUES ${valuePlaceholders}
    `;

    await conn.execute(sql, values);

    console.log(
      `Added ${similarIds.length} similar links for product ${mainId}`,
    );
  } catch (error) {
    console.error("Error adding similar product links:", error);
    throw error;
  }
}
