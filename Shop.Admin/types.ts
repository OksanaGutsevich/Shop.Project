export interface IProductEditData {
  title: string;
  description: string;
  price: string | number;

  // Изображения
  newImages?: string; // строка: URL через запятую или перенос строки
  imagesToRemove?: string | string[]; // ID картинок для удаления
  mainImage?: string; // ID картинки для обложки

  // Комментарии
  commentsToRemove?: string | string[]; // ID комментариев для удаления
  newComments?: string[]; // массив новых текстов комментариев
  editedComments?: Array<{ id: string; text: string }>; // массив изменённых комментариев { id, text }
}

export interface IProductUpdatePayload {
  title?: string;
  description?: string;
  price?: number | string; // string допустим, если будешь парсить внутри модели
}
