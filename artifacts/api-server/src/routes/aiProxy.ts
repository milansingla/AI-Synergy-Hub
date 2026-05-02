import { Router } from "express";
import {
  parseJD,
  generateQuestions,
  getNextQuestion,
  evaluateInterview,
} from "../lib/aiPrompts";

const router = Router();

router.post("/ai/call", async (req: any, res: any) => {
  const { type, payload } = req.body ?? {};

  try {
    switch (type) {
      case "parseJD": {
        const result = await parseJD(payload.jdText);
        return res.json(result);
      }
      case "generateQuestions": {
        const result = await generateQuestions(payload.jd);
        return res.json(result);
      }
      case "getNextQuestion": {
        const result = await getNextQuestion(
          payload.jd,
          payload.questionSet,
          payload.conversationHistory,
          payload.answeredCount
        );
        return res.json(result);
      }
      case "evaluateInterview": {
        const result = await evaluateInterview(
          payload.jd,
          payload.conversationHistory
        );
        return res.json(result);
      }
      default:
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }
  } catch (err: any) {
    req.log?.error(err);
    return res.status(500).json({ error: err?.message ?? "AI call failed" });
  }
});

export default router;
