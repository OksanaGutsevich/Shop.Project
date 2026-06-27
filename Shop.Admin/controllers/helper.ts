import { Response } from "express";

export const throwServerError = (res: Response, e: Error) => {
  // Пытаемся вывести максимум информации для дебага
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err: any = e;
  if (err.isAxiosError) {
    console.error("Axios server error in productsRouter:", {
      message: err.message,
      stack: err.stack,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
    });
  } else {
    console.error("Server error in productsRouter:", err.stack || err.message);
  }

  // Один вызов: ставим статус и сразу отправляем тело
  return res.status(500).send("Something went wrong");
};
