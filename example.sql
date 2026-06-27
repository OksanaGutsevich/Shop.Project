SELECT * FROM Product;

SELECT * FROM Products;

SELECT * FROM Product WHERE price > 10000;

SELECT * FROM Product WHERE description IS NOT NULL ORDER BY title ASC;

CREATE DATABASE ProductsApplication
USE ProductsApplication

CREATE TABLE products(
product_id VARCHAR(36) NOT NULL,
title VARCHAR(255) NOT NULL,
PRIMARY KEY (product_id)
)

ALTER TABLE products ADD description VARCHAR(255)
ALTER TABLE products ADD price DECIMAL(10,2)

INSERT INTO products
(product_id, title, description, price)
VALUES
(
'88a3f826-9c3d-4f7c-a56e-156d7c3f3b28',
'Phone X',
'A sleek and powerful smartphone with the latest features.',
'8499.99'
);

INSERT INTO products (product_id, title, description, price) VALUES
('5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', 'Nova 8i', 'A mid-range smartphone with a large display and great camera.', 11999.50),
('36239a24-f71d-4f11-a93e-506775f882e9', 'Pixel 6', 'A high-end smartphone with cutting-edge technology.', 56999.00),
('e144947e-3af7-4d3c-8327-ecf39255617d', 'Zenfone 8', 'A compact smartphone with premium features.', 25999.75),
('4f4b4f16-77cb-4c24-bcae-238cde406fb3', 'Reno6', 'A stylish smartphone with advanced camera capabilities.', 25999.50),
('34e1a2a7-d0a9-4c7a-99f6-c2d5b5afaa06', 'Galaxy A52', 'A mid-range smartphone with a large battery and display.', 17999.25),
('efd82d85-8dd6-4979-bf5c-96933d9c2f7d', 'Redmi Note 11', 'A budget-friendly smartphone with a powerful processor.', 7999.00),
('6f1a6b96-6cd2-439c-a648-88b9f287f7d2', 'Moto G60', 'A reliable and durable smartphone with a long-lasting battery.', 15999.00),
('9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 'iPhone SE', 'A compact and affordable iPhone with great performance.', 38999.50),
('a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58', 'Galaxy Z Flip 3', 'A foldable smartphone with a unique design.', 79999.00);



CREATE TABLE images(
image_id VARCHAR(36) NOT NULL,
url TEXT NOT NULL,
product_id VARCHAR(36) NOT NULL,
PRIMARY KEY (image_id),
FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO images
(image_id, url, product_id)
VALUES
(
'2010c73e-e446-11ed-b5ea-0242ac120002',
'https://unsplash.com/photos/0VGG7cqTwCo',
'6f1a6b96-6cd2-439c-a648-88b9f287f7d2'
),
(
'2010c964-e446-11ed-b5ea-0242ac120002',
'https://unsplash.com/photos/Uae7ouMw91A',
'6f1a6b96-6cd2-439c-a648-88b9f287f7d2'
),
(
'2010cc20-e446-11ed-b5ea-0242ac120002',
'https://unsplash.com/photos/uCz5tX1P620',
'6f1a6b96-6cd2-439c-a648-88b9f287f7d2'
);

ALTER TABLE images ADD main BOOL NOT NULL;

UPDATE images SET main = 1 WHERE image_id = '2010c194-e446-11ed-b5ea-0242ac120002';

SELECT COUNT(product_id)
FROM products
WHERE

SELECT p.product_id, p.title, p.description, p.price, GROUP_CONCAT(i.url SEPARATOR ',') AS images
FROM products AS p
LEFT JOIN images AS i ON p.product_id = i.product_id
WHERE p.title LIKE '%Moto%'
GROUP BY p.product_id;

INSERT INTO images (image_id, url, product_id, main) VALUES
('ca84686e-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/leqrylJNYUQ', '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', 1),
('ca846b8e-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/_HB3Y1wGlxw', '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', 0),
('ca846df0-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/wJQPr0iQpK4', '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', 0),
('ca846fb2-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/nP5YBhsbqB4', '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', 0),

('708886dc-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/52H5Nfi5WiE', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58', 1),
('708889f2-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/rscN8ZdL_r4', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58', 0),
('70888b46-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/vfanNM5NtuQ', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58', 0),
('70888c90-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/Pvck4ScQH9E', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58', 0),

('a0f2a9a6-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/sgNc8aY6Z7E', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 1),
('a0f2ae9c-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/mw6Onwg4frY', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 0),
('a0f2afd2-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/5m1BDvDbjZY', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 0),
('a0f2b0fe-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/cqFKhqv6Ong', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 0),

('c65bb9f8-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/8Syeat16I-g', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d', 1),
('c65bc984-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/_8S9nEmCZK0', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d', 0),
('c65bd136-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/NEv65ZXjuLg', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d', 0),
('c65bd316-e45b-11ed-b5ea-0242ac120002', 'https://unsplash.com/photos/Ayx2M0iiVFQ', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d', 0)


SELECT COUNT(DISTINCT p.product_id) AS num_products
FROM products p
INNER JOIN images i ON p.product_id = i.product_id;

SELECT DISTINCT p.title, p.price FROM products p
INNER JOIN images ON p.product_id = images.product_id;

CREATE TABLE comments(
comment_id VARCHAR(36) NOT NULL,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
body VARCHAR(255) NOT NULL,
product_id VARCHAR(36) NOT NULL,
PRIMARY KEY (comment_id),
FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO comments (comment_id, name, email, body, product_id) VALUES
(
 "dc698fee-e47b-11ed-b5ea-0242ac120002",
 "id labore ex et quam laborum",
 "Eliseo@gardner.biz",
 "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium",
 "5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c"
),
(
 "dc699412-e47b-11ed-b5ea-0242ac120002",
 "quo vero reiciendis velit similique earum",
 "Jayne_Kuhic@sydney.com",
 "est natus enim nihil est dolore omnis voluptatem numquam\net omnis occaecati quod ullam at\nvoluptatem error expedita pariatur\nnihil sint nostrum voluptatem reiciendis et",
 "5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c"
),
(
 "dc69b7b2-e47b-11ed-b5ea-0242ac120002",
 "eaque et deleniti atque tenetur ut quo ut",
 "Carmen_Keeling@caroline.name",
 "voluptate iusto quis nobis reprehenderit ipsum amet nulla\nquia quas dolores velit et non\naut quia necessitatibus\nnostrum quaerat nulla et accusamus nisi facilis",
 "a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58"
);

SELECT p.title AS product_title, COUNT(c.comment_id) AS comments_count
FROM products p
LEFT JOIN comments c ON p.product_id = c.product_id
GROUP BY p.title
HAVING COUNT(c.comment_id) > 0;

SELECT *
FROM comments
WHERE comment_id = 'dc69b7b2-e47b-11ed-b5ea-0242ac120002';

INSERT INTO
    comments (comment_id, name, email, body, product_id)
VALUES
    (
        "2b2a59ce-e751-11ed-a05b-0242ac120003",
        "odio adipisci rerum aut animi",
        "Nikita@garfield.biz",
        "quia molestiae reprehenderit quasi aspernatur\naut expedita occaecati aliquam eveniet laudantium\nomnis quibusdam delectus saepe quia accusamus maiores nam est\ncum et ducimus et vero voluptates excepturi deleniti ratione",
        "5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c"
    ),
    (
        "2b2a64b4-e751-11ed-a05b-0242ac120003",
        "alias odio sit",
        "Lew@alysha.tv",
        "non et atque\noccaecati deserunt quas accusantium unde odit nobis qui voluptatem\nquia voluptas consequuntur itaque dolor\net qui rerum deleniti ut occaecati",
        "5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c"
    ),
    (
        "2b2a67de-e751-11ed-a05b-0242ac120003",
        "vero eaque aliquid doloribus et culpa",
        "Hayden@althea.biz",
        "harum non quasi et ratione\ntempore iure ex voluptates in ratione\nharum architecto fugit inventore cupiditate\nvoluptates magni quo et",
        "9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c"
    ),
    (
        "2b2a69a0-e751-11ed-a05b-0242ac120003",
        "et fugit eligendi deleniti quidem qui sint nihil autem",
        "Presley.Mueller@myrl.com",
        "doloribus at sed quis culpa deserunt consectetur qui praesentium\naccusamus fugiat dicta\nvoluptatem rerum ut voluptate autem\nvoluptatem repellendus aspernatur dolorem in",
        "9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c"
    ),
    (
        "2b2a6b1c-e751-11ed-a05b-0242ac120003",
        "repellat consequatur praesentium vel minus molestias voluptatum",
        "Dallas@ole.me",
        "maiores sed dolores similique labore et inventore et\nquasi temporibus esse sunt id et\neos voluptatem aliquam\naliquid ratione corporis molestiae mollitia quia et magnam dolor",
        "e144947e-3af7-4d3c-8327-ecf39255617d"
    ),
    (
        "2b2a6cac-e751-11ed-a05b-0242ac120003",
        "et omnis dolorem",
        "Mallory_Kunze@marie.org",
        "ut voluptatem corrupti velit\nad voluptatem maiores\net nisi velit vero accusamus maiores\nvoluptates quia aliquid ullam eaque",
        "e144947e-3af7-4d3c-8327-ecf39255617d"
    ),
    (
        "2b2a6e14-e751-11ed-a05b-0242ac120003",
        "provident id voluptas",
        "Meghan_Littel@rene.us",
        "sapiente assumenda molestiae atque\nadipisci laborum distinctio aperiam et ab ut omnis\net occaecati aspernatur odit sit rem expedita\nquas enim ipsam minus",
        "e144947e-3af7-4d3c-8327-ecf39255617d"
    );
    SELECT * FROM productsapplication.comments;

    SELECT * FROM products
    where title LIKE '%Nova%'
    OR description LIKE '%compact%'
    OR (price > 15000 AND price < 16000);


    SELECT * FROM products
    WHERE title LIKE '%Nova%'
    AND description LIKE '%compact%'
    AND price >= 15000
    AND price <= 16000

    SELECT COUNT(*) FROM products; -- Общее количество товаров
    SELECT MIN(price), MAX(price) FROM products; -- Диапазон цен

    SELECT * FROM products WHERE price >= ?

    select * from productsapplication.images where product_id = '6f1a6b96-6cd2-439c-a648-88b9f287f7d2'; -- покажи мне продукт с опред.ID и все его изображения

    select * from productsapplication.comments where product_id = '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c'; -- покажи мне продукт с опред.ID и все его комментарии

    SELECT
  p.title AS product_title,
  COUNT(c.comment_id) AS comments_count
FROM products p
LEFT JOIN comments c ON p.product_id = c.product_id
GROUP BY p.title
HAVING COUNT(c.comment_id) > 0; -- поиск всех товаров, содержащих комментарии и количество комментариев для каждого

SELECT
  p.title AS product_title,
  COUNT(c.image_id) AS images_count
FROM products p
LEFT JOIN images c ON p.product_id = c.product_id
GROUP BY p.title
HAVING COUNT(c.image_id) > 0; --поиск всех товаров, содержащих изображения и количество изображений

SELECT * FROM productsapplication.images;

-- Проверьте наличие данных
SELECT COUNT(*) FROM images;

-- Проверьте связь товаров и фото
SELECT p.product_id, p.title, i.image_id, i.url
FROM products p
JOIN images i ON p.product_id = i.product_id;

-- Убедитесь, что product_id совпадает
SELECT DISTINCT product_id FROM images;
SELECT DISTINCT product_id FROM products;

--выполнить SQL-запрос к таблице товаров для обновления полей данного товара: title, description и price
UPDATE products
SET
title = 'Новый Xiomi',
description = 'Обновлённое описание товара',
price = 199.99
WHERE product_id = '99a3f826-9c3d-4f7c-a56e-156d7c3f3b99';

  --Выполним запрос создания таблицы из трех колонок  
    CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
    );

    INSERT INTO users (username, password) VALUES ('admin', 'admin_super_password');
    INSERT INTO users (username, password) VALUES ('editor', 'editor_strong_password');   

--создание таблицы - похожие товары 
CREATE TABLE product_similarities (
  product_id VARCHAR(36) NOT NULL,
  similar_product_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, similar_product_id),
  INDEX idx_similar_product (similar_product_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

--добавление ограничения внешнего ключа
ALTER TABLE product_similarities
ADD CONSTRAINT fk_product_similarities_product
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

ALTER TABLE product_similarities
ADD CONSTRAINT fk_product_similarities_similar
  FOREIGN KEY (similar_product_id) REFERENCES products(product_id) ON DELETE CASCADE;

--добавление связей
--Galaxy A52 + Phone X
--Galaxy A52 + iPhone SE
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('34e1a2a7-d0a9-4c7a-99f6-c2d5b5afaa06', '88a3f826-9c3d-4f7c-a56e-156d7c3f3b28'),
('34e1a2a7-d0a9-4c7a-99f6-c2d5b5afaa06', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c');

--Просмотреть все товары в таблице
SELECT * FROM products;

--показать все товары с нужными полями 
SELECT product_id, title, description, price
FROM products;

--проверить связь для Galaxy A52
SELECT * FROM product_similarities
WHERE product_id = '34e1a2a7-d0a9-4c7a-99f6-c2d5b5afaa06';

--добавление связей
--Xiomi13 + Pixel 6
--Xiomi13 + Nova 8i
--Xiomi13 + Reno6
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('23809c4f-0fcd-4d25-bd09-1af5938ccb2a', '36239a24-f71d-4f11-a93e-506775f882e9'),
('23809c4f-0fcd-4d25-bd09-1af5938ccb2a', '5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c'),
('23809c4f-0fcd-4d25-bd09-1af5938ccb2a', '4f4b4f16-77cb-4c24-bcae-238cde406fb3');

--добавление связей
--Pixel 6 + Moto G60
--Pixel 6 + Galaxy Z Flip 3
--Pixel 6 + Zenfone 8
--Pixel 6 + Redmi Note 11
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('36239a24-f71d-4f11-a93e-506775f882e9', '6f1a6b96-6cd2-439c-a648-88b9f287f7d2'),
('36239a24-f71d-4f11-a93e-506775f882e9', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58'),
('36239a24-f71d-4f11-a93e-506775f882e9', 'e144947e-3af7-4d3c-8327-ecf39255617d'),
('36239a24-f71d-4f11-a93e-506775f882e9', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d');

--добавление связей
--Reno6 + iPhone SE
--Reno6 + Galaxy A52
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('4f4b4f16-77cb-4c24-bcae-238cde406fb3', '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c'),
('4f4b4f16-77cb-4c24-bcae-238cde406fb3', '34e1a2a7-d0a9-4c7a-99f6-c2d5b5afaa06');

--добавление связей
--Nova 8i + Xiomi13
--Nova 8i + Moto G60
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', '23809c4f-0fcd-4d25-bd09-1af5938ccb2a'),
('5c5f94eb-7e38-45e1-b7c9-57dfb7a2b93c', '6f1a6b96-6cd2-439c-a648-88b9f287f7d2');

--добавление связей
--Xiomi13 + Redmi Note 11
--Xiomi13 + Moto G60
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('23809c4f-0fcd-4d25-bd09-1af5938ccb2a', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d'),
('23809c4f-0fcd-4d25-bd09-1af5938ccb2a', '6f1a6b96-6cd2-439c-a648-88b9f287f7d2');


--Phone X + Galaxy Z Flip 3
--Phone X + Zenfone 8
--Phone X + Redmi Note 11
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('88a3f826-9c3d-4f7c-a56e-156d7c3f3b28', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58'),
('88a3f826-9c3d-4f7c-a56e-156d7c3f3b28', 'e144947e-3af7-4d3c-8327-ecf39255617d'),
('88a3f826-9c3d-4f7c-a56e-156d7c3f3b28', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d');

--iPhone SE + Galaxy Z Flip 3
--iPhone SE + Zenfone 8
--iPhone SE + Redmi Note 11
  INSERT INTO product_similarities (product_id, similar_product_id) VALUES
('9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 'a3d0fa3b-8e2c-4d19-bf2a-950b8c998a58'),
('9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 'e144947e-3af7-4d3c-8327-ecf39255617d'),
('9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c', 'efd82d85-8dd6-4979-bf5c-96933d9c2f7d');

--Postman метод GET ищем по ID похожие товары
--http://localhost:3000/api/products/23809c4f-0fcd-4d25-bd09-1af5938ccb2a/similar

--Postman метод POST добавления связей «похожих товаров»
--http://localhost:3000/api/products/23809c4f-0fcd-4d25-bd09-1af5938ccb2a/similar
--плюс тело запроса (JSON): 
{
  "similarProductIds": [
    "9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c",
    "efd82d85-8dd6-4979-bf5c-96933d9c2f7d"
  ]
}

--Postman метод DELETE добавления связей «похожих товаров»
--http://localhost:3000/api/products/23809c4f-0fcd-4d25-bd09-1af5938ccb2a/similar
--плюс тело запроса (JSON): 
{
  "similarProductIds": [
    "9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c"
  ]
}

--метод GET валидация похожих товаров - указание неверного ID товара
--http://localhost:3000/api/products/invalidID/similar

--метод POST валидация похожих товаров - указание неверного тела товара
--http://localhost:3000/api/products/invalidID/similar
--плюс тело запроса (JSON)
{
  "similarProductIds": "not-an-array"
}

--метод DELETE валидация похожих товаров - указание UUID товара
--http://localhost:3000/api/products/invalidID/similar
--плюс тело запроса (JSON)
{
  "similarProductIds": ["invalid-uuid"]
}

--удалить все связи
DELETE FROM product_similarities
WHERE product_id = '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c';

--удалить определённый товар (похожий)
DELETE FROM product_similarities
WHERE product_id = '9b4d4a1a-5224-4ad4-b4e3-053dcbfa0f3c'
  AND similar_product_id = 'вставь-сюда-uuid-похожего-товара';