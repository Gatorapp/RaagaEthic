import { DatabaseSync } from "node:sqlite";
import type { InsertOrder, InsertProduct, Order, Product } from "@shared/schema";
import { NeonStorage } from "./neon-storage";

let sqliteInstance: DatabaseSync | undefined;

function localDatabase(): DatabaseSync {
  if (sqliteInstance) return sqliteInstance;

  const database = new DatabaseSync("data.db");
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  images TEXT NOT NULL,
  sizes TEXT NOT NULL,
  color TEXT NOT NULL,
  fabric TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  items TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL
);
`);
  sqliteInstance = database;
  return database;
}

const productSelect = `
  SELECT id, name, slug, category, description, price,
    compare_at_price AS compareAtPrice, images, sizes, color, fabric, sku, stock,
    featured, active
  FROM products
`;

const orderSelect = `
  SELECT id, order_number AS orderNumber, customer_name AS customerName, email,
    phone, address_line1 AS addressLine1, address_line2 AS addressLine2, city,
    state, zip, country, items, subtotal, shipping, total, status,
    stripe_session_id AS stripeSessionId, created_at AS createdAt
  FROM orders
`;

function productRow(row: any): Product | undefined {
  return row ? { ...row, featured: Boolean(row.featured), active: Boolean(row.active) } : undefined;
}

function orderRow(row: any): Order | undefined {
  return row || undefined;
}

const productColumns: Record<keyof InsertProduct, string> = {
  name: "name",
  slug: "slug",
  category: "category",
  description: "description",
  price: "price",
  compareAtPrice: "compare_at_price",
  images: "images",
  sizes: "sizes",
  color: "color",
  fabric: "fabric",
  sku: "sku",
  stock: "stock",
  featured: "featured",
  active: "active",
};

export class DatabaseStorage {
  async listProducts(options?: { category?: string; activeOnly?: boolean }): Promise<Product[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (options?.activeOnly) clauses.push("active = 1");
    if (options?.category) {
      clauses.push("category = ?");
      values.push(options.category);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    return localDatabase()
      .prepare(`${productSelect}${where} ORDER BY id DESC`)
      .all(...values)
      .map((row: any) => productRow(row)!);
  }

  async exportProducts() {
    return localDatabase().prepare(productSelect + " ORDER BY id ASC").all().map((row: any) => ({
      name: row.name,
      slug: row.slug,
      category: row.category,
      description: row.description,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      images: row.images,
      sizes: row.sizes,
      color: row.color,
      fabric: row.fabric,
      sku: row.sku,
      stock: row.stock,
      featured: Boolean(row.featured),
      active: Boolean(row.active),
    })) as InsertProduct[];
  }

  async importProducts(
    items: InsertProduct[],
    options?: { replaceExisting?: boolean },
  ): Promise<{ imported: number; replacedAll: boolean }> {
    const replaceExisting = Boolean(options?.replaceExisting);
    const upsert = localDatabase().prepare(`
      INSERT INTO products (
        name, slug, category, description, price, compare_at_price,
        images, sizes, color, fabric, sku, stock, featured, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        description = excluded.description,
        price = excluded.price,
        compare_at_price = excluded.compare_at_price,
        images = excluded.images,
        sizes = excluded.sizes,
        color = excluded.color,
        fabric = excluded.fabric,
        sku = excluded.sku,
        stock = excluded.stock,
        featured = excluded.featured,
        active = excluded.active
    `);

    localDatabase().exec("BEGIN");
    try {
      if (replaceExisting) {
        localDatabase().prepare("DELETE FROM products").run();
      }

      for (const item of items) {
        upsert.run(
          item.name,
          item.slug,
          item.category,
          item.description,
          item.price,
          item.compareAtPrice ?? null,
          item.images,
          item.sizes,
          item.color,
          item.fabric,
          item.sku,
          item.stock,
          Number(item.featured),
          Number(item.active),
        );
      }
      localDatabase().exec("COMMIT");
      return { imported: items.length, replacedAll: replaceExisting };
    } catch (error) {
      localDatabase().exec("ROLLBACK");
      throw error;
    }
  }

  async getProduct(id: number) {
    return productRow(localDatabase().prepare(`${productSelect} WHERE id = ?`).get(id));
  }

  async getProductBySlug(slug: string) {
    return productRow(localDatabase().prepare(`${productSelect} WHERE slug = ?`).get(slug));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const values = Object.keys(productColumns).map((key) => {
      const value = product[key as keyof InsertProduct];
      return typeof value === "boolean" ? Number(value) : value ?? null;
    });
    const columns = Object.values(productColumns);
    const result = localDatabase()
      .prepare(`INSERT INTO products (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
      .run(...values);
    return (await this.getProduct(Number(result.lastInsertRowid)))!;
  }

  async updateProduct(id: number, changes: Partial<InsertProduct>) {
    const entries = Object.entries(changes).filter(([key]) => key in productColumns);
    if (!entries.length) return this.getProduct(id);
    const setters = entries.map(([key]) => `${productColumns[key as keyof InsertProduct]} = ?`);
    const values = entries.map(([, value]) =>
      typeof value === "boolean" ? Number(value) : value ?? null,
    );
    localDatabase().prepare(`UPDATE products SET ${setters.join(", ")} WHERE id = ?`).run(...values, id);
    return this.getProduct(id);
  }

  async deleteProduct(id: number) {
    return localDatabase().prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
  }

  async decrementStock(id: number, quantity: number) {
    localDatabase()
      .prepare("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?")
      .run(quantity, id);
  }

  async listOrders(): Promise<Order[]> {
    return localDatabase()
      .prepare(`${orderSelect} ORDER BY id DESC`)
      .all()
      .map((row: any) => orderRow(row)!);
  }

  async getOrder(id: number) {
    return orderRow(localDatabase().prepare(`${orderSelect} WHERE id = ?`).get(id));
  }

  async getOrderByStripeSessionId(sessionId: string) {
    return orderRow(
      localDatabase().prepare(`${orderSelect} WHERE stripe_session_id = ?`).get(sessionId),
    );
  }

  async createOrder(
    order: InsertOrder & {
      orderNumber: string;
      stripeSessionId?: string;
      createdAt: string;
    },
  ): Promise<Order> {
    const result = localDatabase()
      .prepare(`
        INSERT INTO orders (
          order_number, customer_name, email, phone, address_line1, address_line2,
          city, state, zip, country, items, subtotal, shipping, total,
          stripe_session_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        order.orderNumber,
        order.customerName,
        order.email,
        order.phone,
        order.addressLine1,
        order.addressLine2,
        order.city,
        order.state,
        order.zip,
        order.country,
        order.items,
        order.subtotal,
        order.shipping,
        order.total,
        order.stripeSessionId ?? null,
        order.createdAt,
      );
    return (await this.getOrder(Number(result.lastInsertRowid)))!;
  }

  async updateOrderStatus(id: number, status: string) {
    localDatabase().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    return this.getOrder(id);
  }

  async deleteOrder(id: number) {
    return localDatabase().prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0;
  }

  async setOrderStripeSession(id: number, sessionId: string) {
    localDatabase()
      .prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?")
      .run(sessionId, id);
  }
}

export const storage = process.env.DATABASE_URL || process.env.POSTGRES_URL
  ? new NeonStorage()
  : new DatabaseStorage();
