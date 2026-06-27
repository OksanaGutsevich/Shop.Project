import { throwServerError } from "./helper";
import e, { NextFunction, Request, Response, Router } from "express";
import { IAuthRequisites } from "../../Shared/types";
import { verifyRequisites } from "../models/auth.model";

export const authRouter = Router();

authRouter.get("/login", async (req: Request, res: Response) => {
  try {
    res.render("login");
  } catch (e) {
    throwServerError(res, e);
  }
});

authRouter.post(
  "/authenticate",
  async (req: Request<{}, {}, IAuthRequisites>, res: Response) => {
    try {
      console.log("DEBUG auth.authenticate: body=", req.body);
      const verified = await verifyRequisites(req.body);
      console.log("DEBUG auth.authenticate: verified=", verified);

      if (verified) {
        // Сохраняем username в сессии, чтобы validateSession пропускал авторизованного пользователя
        (req.session as any).username = req.body.username;
        res.redirect(`/${process.env.ADMIN_PATH}`);
      } else {
        res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
      }
    } catch (e) {
      throwServerError(res, e);
    }
  },
);

//функция validateSession
export const validateSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path.includes("/login") || req.path.includes("/authenticate")) {
    next();
    return;
  }

  if ((req.session as any)?.username) {
    next();
  } else {
    res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
  }
};

//метод logout для выхода из админки
authRouter.get("/logout", async (req: Request, res: Response) => {
  try {
    req.session.destroy((e) => {
      if (e) {
        console.log("Something went wrong with session destroying", e);
      }

      res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
    });
  } catch (e) {
    throwServerError(res, e);
  }
});
