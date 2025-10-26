import { integer, pgTable, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';

// Collections table
export const collections = pgTable('collections', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp().defaultNow()
});

// Collection symbols junction table
export const collectionSymbols = pgTable('collection_symbols', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    collection_id: integer().notNull().references(() => collections.id, { onDelete: 'cascade' }),
    symbol_char: varchar({ length: 10 }).notNull(),
    added_at: timestamp().defaultNow()
}, (table) => ({
    unique_collection_symbol: unique().on(table.collection_id, table.symbol_char)
}));

// Symbol tags table
export const symbolTags = pgTable('symbol_tags', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    symbol_char: varchar({ length: 10 }).notNull(),
    tag: varchar({ length: 100 }).notNull(),
    created_at: timestamp().defaultNow()
}, (table) => ({
    unique_symbol_tag: unique().on(table.symbol_char, table.tag)
}));

// Text snippets table
export const textSnippets = pgTable('text_snippets', {
    id: varchar({ length: 50 }).primaryKey(),
    text: text().notNull(),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp().defaultNow()
});