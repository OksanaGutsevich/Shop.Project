import { IProductEntity, IImageEntity } from "../../types";
import { ICommentEntity } from "../../types";
import { IProduct, IComment, IImage } from "@Shared/types";

export const mapProductsEntity = (data: IProductEntity[]): IProduct[] => {
  return data.map(({ product_id, title, description, price }) => ({
    id: product_id,
    title: title || "",
    description: description || "",
    price: Number(price) || 0,
    comments: [], //надо?????????
    images: [],
    thumbnail: null,
  }));
};

export const mapCommentEntity = ({
  comment_id,
  product_id,
  ...rest
}: ICommentEntity): IComment => {
  return {
    id: comment_id,
    productId: product_id,
    ...rest,
  };
};

export const mapCommentsEntity = (data: ICommentEntity[]): IComment[] => {
  return data.map(mapCommentEntity);
};

// Функция: маппинг сущности изображения в бизнес‑модель
export const mapImageEntity = (entity: IImageEntity): IImage => ({
  id: entity.image_id,
  productId: entity.product_id,
  url: entity.url || "",
  isMain: entity.main === 1,
});

// Функция для маппинга массива сущностей изображений
export const mapImagesEntity = (entities: IImageEntity[]): IImage[] =>
  entities.map(mapImageEntity);
