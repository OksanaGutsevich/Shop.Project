export const INSERT_PRODUCT_QUERY = `
        INSERT INTO products
        (product_id, title, description, price)
        VALUES
        (?, ?, ?, ?)
    `;

export default INSERT_PRODUCT_QUERY;
