import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./users";

export const invitesTable = pgTable("invites", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Invite = typeof invitesTable.$inferSelect;
