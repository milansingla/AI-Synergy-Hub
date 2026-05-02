import { openai } from "@workspace/integrations-openai-ai-server";

export interface ParsedJD {
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  responsibilities: string[];
}

export interface QuestionSet {
  technical: string[];
  behavioral: string[];
  situational: string[];
  all: string[];
}

export interface FullEvaluation {
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  questionEvals: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    idealAnswer: string;
  }>;
}

/* ─── Parse JD ─────────────────────────────────────────────────────────────── */

export async function parseJD(jdText: string): Promise<ParsedJD> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are an expert job description parser. Extract structured data from the job description and return valid JSON only — no markdown, no code blocks.`,
      },
      {
        role: "user",
        content: `Parse this job description and return a JSON object with these exact fields:
- "role": the exact job title/position (string)
- "company": the company name if mentioned, otherwise "" (string)
- "skills": array of specific technical and soft skills required — include exact technologies, frameworks, tools mentioned (array of strings, max 12)
- "experienceLevel": one of "junior", "mid-level", "senior", "lead" based on requirements
- "responsibilities": array of the 5 most important responsibilities/duties mentioned (array of strings)

Job Description:
${jdText}

Return only valid JSON, no markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as ParsedJD;
  } catch {
    return { role: "Software Engineer", company: "", skills: [], experienceLevel: "mid-level", responsibilities: [] };
  }
}

/* ─── Generate question set ─────────────────────────────────────────────── */

export async function generateQuestions(jd: {
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  responsibilities: string[];
  rawText: string;
}): Promise<QuestionSet> {
  const companyLine = jd.company ? `Company: ${jd.company}` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You are a senior technical interviewer. Generate highly specific, targeted interview questions that are deeply tied to the exact job description provided. Questions must reference specific technologies, responsibilities, and context from the JD — not generic interview questions. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Generate interview questions for this specific role.

Role: ${jd.role}
${companyLine}
Experience Level: ${jd.experienceLevel}
Required Skills: ${jd.skills.join(", ")}
Key Responsibilities:
${jd.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Full Job Description (use this for context and specificity):
---
${jd.rawText}
---

Generate questions that are SPECIFIC to this exact role and company. Reference the actual tools, technologies, team structure, and responsibilities mentioned in the JD. Do NOT ask generic questions.

Return a JSON object with exactly these fields:
- "technical": array of 5 technical questions — each must reference a specific technology, tool, or scenario from this JD
- "behavioral": array of 3 behavioral questions (STAR format) — framed around the specific responsibilities and team context of this role
- "situational": array of 2 situational questions — based on real challenges someone in THIS role at THIS company would face

Return only valid JSON, no markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const questions = JSON.parse(content) as { technical: string[]; behavioral: string[]; situational: string[] };
    return {
      ...questions,
      all: [...(questions.technical ?? []), ...(questions.behavioral ?? []), ...(questions.situational ?? [])],
    };
  } catch {
    return { technical: [], behavioral: [], situational: [], all: [] };
  }
}

/* ─── Get next question ─────────────────────────────────────────────────── */

export async function getNextQuestion(
  jd: {
    role: string;
    company: string;
    skills: string[];
    experienceLevel: string;
    responsibilities: string[];
    rawText: string;
  },
  conversationHistory: Array<{ role: "ai" | "user"; content: string }>,
  questionPool: string[],
  answeredCount: number
): Promise<{ content: string; isComplete: boolean }> {
  if (answeredCount >= questionPool.length) {
    return {
      content: "Thank you for completing the interview. I have gathered enough information to evaluate your performance. The interview is now complete.",
      isComplete: true,
    };
  }

  const companyCtx = jd.company
    ? `You are interviewing a candidate for the ${jd.role} role at ${jd.company}.`
    : `You are interviewing a candidate for the ${jd.role} role.`;

  const systemPrompt = `You are a professional hiring manager conducting a structured interview. ${companyCtx}

Job context:
- Role: ${jd.role}${jd.company ? `\n- Company: ${jd.company}` : ""}
- Experience level sought: ${jd.experienceLevel}
- Key skills being assessed: ${jd.skills.join(", ")}
- Core responsibilities:
${jd.responsibilities.map((r) => `  • ${r}`).join("\n")}

Relevant job description excerpt:
---
${jd.rawText.slice(0, 1200)}
---

Interview guidelines:
- Ask exactly ONE question at a time from the question pool
- Keep questions grounded in the actual role and company context above
- Acknowledge the candidate's previous answer briefly and naturally before moving on
- Do NOT give hints or correct the candidate
- Reference specific technologies, responsibilities, or scenarios from the JD when relevant
- You have ${questionPool.length - answeredCount} questions remaining (currently on question ${answeredCount + 1} of ${questionPool.length})
- Keep responses concise and professional

Question pool — ask in order:
${questionPool.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

  const messages = conversationHistory.map((msg) => ({
    role: msg.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 512,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
      ...(conversationHistory.length === 0
        ? [{ role: "user" as const, content: "Please start the interview." }]
        : []),
    ],
  });

  return {
    content: response.choices[0]?.message?.content ?? "Let us proceed with the next question.",
    isComplete: false,
  };
}

/* ─── Evaluate interview ────────────────────────────────────────────────── */

export async function evaluateInterview(
  jd: {
    role: string;
    company: string;
    skills: string[];
    responsibilities: string[];
    rawText: string;
  },
  conversationHistory: Array<{ role: "ai" | "user"; content: string }>
): Promise<FullEvaluation> {
  const qaText = conversationHistory
    .reduce((acc: Array<{ q: string; a: string }>, msg, i) => {
      if (msg.role === "ai" && conversationHistory[i + 1]?.role === "user") {
        acc.push({ q: msg.content, a: conversationHistory[i + 1].content });
      }
      return acc;
    }, [])
    .map((qa, i) => `Q${i + 1}: ${qa.q}\nA${i + 1}: ${qa.a}`)
    .join("\n\n");

  const companyLine = jd.company ? ` at ${jd.company}` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a senior hiring manager evaluating a candidate for a specific role. Evaluate their answers in the context of the exact job description provided — assess whether they demonstrated knowledge of the specific technologies, tools, and responsibilities required. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Evaluate this interview for the ${jd.role} role${companyLine}.

Job context:
- Required skills: ${jd.skills.join(", ")}
- Core responsibilities:
${jd.responsibilities.map((r) => `  • ${r}`).join("\n")}

Full Job Description:
---
${jd.rawText.slice(0, 1500)}
---

Interview transcript:
${qaText}

Score each answer against what this specific role actually requires. Consider:
1. Did they demonstrate knowledge of the specific tools/technologies in the JD?
2. Did their answers reflect an understanding of the actual responsibilities?
3. Would their experience translate to success in this specific role${jd.company ? ` at ${jd.company}` : ""}?

Return a JSON object with:
- "overallScore": number from 1-100 (integer)
- "feedback": overall summary paragraph referencing the specific role requirements
- "strengths": array of 3 specific strengths relevant to this role
- "improvements": array of 3 specific improvement areas for this role
- "questionEvals": array of objects, one per Q&A pair, each with:
  - "question": the question asked
  - "answer": the candidate's answer
  - "score": number 1-100
  - "feedback": specific feedback tied to the role requirements
  - "idealAnswer": what an ideal answer would have included for this specific role

Return only valid JSON, no markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as FullEvaluation;
  } catch {
    return {
      overallScore: 5,
      feedback: "Unable to generate evaluation.",
      strengths: [],
      improvements: [],
      questionEvals: [],
    };
  }
}
