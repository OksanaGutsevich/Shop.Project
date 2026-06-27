export interface IComment {
  id: string;
  name: string;
  email: string;
  body: string;
  productId: string;
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  comments?: IComment[];
  images?: IImage[];
  thumbnail?: IImage | null;
}

export interface IImage {
  id: string;
  productId: string;
  url: string;
  isMain: boolean;
}

export interface IProductFilterPayload {
  title?: string;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface IAuthRequisites {
  username: string;
  password: string;
}
