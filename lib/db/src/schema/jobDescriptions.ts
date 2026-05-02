import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const jobDescriptionsTable = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  rawText: text("raw_text").notNull(),
  role: text("role").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  experienceLevel: text("experience_level").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobDescriptionSchema = createInsertSchema(jobDescriptionsTable).omit({ id: true, createdAt: true });
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptionsTable.$inferSelect;
