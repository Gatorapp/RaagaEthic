import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CATEGORIES = [
  "Lehenga Choli",
  "Blouse",
  "Dupatta",
  "Kurtas",
  "Accessories",
] as const;

export const ORDER_STATUSES = ["pending", "paid", "fulfilled", "cancelled"] as const;

export const SHIP_COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
] as const;
export const SHIP_COUNTRY_CODES = SHIP_COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // cents
  compareAtPrice: integer("compare_at_price"), // cents, nullable
  images: text("images").notNull(), // JSON string array of image URLs
  sizes: text("sizes").notNull(), // JSON string array
  color: text("color").notNull(),
  fabric: text("fabric").notNull(),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const orderItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  image: z.string(),
  price: z.number(),
  size: z.string(),
  qty: z.number().min(1),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  country: text("country").notNull().default("US"),
  items: text("items").notNull(), // JSON string array of OrderItem
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: text("created_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  status: true,
  stripeSessionId: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const checkoutRequestSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.enum(SHIP_COUNTRY_CODES, {
    errorMap: () => ({ message: "We currently only ship to the United States and Canada" }),
  }),
  items: z.array(orderItemSchema).min(1),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
