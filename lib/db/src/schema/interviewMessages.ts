import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { interviewsTable } from "./interviews";

export const messageRoleEnum = pgEnum("message_role", ["ai", "user"]);

export const interviewMessagesTable = pgTable("interview_messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interviewsTable.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInterviewMessageSchema = createInsertSchema(interviewMessagesTable).omit({ id: true, createdAt: true });
export type InsertInterviewMessage = z.infer<typeof insertInterviewMessageSchema>;
export type InterviewMessage = typeof interviewMessagesTable.$inferSelect;
