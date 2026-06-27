import { IAuthRequisites } from "@Shared/types";
import { IUserRequisitesEntity } from "../../types";
import { Request, Response, Router } from "express";
import { getConnection } from "../../../Server/services/db";

export const authRouter = Router();

authRouter.post(
  "/",
  async (req: Request<{}, {}, IAuthRequisites>, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "username and password are required" });
      }

      const connection = getConnection();
      const [rows] = await connection.query<IUserRequisitesEntity[]>(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password],
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't return password/hash in response
      const user = rows[0];
      return res.json({ username: user.username });
    } catch (error) {
      console.error("Error in auth route:", error);
      return res.status(500).json({ error: "Server error" });
    }
  },
);
