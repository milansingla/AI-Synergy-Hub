import { pgTable, serial, timestamp, integer, real, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { interviewsTable } from "./interviews";

export interface QuestionEval {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  idealAnswer: string;
}

export const evaluationsTable = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id")
    .notNull()
    .unique()
    .references(() => interviewsTable.id, { onDelete: "cascade" }),
  overallScore: real("overall_score").notNull(),
  feedback: text("feedback").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
  questionEvals: jsonb("question_evals").$type<QuestionEval[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEvaluationSchema = createInsertSchema(evaluationsTable).omit({ id: true, createdAt: true });
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluationsTable.$inferSelect;
