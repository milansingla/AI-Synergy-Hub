import { openai } from "@workspace/integrations-openai-ai-server";

/* ─── Interfaces ────────────────────────────────────────────────────────────── */

export interface ParsedJD {
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  responsibilities: string[];
}

export interface QuestionSet {
  opener: string;
  technical: string[];
  behavioral: string[];
  situational: string[];
  closer: string;
  all: string[];
}

export interface CriteriaScore {
  dimension: string;
  score: number;
  weight: number;
  feedback: string;
}

export interface FullEvaluation {
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  criteriaScores: CriteriaScore[];
  questionEvals: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    idealAnswer: string;
  }>;
}

/* ─── JD Context helper type ─────────────────────────────────────────────── */

export interface JDContext {
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  responsibilities: string[];
  rawText: string;
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

/* ─── Generate structured question set ─────────────────────────────────────── */

export async function generateQuestions(jd: JDContext): Promise<QuestionSet> {
  const companyCtx = jd.company || "this company";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 3000,
    messages: [
      {
        role: "system",
        content: `You are a senior HR interviewer designing a structured, realistic interview. Every question must be directly grounded in the exact job description provided — referencing the specific company, role, responsibilities, and technologies listed. Do not ask generic questions. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Design a structured interview question set for this specific role.

Role: ${jd.role}
Company: ${companyCtx}
Experience level: ${jd.experienceLevel}
Required skills: ${jd.skills.join(", ")}
Key responsibilities:
${jd.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Full Job Description (for deep context):
---
${jd.rawText}
---

Generate the following, ALL grounded strictly in this JD:

1. "opener" (string): A warm, professional welcome that names the company and role, then asks the candidate to introduce themselves and explain what specifically attracted them to THIS role at THIS company.

2. "technical" (array of 4 strings): Deep-dive questions on the specific technologies, tools, and responsibilities in the JD. Each question must reference something explicitly mentioned in the JD — not generic tech questions.

3. "behavioral" (array of 3 strings): STAR-format behavioral questions directly tied to the key responsibilities in the JD. Start each with "Tell me about a time when..." or "Describe a situation where..." and anchor it to a specific responsibility from the JD.

4. "situational" (array of 2 strings): Scenario-based questions that present a realistic challenge someone in THIS specific role at THIS company would face, based on the JD context.

5. "closer" (string): A professional closing question — ask if the candidate has any questions about the role, the team, or ${companyCtx}'s culture or expectations.

RULES:
- Every question must be 100% specific to this JD — if you removed the company/role name, the question should still only make sense for this exact role.
- Do NOT ask generic interview questions like "What is your biggest weakness?" or "Where do you see yourself in 5 years?"
- Technical questions must name specific tools/technologies from the JD.
- Behavioral questions must reference specific responsibilities from the JD.

Return only valid JSON with keys: opener, technical, behavioral, situational, closer. No markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const q = JSON.parse(content) as {
      opener: string;
      technical: string[];
      behavioral: string[];
      situational: string[];
      closer: string;
    };
    const all = [
      q.opener,
      ...(q.technical ?? []),
      ...(q.behavioral ?? []),
      ...(q.situational ?? []),
      q.closer,
    ].filter(Boolean);
    return { ...q, all };
  } catch {
    return { opener: "", technical: [], behavioral: [], situational: [], closer: "", all: [] };
  }
}

/* ─── Interview phase labels ─────────────────────────────────────────────── */

function getPhaseLabel(idx: number, questionSet: QuestionSet): string {
  if (idx === 0) return "Opening";
  const techEnd = 1 + questionSet.technical.length;
  if (idx < techEnd) return "Technical Assessment";
  const behEnd = techEnd + questionSet.behavioral.length;
  if (idx < behEnd) return "Behavioral Assessment";
  const sitEnd = behEnd + questionSet.situational.length;
  if (idx < sitEnd) return "Situational Assessment";
  return "Closing";
}

/* ─── Get next question ──────────────────────────────────────────────────── */

export async function getNextQuestion(
  jd: JDContext,
  questionSet: QuestionSet,
  conversationHistory: Array<{ role: "ai" | "user"; content: string }>,
  answeredCount: number
): Promise<{ content: string; isComplete: boolean; phase: string }> {
  const { all: questionPool } = questionSet;

  if (answeredCount >= questionPool.length) {
    return {
      content:
        "Thank you so much for your time today. It's been a pleasure speaking with you, and I've gained a great understanding of your background. We'll be in touch soon regarding next steps. The interview is now complete — best of luck!",
      isComplete: true,
      phase: "Complete",
    };
  }

  const currentPhase = getPhaseLabel(answeredCount, questionSet);
  const companyCtx = jd.company
    ? `at ${jd.company}`
    : "";
  const companyName = jd.company || "our company";

  const systemPrompt = `You are Priya Sharma, a professional Senior HR Manager conducting a structured interview for the ${jd.role} role ${companyCtx}.

Job context:
- Role: ${jd.role}
- Company: ${companyName}
- Experience level sought: ${jd.experienceLevel}
- Key skills: ${jd.skills.join(", ")}
- Core responsibilities:
${jd.responsibilities.map((r) => `  • ${r}`).join("\n")}

Current interview phase: ${currentPhase}
Progress: Question ${answeredCount + 1} of ${questionPool.length}

Job description (for context):
---
${jd.rawText.slice(0, 1200)}
---

INTERVIEW CONDUCT RULES:
1. Ask EXACTLY ONE question per turn — the next question from the pool below, in order.
2. If the candidate just answered, acknowledge their response briefly (1 sentence, genuine but concise) before asking the next question. Do NOT give long commentary.
3. Do NOT hint at the correct answer, reveal scoring criteria, or give away what a good answer looks like.
4. Keep your language warm, professional, and conversational — as a real HR manager from a top company would conduct themselves.
5. If this is the very first question (no prior conversation), introduce yourself: "Hello! I'm Priya Sharma, Senior HR Manager. Welcome to your interview for the ${jd.role} position${companyCtx}." Then ask the opener.
6. Stay strictly focused on THIS role and THIS job description — do not drift into generic small talk.
7. During the Behavioral phase, remind the candidate to use the STAR method (Situation, Task, Action, Result) if they haven't structured their answer that way.
8. Keep each response under 100 words unless the opener.

Ordered question pool — ask them strictly in this sequence:
${questionPool.map((q, i) => `Q${i + 1} [${getPhaseLabel(i, questionSet)}]: ${q}`).join("\n")}

Currently delivering: Q${answeredCount + 1}.`;

  const messages = conversationHistory.map((msg) => ({
    role: msg.role === "ai" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 600,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
      ...(conversationHistory.length === 0
        ? [{ role: "user" as const, content: "Please start the interview." }]
        : []),
    ],
  });

  return {
    content: response.choices[0]?.message?.content ?? "Let's proceed to the next question.",
    isComplete: false,
    phase: currentPhase,
  };
}

/* ─── Evaluate interview ─────────────────────────────────────────────────── */

const EVALUATION_DIMENSIONS: Array<{ dimension: string; weight: number; description: string }> = [
  {
    dimension: "Technical & Domain Knowledge",
    weight: 25,
    description: "Depth and accuracy of technical knowledge specific to the role's requirements — tools, frameworks, processes, and domain concepts explicitly mentioned in the JD.",
  },
  {
    dimension: "Communication & Articulation",
    weight: 20,
    description: "Clarity, structure, and professionalism of communication. Ability to explain complex ideas clearly, use appropriate terminology, and maintain a professional register throughout.",
  },
  {
    dimension: "Problem-Solving & Analytical Thinking",
    weight: 20,
    description: "Ability to break down complex problems, reason logically, draw on data or experience, and arrive at sound conclusions. Demonstrated through situational and technical answers.",
  },
  {
    dimension: "Behavioural Competencies",
    weight: 15,
    description: "Quality of behavioural examples using the STAR method. Evidence of ownership, initiative, collaboration, and results-orientation in past roles.",
  },
  {
    dimension: "Cultural Fit & Professional Attitude",
    weight: 10,
    description: "Enthusiasm for the role and company, growth mindset, professionalism, and alignment with values. Assessed through tone, motivation, and the quality of questions asked.",
  },
  {
    dimension: "Role & Company Alignment",
    weight: 10,
    description: "How well the candidate's stated goals, experience, and motivation align with the specific responsibilities and expectations of this role at this company.",
  },
];

export async function evaluateInterview(
  jd: JDContext,
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
  const dimensionsText = EVALUATION_DIMENSIONS.map(
    (d, i) => `${i + 1}. "${d.dimension}" (weight: ${d.weight}%): ${d.description}`
  ).join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a senior hiring manager at a top-tier company evaluating a candidate interview. Apply rigorous, objective evaluation criteria aligned with both global top-company HR standards (FAANG-level competency frameworks) and Indian corporate HR standards. Be fair but precise — do not inflate scores. Return valid JSON only, no markdown.`,
      },
      {
        role: "user",
        content: `Evaluate this complete interview for the ${jd.role} role${companyLine}.

JOB CONTEXT:
- Required skills: ${jd.skills.join(", ")}
- Experience level: ${jd.experienceLevel}
- Core responsibilities:
${jd.responsibilities.map((r) => `  • ${r}`).join("\n")}

Full Job Description:
---
${jd.rawText.slice(0, 1500)}
---

INTERVIEW TRANSCRIPT:
${qaText}

EVALUATION FRAMEWORK — score each of these 6 dimensions 0-100:
${dimensionsText}

SCORING GUIDANCE (apply strictly):
- 90-100: Exceptional — exceeds all expectations, would be a top hire
- 75-89:  Strong — meets all key requirements with evidence
- 60-74:  Adequate — meets most requirements, some gaps
- 40-59:  Developing — significant gaps relative to role requirements
- 0-39:   Insufficient — does not demonstrate required competencies

Compute overallScore as the weighted average across all 6 dimensions.

Return a JSON object with:
- "overallScore": weighted average score (0-100, integer)
- "feedback": 3-4 sentence hiring summary paragraph — specific to this role and company, referencing actual answers given
- "strengths": array of exactly 3 specific strengths, each starting with the dimension name, e.g. "Technical Knowledge: Demonstrated strong proficiency in..."
- "improvements": array of exactly 3 specific, actionable improvement areas tied to JD requirements
- "criteriaScores": array of 6 objects, each with: { "dimension": string, "score": integer 0-100, "weight": number, "feedback": string (1-2 sentences specific to their answers) }
- "questionEvals": array of objects, one per Q&A pair, each with: { "question": string, "answer": string, "score": integer 0-100, "feedback": string (specific to JD requirements), "idealAnswer": string (what a strong candidate would have said for THIS role) }

Return only valid JSON, no markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as FullEvaluation;
  } catch {
    return {
      overallScore: 50,
      feedback: "Unable to generate evaluation.",
      strengths: [],
      improvements: [],
      criteriaScores: [],
      questionEvals: [],
    };
  }
}
