import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./users";

export const accessCodesTable = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: userRoleEnum("role").notNull().default("student"),
  active: boolean("active").notNull().default(true),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AccessCode = typeof accessCodesTable.$inferSelect;
