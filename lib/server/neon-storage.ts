import { neon } from "@neondatabase/serverless";
import inventory from "../../inventory-export.json";
import type { InsertOrder, InsertProduct, Order, Product } from "@shared/schema";

let sqlInstance: ReturnType<typeof neon> | null = null;

function database() {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("Neon is not connected. Add DATABASE_URL in Vercel or .env.local.");
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

async function queryRows(text: string, params: unknown[] = []) {
  return database().query(text, params) as unknown as Promise<Record<string, any>[]>;
}

const productSelect = `
  SELECT id, name, slug, category, description, price,
    compare_at_price AS "compareAtPrice", images, sizes, color, fabric, sku, stock,
    featured, active
  FROM products
`;

const orderSelect = `
  SELECT id, order_number AS "orderNumber", customer_name AS "customerName", email,
    phone, address_line1 AS "addressLine1", address_line2 AS "addressLine2", city,
    state, zip, country, items, subtotal, shipping, total, status,
    stripe_session_id AS "stripeSessionId", created_at AS "createdAt"
  FROM orders
`;

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

function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as unknown as Product),
    id: Number(row.id),
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice === null ? null : Number(row.compareAtPrice),
    stock: Number(row.stock),
    featured: Boolean(row.featured),
    active: Boolean(row.active),
  };
}

function normalizeOrder(row: Record<string, unknown>): Order {
  return {
    ...(row as unknown as Order),
    id: Number(row.id),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
  };
}

export class NeonStorage {
  private ready: Promise<void> | null = null;

  private ensureReady() {
    if (!this.ready) {
      this.ready = this.initialize();
    }
    return this.ready;
  }

  private async initialize() {
    await queryRows(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY,
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
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    await queryRows(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
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
      )
    `);

    const countRows = await queryRows("SELECT COUNT(*)::int AS count FROM products");
    if (Number(countRows[0]?.count || 0) === 0) {
      for (const product of inventory.products as InsertProduct[]) {
        await this.upsertProduct(product);
      }
    }
  }

  private async upsertProduct(product: InsertProduct) {
    await queryRows(
      `
        INSERT INTO products (
          name, slug, category, description, price, compare_at_price,
          images, sizes, color, fabric, sku, stock, featured, active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          compare_at_price = EXCLUDED.compare_at_price,
          images = EXCLUDED.images,
          sizes = EXCLUDED.sizes,
          color = EXCLUDED.color,
          fabric = EXCLUDED.fabric,
          sku = EXCLUDED.sku,
          stock = EXCLUDED.stock,
          featured = EXCLUDED.featured,
          active = EXCLUDED.active
      `,
      [
        product.name,
        product.slug,
        product.category,
        product.description,
        product.price,
        product.compareAtPrice ?? null,
        product.images,
        product.sizes,
        product.color,
        product.fabric,
        product.sku,
        product.stock,
        product.featured,
        product.active,
      ],
    );
  }

  async listProducts(options?: { category?: string; activeOnly?: boolean }): Promise<Product[]> {
    await this.ensureReady();
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (options?.activeOnly) clauses.push("active = TRUE");
    if (options?.category) {
      values.push(options.category);
      clauses.push(`category = $${values.length}`);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const rows = await queryRows(`${productSelect}${where} ORDER BY id DESC`, values);
    return rows.map(normalizeProduct);
  }

  async exportProducts(): Promise<InsertProduct[]> {
    const products = await this.listProducts();
    return products
      .sort((a, b) => a.id - b.id)
      .map(({ id: _id, ...product }) => product);
  }

  async importProducts(items: InsertProduct[], options?: { replaceExisting?: boolean }) {
    await this.ensureReady();
    if (options?.replaceExisting) {
      await queryRows("DELETE FROM products");
    }
    for (const item of items) {
      await this.upsertProduct(item);
    }
    return { imported: items.length, replacedAll: Boolean(options?.replaceExisting) };
  }

  async getProduct(id: number) {
    await this.ensureReady();
    const rows = await queryRows(`${productSelect} WHERE id = $1`, [id]);
    return rows[0] ? normalizeProduct(rows[0]) : undefined;
  }

  async getProductBySlug(slug: string) {
    await this.ensureReady();
    const rows = await queryRows(`${productSelect} WHERE slug = $1`, [slug]);
    return rows[0] ? normalizeProduct(rows[0]) : undefined;
  }

  async createProduct(product: InsertProduct) {
    await this.ensureReady();
    const rows = await queryRows(
      `
        INSERT INTO products (
          name, slug, category, description, price, compare_at_price,
          images, sizes, color, fabric, sku, stock, featured, active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id
      `,
      [
        product.name,
        product.slug,
        product.category,
        product.description,
        product.price,
        product.compareAtPrice ?? null,
        product.images,
        product.sizes,
        product.color,
        product.fabric,
        product.sku,
        product.stock,
        product.featured,
        product.active,
      ],
    );
    return (await this.getProduct(Number(rows[0].id)))!;
  }

  async updateProduct(id: number, changes: Partial<InsertProduct>) {
    await this.ensureReady();
    const entries = Object.entries(changes).filter(([key]) => key in productColumns);
    if (!entries.length) return this.getProduct(id);
    const values = entries.map(([, value]) => value ?? null);
    const setters = entries.map(
      ([key], index) => `${productColumns[key as keyof InsertProduct]} = $${index + 1}`,
    );
    values.push(id);
    await queryRows(
      `UPDATE products SET ${setters.join(", ")} WHERE id = $${values.length}`,
      values,
    );
    return this.getProduct(id);
  }

  async deleteProduct(id: number) {
    await this.ensureReady();
    const rows = await queryRows("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
    return rows.length > 0;
  }

  async decrementStock(id: number, quantity: number) {
    await this.ensureReady();
    await queryRows("UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2", [
      quantity,
      id,
    ]);
  }

  async listOrders(): Promise<Order[]> {
    await this.ensureReady();
    const rows = await queryRows(`${orderSelect} ORDER BY id DESC`);
    return rows.map(normalizeOrder);
  }

  async getOrder(id: number) {
    await this.ensureReady();
    const rows = await queryRows(`${orderSelect} WHERE id = $1`, [id]);
    return rows[0] ? normalizeOrder(rows[0]) : undefined;
  }

  async getOrderByStripeSessionId(sessionId: string) {
    await this.ensureReady();
    const rows = await queryRows(`${orderSelect} WHERE stripe_session_id = $1`, [sessionId]);
    return rows[0] ? normalizeOrder(rows[0]) : undefined;
  }

  async createOrder(
    order: InsertOrder & {
      orderNumber: string;
      stripeSessionId?: string;
      createdAt: string;
    },
  ) {
    await this.ensureReady();
    const rows = await queryRows(
      `
        INSERT INTO orders (
          order_number, customer_name, email, phone, address_line1, address_line2,
          city, state, zip, country, items, subtotal, shipping, total,
          stripe_session_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING id
      `,
      [
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
      ],
    );
    return (await this.getOrder(Number(rows[0].id)))!;
  }

  async updateOrderStatus(id: number, status: string) {
    await this.ensureReady();
    await queryRows("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
    return this.getOrder(id);
  }

  async setOrderStripeSession(id: number, sessionId: string) {
    await this.ensureReady();
    await queryRows("UPDATE orders SET stripe_session_id = $1 WHERE id = $2", [sessionId, id]);
  }
}
