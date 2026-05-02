import { openai } from "@workspace/integrations-openai-ai-server";

export interface ParsedJD {
  role: string;
  skills: string[];
  experienceLevel: string;
}

export interface QuestionSet {
  technical: string[];
  behavioral: string[];
  situational: string[];
  all: string[];
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  idealAnswer: string;
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

export async function parseJD(jdText: string): Promise<ParsedJD> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are an expert job description parser. Extract the key information from the job description and return it as valid JSON only, with no markdown formatting or code blocks.`,
      },
      {
        role: "user",
        content: `Parse this job description and return a JSON object with these exact fields:
- "role": the job title/role (string)
- "skills": array of key technical and soft skills required (array of strings, max 10)
- "experienceLevel": one of "junior", "mid-level", "senior", "lead" based on the requirements

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
    return { role: "Software Engineer", skills: [], experienceLevel: "mid-level" };
  }
}

export async function generateQuestions(parsedJD: ParsedJD): Promise<QuestionSet> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You are an expert technical interviewer. Generate targeted interview questions based on the job description. Return valid JSON only with no markdown formatting.`,
      },
      {
        role: "user",
        content: `Generate interview questions for this role:
Role: ${parsedJD.role}
Skills: ${parsedJD.skills.join(", ")}
Experience Level: ${parsedJD.experienceLevel}

Return a JSON object with exactly these fields:
- "technical": array of 5 technical questions
- "behavioral": array of 3 behavioral questions (using STAR format)
- "situational": array of 2 situational/scenario-based questions

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

export async function getNextQuestion(
  role: string,
  skills: string[],
  conversationHistory: Array<{ role: "ai" | "user"; content: string }>,
  questionPool: string[],
  answeredCount: number
): Promise<{ content: string; isComplete: boolean }> {
  const totalQuestions = questionPool.length;
  if (answeredCount >= totalQuestions) {
    return {
      content: "Thank you for completing the interview. I have gathered enough information to evaluate your performance. The interview is now complete.",
      isComplete: true,
    };
  }

  const systemPrompt = `You are Synorlab Interviewer, a professional hiring manager conducting a structured interview for the role of ${role}. 

Key skills being assessed: ${skills.join(", ")}

Interview guidelines:
- Ask exactly ONE question at a time
- Do NOT give away answers or hints
- Acknowledge the candidate's answer briefly before asking the next question
- Adapt your tone based on their responses
- You have ${totalQuestions - answeredCount} questions remaining
- Ask the next question from the provided question pool
- Keep your response concise and professional

Question pool (ask them in order):
${questionPool.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Currently on question ${answeredCount + 1} of ${totalQuestions}.`;

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
        ? [
            {
              role: "user" as const,
              content: "Please start the interview.",
            },
          ]
        : []),
    ],
  });

  return {
    content: response.choices[0]?.message?.content ?? "Let us proceed with the next question.",
    isComplete: false,
  };
}

export async function evaluateInterview(
  role: string,
  skills: string[],
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a senior hiring manager evaluating a candidate interview. Provide detailed, constructive feedback. Return valid JSON only with no markdown formatting.`,
      },
      {
        role: "user",
        content: `Evaluate this interview for the role of ${role} (skills: ${skills.join(", ")}):

${qaText}

Return a JSON object with:
- "overallScore": number from 1-10 (float allowed)
- "feedback": overall summary paragraph
- "strengths": array of 3 strengths
- "improvements": array of 3 areas for improvement
- "questionEvals": array of objects, one per Q&A pair, each with:
  - "question": the question asked
  - "answer": the candidate's answer
  - "score": number 1-10
  - "feedback": specific feedback for this answer
  - "idealAnswer": what an ideal answer would have included

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
