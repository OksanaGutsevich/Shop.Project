import { RowDataPacket } from "mysql2";
import { IComment, IProduct, IProductFilterPayload } from "@Shared/types";
import { IAuthRequisites } from "@Shared/types";

export type CommentCreatePayload = Omit<IComment, "id">;

export interface ICommentEntity extends RowDataPacket {
  comment_id: string;
  name: string;
  email: string;
  body: string;
  product_id: string;
}

export interface IProductEntity extends RowDataPacket {
  product_id: string;
  title: string | null;
  description: string | null;
  price: number | null;
}

export interface IProductSearchFilter extends IProductFilterPayload {}

export interface IProductSearchQuery {
  title?: string;
  description?: string;
  priceFrom?: string;
  priceTo?: string;
}

export type ProductCreatePayload = Omit<IProduct, "id" | "comments">;

export interface IImageEntity extends RowDataPacket {
  image_id: string;
  url: string;
  product_id: string;
  main: number; // 1 — обложка, 0 — дополнительное
}

//интерфейс для описания сущностей из базы — реквизитов пользовател
export interface IUserRequisitesEntity extends IAuthRequisites, RowDataPacket {
  id: number;
}
