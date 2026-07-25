import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const priceTypeEnum = pgEnum("price_type", ["fixed", "on_request"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "published", "archived"]);
export const requestStatusEnum = pgEnum("request_status", [
  "novo",
  "contactado",
  "fechado",
  "perdido",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "page_view",
  "product_view",
  "add_to_cart",
  "cart_sent",
  "quote_submitted",
]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const settings = pgTable(
  "settings",
  {
    id: smallint().primaryKey(),
    whatsappNumber: text().notNull(),
    businessName: text().notNull(),
    heroTitle: text().notNull(),
    heroSubtitle: text().notNull(),
    instagramUrl: text(),
    aboutMd: text().notNull(),
    cnpj: text(),
    contactEmail: text(),
    createdAt,
    updatedAt,
  },
  (t) => [check("settings_singleton", sql`${t.id} = 1`)],
);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  createdAt,
});

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    position: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [index("categories_position_idx").on(t.position)],
);

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    shortDescription: text().notNull(),
    descriptionMd: text().notNull(),
    categoryId: uuid().references(() => categories.id, { onDelete: "restrict" }),
    priceType: priceTypeEnum().notNull().default("fixed"),
    priceCents: integer(),
    status: productStatusEnum().notNull().default("draft"),
    isFeatured: boolean().notNull().default(false),
    position: integer().notNull().default(0),
    allowsPersonalization: boolean().notNull().default(false),
    personalizationLabel: text(),
    personalizationHelp: text(),
    variantGroupLabel: text(),
    seoTitle: text(),
    seoDescription: text(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    check(
      "products_price_matches_type",
      sql`(${t.priceType} = 'on_request' AND ${t.priceCents} IS NULL)
       OR (${t.priceType} = 'fixed' AND ${t.priceCents} IS NOT NULL)`,
    ),
    check(
      "products_price_cents_non_negative",
      sql`${t.priceCents} IS NULL OR ${t.priceCents} >= 0`,
    ),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    r2Key: text().notNull(),
    alt: text().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    position: integer().notNull().default(0),
    createdAt,
  },
  (t) => [index("product_images_product_id_position_idx").on(t.productId, t.position)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text().notNull(),
    priceDeltaCents: integer().notNull().default(0),
    position: integer().notNull().default(0),
    createdAt,
  },
  (t) => [index("product_variants_product_id_position_idx").on(t.productId, t.position)],
);

export const carts = pgTable(
  "carts",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    customerName: text(),
    subtotalCents: integer().notNull().default(0),
    hasOnRequestItems: boolean().notNull().default(false),
    status: requestStatusEnum().notNull().default("novo"),
    internalNotes: text(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("carts_status_idx").on(t.status),
    index("carts_created_at_idx").on(t.createdAt),
    check("carts_subtotal_non_negative", sql`${t.subtotalCents} >= 0`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    productNameSnapshot: text().notNull(),
    variantNameSnapshot: text(),
    quantity: integer().notNull(),
    unitPriceCentsSnapshot: integer(),
    personalizationText: text(),
    createdAt,
  },
  (t) => [
    index("cart_items_cart_id_idx").on(t.cartId),
    check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
    check(
      "cart_items_unit_price_non_negative",
      sql`${t.unitPriceCentsSnapshot} IS NULL OR ${t.unitPriceCentsSnapshot} >= 0`,
    ),
  ],
);

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    name: text().notNull(),
    contact: text().notNull(),
    message: text().notNull(),
    status: requestStatusEnum().notNull().default("novo"),
    internalNotes: text(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("quote_requests_status_idx").on(t.status),
    index("quote_requests_created_at_idx").on(t.createdAt),
  ],
);

export const quoteFiles = pgTable(
  "quote_files",
  {
    id: uuid().primaryKey().defaultRandom(),
    quoteRequestId: uuid()
      .notNull()
      .references(() => quoteRequests.id, { onDelete: "cascade" }),
    r2Key: text().notNull(),
    filename: text().notNull(),
    mime: text().notNull(),
    sizeBytes: integer().notNull(),
    createdAt,
  },
  (t) => [
    index("quote_files_quote_request_id_idx").on(t.quoteRequestId),
    check("quote_files_size_positive", sql`${t.sizeBytes} > 0`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    type: eventTypeEnum().notNull(),
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    sessionId: text().notNull(),
    path: text().notNull(),
    referrer: text(),
    createdAt,
  },
  (t) => [
    index("events_created_at_idx").on(t.createdAt),
    index("events_product_id_idx").on(t.productId),
    index("events_type_created_at_idx").on(t.type, t.createdAt),
  ],
);

export const eventDaily = pgTable(
  "event_daily",
  {
    date: date().notNull(),
    type: eventTypeEnum().notNull(),
    productId: uuid().references(() => products.id, { onDelete: "cascade" }),
    count: integer().notNull().default(0),
  },
  (t) => [
    unique("event_daily_pk").on(t.date, t.type, t.productId).nullsNotDistinct(),
    check("event_daily_count_non_negative", sql`${t.count} >= 0`),
  ],
);

/**
 * Contador de rate limit por chave (`presign:{ip}`, `orcamento:{ip}`).
 *
 * Não está na secção 5 do CLAUDE.md — ver BLOCKERS.md. A Fase 5 exige rate
 * limit por IP e, em serverless, um contador em memória não sobrevive entre
 * invocações nem é partilhado entre instâncias.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  count: integer().notNull().default(0),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ many }) => ({
  files: many(quoteFiles),
}));

export const quoteFilesRelations = relations(quoteFiles, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteFiles.quoteRequestId],
    references: [quoteRequests.id],
  }),
}));

export type Settings = typeof settings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type QuoteFile = typeof quoteFiles.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventDaily = typeof eventDaily.$inferSelect;
