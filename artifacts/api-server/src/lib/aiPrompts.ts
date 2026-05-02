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
  hiringVerdict: "Strong Hire" | "Hire" | "Hold" | "Weak" | "No Hire";
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

const EVALUATION_DIMENSIONS: Array<{ dimension: string; weight: number; description: string; bar: string }> = [
  {
    dimension: "Technical & Domain Knowledge",
    weight: 30,
    description: "Depth and accuracy of technical knowledge specific to the role — tools, frameworks, architectures, and domain concepts explicitly named in the JD. Generic answers that do not reference the JD's specific stack score low.",
    bar: "Candidate must name specific technologies from the JD and explain how and why they would use them. Superficial or textbook-level definitions are insufficient.",
  },
  {
    dimension: "Communication & Articulation",
    weight: 15,
    description: "Clarity, structure, and professionalism. Ability to explain complex ideas concisely, maintain a logical thread, and use precise terminology without jargon overload.",
    bar: "Rambling, unclear, or one-sentence answers score 40 or below. Strong answers are structured, specific, and professional.",
  },
  {
    dimension: "Problem-Solving & Analytical Thinking",
    weight: 20,
    description: "Ability to decompose real problems, reason through trade-offs, and propose data-driven solutions. Evaluated through situational and technical responses.",
    bar: "The candidate must walk through their reasoning step by step. Stating a conclusion without reasoning scores below 50.",
  },
  {
    dimension: "Behavioural Competencies & STAR Quality",
    weight: 20,
    description: "Quality of behavioural examples. Must follow STAR (Situation, Task, Action, Result) with quantifiable results. Evidence of ownership, initiative, and delivery.",
    bar: "No STAR structure: cap at 55. Vague stories with no concrete result: cap at 45. Strong answers quantify the impact (e.g. 'reduced latency by 40%').",
  },
  {
    dimension: "Cultural Fit & Professional Attitude",
    weight: 10,
    description: "Genuine enthusiasm for THIS specific role and company, growth mindset, professionalism throughout. Assessed through motivation quality and questions asked.",
    bar: "Generic answers ('I want to grow') score below 50. Strong answers reference company-specific context from the JD.",
  },
  {
    dimension: "Role & Company Alignment",
    weight: 5,
    description: "Degree to which the candidate's stated experience, goals, and motivation directly map to the specific responsibilities and expectations in this JD.",
    bar: "The candidate must connect their background to at least 2 specific responsibilities from the JD. Failure to do so scores below 55.",
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
    (d, i) =>
      `${i + 1}. "${d.dimension}" (weight: ${d.weight}%)\n   What it measures: ${d.description}\n   Minimum bar: ${d.bar}`
  ).join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a principal-level hiring evaluator at a highly selective technology company (think Google, Stripe, or a top Indian unicorn). Your evaluations are used to make binding hiring decisions. You have zero tolerance for score inflation — you will be held accountable if you give unjustifiably high scores. Your job is to evaluate the interview transcript with absolute precision and rigor.

CORE PRINCIPLE: Most candidates who complete an interview do NOT perform well enough to hire. A score of 65-75 already represents a reasonably strong candidate. Scores above 82 are reserved for genuinely impressive performances that stand out clearly. A 90+ interview is exceptional — perhaps 1 in 30 well-prepared candidates.

Return valid JSON only. No markdown, no code blocks.`,
      },
      {
        role: "user",
        content: `Evaluate this complete interview for the ${jd.role} role${companyLine}.

════════════════════════════════════════
JOB CONTEXT
════════════════════════════════════════
Required skills: ${jd.skills.join(", ")}
Experience level: ${jd.experienceLevel}
Core responsibilities:
${jd.responsibilities.map((r) => `  • ${r}`).join("\n")}

Full Job Description:
---
${jd.rawText.slice(0, 2000)}
---

════════════════════════════════════════
INTERVIEW TRANSCRIPT
════════════════════════════════════════
${qaText}

════════════════════════════════════════
EVALUATION DIMENSIONS (score each 0-100)
════════════════════════════════════════
${dimensionsText}

════════════════════════════════════════
MANDATORY SCORING PROTOCOL — READ CAREFULLY
════════════════════════════════════════

SCORE BANDS (non-negotiable):
• 90-100 — WORLD CLASS. Every single answer was specific, impressive, and demonstrated mastery well beyond what the role requires. Near-perfect STAR structure, deep technical precision, and strategic insight. Expect this band for roughly 1 in 30+ exceptional candidates.
• 80-89  — STRONG HIRE. Clear mastery of the JD's core requirements, concrete examples, correct technical depth, near-complete STAR answers. Top 10% of candidates.
• 68-79  — CONDITIONAL HIRE. Meets baseline requirements in most areas. 1-2 notable gaps or missed opportunities but solid overall. Middle tier of qualified candidates.
• 52-67  — BELOW BAR. Multiple vague, surface-level, or incomplete answers. Would need significant gaps filled before hire. Hold or re-interview.
• 35-51  — WEAK. Frequent gaps in core competencies, incorrect technical answers, or failure to provide credible examples.
• 0-34   — NO HIRE. Did not demonstrate the minimum competencies for this role.

CALIBRATION REFERENCE (use these anchors):
• A score of 70 = "Solid candidate who mostly answered correctly with specific examples, but had 1-2 vague or shallow answers."
• A score of 80 = "Consistently strong answers across all phases, specific technical knowledge, well-structured STAR answers with measurable results."
• A score of 90 = "Exceptional — virtually every answer was impressive, deep, and went beyond what was asked."
• Most candidates who prepared adequately should land in the 55-72 range.

MANDATORY DEDUCTIONS (apply these to individual question scores first):
1. Vague or generic answer with no specific examples or details: −25 to −35 pts on that question
2. Behavioral question answered without any STAR structure: −20 pts
3. Technically incorrect information: −30 to −45 pts
4. Answer is a single sentence or fewer than 2 meaningful sentences: −25 pts
5. Evasive, deflecting, or off-topic answer: cap the question at 30
6. Same real-world example reused across 2+ different questions: −10 pts per repeated use (after first use)
7. Asked for clarification on a straightforward question without attempting an answer: −10 pts

ANTI-INFLATION RULE: If your draft overallScore is above 75, challenge yourself — can you justify every point above 75 with specific evidence from the transcript? If not, reduce accordingly.

════════════════════════════════════════
REQUIRED OUTPUT FORMAT
════════════════════════════════════════
Return a single JSON object with these exact keys:

- "overallScore": true weighted average of the 6 dimension scores (integer 0-100)
- "hiringVerdict": one of exactly: "Strong Hire" | "Hire" | "Hold" | "No Hire"
  • "Strong Hire" only if overallScore ≥ 85
  • "Hire" if overallScore 70-84
  • "Hold" if overallScore 50-69
  • "No Hire" if overallScore < 50
- "feedback": 3-4 sentences. A precise hiring recommendation paragraph that references specific answers from the transcript. State clearly whether this candidate should advance and why.
- "strengths": array of exactly 3 items. Each must start with a dimension name and cite a specific answer. e.g. "Technical Knowledge: Correctly explained the trade-offs between X and Y when asked about..."
- "improvements": array of exactly 3 items. Each must be actionable and tied to a specific gap observed in the transcript.
- "criteriaScores": array of 6 objects:
  { "dimension": string, "score": integer 0-100, "weight": number, "feedback": string (2 sentences — cite a specific answer and explain the score) }
- "questionEvals": array of objects, one per Q&A pair:
  { "question": string, "answer": string, "score": integer 0-100, "feedback": string (cite what was said and what was missing), "idealAnswer": string (what a strong ${jd.experienceLevel} candidate should have said specifically for this role and JD) }

Return only valid JSON, no markdown, no code blocks.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as FullEvaluation;
  } catch {
    return {
      overallScore: 0,
      hiringVerdict: "No Hire" as const,
      feedback: "Unable to generate evaluation.",
      strengths: [],
      improvements: [],
      criteriaScores: [],
      questionEvals: [],
    };
  }
}
