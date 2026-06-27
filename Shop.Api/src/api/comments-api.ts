import { Request, Response, Router } from "express";
import { CommentCreatePayload, ICommentEntity } from "../../types";
import { IComment } from "@Shared/types";
import { validateComment } from "../helpers";
// @ts-ignore: temporary fix for missing uuid types in this environment
import { v4 as uuidv4 } from "uuid";
import { getConnection } from "../../../Server/services/db";

export const commentsRouter = Router();

// Вспомогательная функция для маппинга сущностей БД в DTO
function mapToComment(commentEntity: ICommentEntity): IComment {
  return {
    id: commentEntity.comment_id,
    name: commentEntity.name,
    email: commentEntity.email,
    body: commentEntity.body,
    productId: commentEntity.product_id,
  };
}

// GET / — получение всех комментариев
commentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const connection = getConnection();
    const [rows] = await connection.query<ICommentEntity[]>(
      "SELECT * FROM comments",
    );

    const commentsModel = rows.map(mapToComment);

    res.json(commentsModel);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /:id — получение всех комментариев с указанным ID
commentsRouter.get(
  "/:id",
  async (
    req: Request<{ id: string }>,
    res: Response<IComment[] | { error: string }>,
  ) => {
    try {
      const id = req.params.id;
      const connection = getConnection();
      const [rows] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE comment_id = ?",
        [id],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: `Comments with id ${id} are not found` });
      }

      // Преобразуем все найденные записи
      const commentsModel = rows.map(mapToComment);

      res.json(commentsModel);
    } catch (error) {
      console.error("Error fetching comments by ID:", error);
      res.status(500).json({ error: "Server error. Failed to fetch comments" });
    }
  },
);

// POST / — создание нового комментария
commentsRouter.post(
  "/",
  async (req: Request<{}, {}, CommentCreatePayload>, res: Response) => {
    try {
      const validationResult = validateComment(req.body);

      if (validationResult) {
        return res.status(400).json({ message: validationResult });
      }

      const connection = getConnection();

      // Проверяем уникальность комментария в БД с учётом регистра (через LOWER в SQL)
      const [existing] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE LOWER(name) = LOWER(?) AND LOWER(email) = LOWER(?) AND LOWER(body) = LOWER(?) AND product_id = ?",
        [req.body.name, req.body.email, req.body.body, req.body.productId],
      );

      if (existing.length > 0) {
        return res.status(422).json({
          message:
            "Comment with the same fields already exists (case‑insensitive)",
        });
      }

      const id = uuidv4();
      await connection.query(
        "INSERT INTO comments (comment_id, name, email, body, product_id) VALUES (?, ?, ?, ?, ?)",
        [id, req.body.name, req.body.email, req.body.body, req.body.productId],
      );

      res.status(201).json({
        message: `Comment id:${id} has been added!`,
        id,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({
        message: "Server error. Comment has not been created",
      });
    }
  },
);

// PATCH / — обновление комментария
commentsRouter.patch(
  "/:id",
  async (req: Request<{ id: string }, {}, { text: string }>, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res
          .status(400)
          .json({ error: "Field 'text' is required and must be a string" });
      }

      const connection = getConnection();

      const [existing] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE comment_id = ?",
        [id],
      );

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ error: `Comment with id ${id} is not found` });
      }

      await connection.query(
        "UPDATE comments SET body = ? WHERE comment_id = ?",
        [text, id],
      );

      const [updated] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE comment_id = ?",
        [id],
      );

      res.json(mapToComment(updated[0]));
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Server error. Operation failed" });
    }
  },
);

// DELETE /:id — удаление комментария по ID
commentsRouter.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = req.params.id;
      console.log(`DEBUG comments DELETE called with id=${id}`);
      const connection = getConnection();

      // Сначала получаем удаляемый комментарий
      const [toDelete] = await connection.query<ICommentEntity[]>(
        "SELECT * FROM comments WHERE comment_id = ?",
        [id],
      );

      if (toDelete.length === 0) {
        return res
          .status(404)
          .json({ error: `Comment with id ${id} is not found` });
      }

      // Удаляем комментарий
      await connection.query("DELETE FROM comments WHERE comment_id = ?", [id]);

      res.json(mapToComment(toDelete[0]));
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Server error. Failed to delete comment" });
    }
  },
);

export default commentsRouter;
