import { CommentCreatePayload, IProductSearchFilter } from "../types";
import { IComment } from "@Shared/types";

type CommentValidator = (comment: CommentCreatePayload) => string | null;

export const validateComment: CommentValidator = (comment) => {
  if (!comment) {
    return "Comment is absent";
  }

  const requiredFields: Array<keyof CommentCreatePayload> = [
    "name",
    "email",
    "body",
    "productId",
  ];

  for (const fieldName of requiredFields) {
    if (
      comment[fieldName] === undefined ||
      comment[fieldName] === null ||
      comment[fieldName] === ""
    ) {
      return `Field '${fieldName}' is absent or empty`;
    }
  }

  return null;
};

const compareValues = (target: string, compare: string): boolean => {
  return target.toLowerCase() === compare.toLowerCase();
};

export const checkCommentUniq = (
  payload: CommentCreatePayload,
  comments: IComment[],
): boolean => {
  const byEmail = comments.find(({ email }) =>
    compareValues(payload.email, email),
  );

  if (!byEmail) {
    return true;
  }

  const { body, name, productId } = byEmail;
  return !(
    compareValues(payload.body, body) &&
    compareValues(payload.name, name) &&
    compareValues(payload.productId.toString(), productId.toString())
  );
};

//поиск товаров по фильтру

type QueryWithParams = [string, (string | number)[]];

export const getProductsFilterQuery = (
  filter: IProductSearchFilter,
): QueryWithParams => {
  const { title, description, priceFrom, priceTo } = filter;

  let queryParts: string[] = [];
  const values: (string | number)[] = [];

  // Текстовые фильтры — объединяем через OR
  const textConditions: string[] = [];

  if (title) {
    textConditions.push("title LIKE ?");
    values.push(`%${title}%`);
  }

  if (description) {
    textConditions.push("description LIKE ?");
    values.push(`%${description}%`);
  }

  // Если есть текстовые условия, добавляем их в запрос в скобках с OR
  if (textConditions.length > 0) {
    queryParts.push(`(${textConditions.join(" OR ")})`);
  }

  // Ценовые фильтры — добавляем как отдельные условия (AND)
  if (priceFrom !== undefined) {
    queryParts.push("price >= ?");
    values.push(priceFrom);
  }

  if (priceTo !== undefined) {
    queryParts.push("price <= ?");
    values.push(priceTo);
  }

  // Если нет условий — возвращаем все продукты
  if (queryParts.length === 0) {
    return ["SELECT * FROM products", []];
  }

  // Объединяем все условия через AND
  // Текстовая группа (OR) будет одним условием, ценовые — отдельными
  const whereClause = `WHERE ${queryParts.join(" AND ")}`;
  const fullQuery = `SELECT * FROM products ${whereClause}`;

  return [fullQuery, values];
};

export default getProductsFilterQuery;
