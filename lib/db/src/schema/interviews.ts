import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobDescriptionsTable } from "./jobDescriptions";

export const interviewStatusEnum = pgEnum("interview_status", ["in_progress", "completed"]);

export const interviewsTable = pgTable("interviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  jdId: integer("jd_id")
    .notNull()
    .references(() => jobDescriptionsTable.id, { onDelete: "cascade" }),
  status: interviewStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviewsTable).omit({ id: true, createdAt: true });
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviewsTable.$inferSelect;
