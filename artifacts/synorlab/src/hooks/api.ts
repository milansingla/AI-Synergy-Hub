import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/react";
import { getSupabase } from "@/lib/supabase";
import {
  parseJD,
  generateQuestions,
  getNextQuestion,
  evaluateInterview,
  type JDContext,
  type QuestionSet,
} from "@/lib/ai";

/* ─── Mode detection ────────────────────────────────────────────────────── */

const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL;

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function restFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface UserProfile {
  id: string;
  email: string;
  role: "student" | "admin" | "facility";
  fullName: string | null;
  university: string | null;
  department: string | null;
  yearOfStudy: string | null;
  profileCompleted: boolean;
  createdAt: string;
}

export interface ParsedJD {
  id: number;
  role: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  responsibilities: string[];
}

export interface InterviewSummary {
  id: number;
  jdId: number;
  role: string;
  company: string;
  status: "in_progress" | "completed";
  score: number | null;
  messageCount: number;
  createdAt: string;
}

export interface InterviewMessage {
  id: number;
  role: "ai" | "user";
  content: string;
  createdAt: string;
}

export interface Evaluation {
  id: number;
  interviewId: number;
  overallScore: number;
  hiringVerdict?: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  criteriaScores: Array<{ dimension: string; score: number; weight: number; feedback: string }>;
  questionEvals: Array<{ question: string; answer: string; score: number; feedback: string; idealAnswer: string }>;
  createdAt: string;
}

export interface InterviewDetail {
  id: number;
  jdId: number;
  role: string;
  company: string;
  status: "in_progress" | "completed";
  messages: InterviewMessage[];
  evaluation: Evaluation | null;
  createdAt: string;
}

export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  recentInterviews: InterviewSummary[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  totalInterviews: number;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
}

export interface AdminInterview {
  id: number;
  userId: string;
  userEmail: string;
  role: string;
  status: string;
  score: number | null;
  createdAt: string;
}

export interface Invite {
  id: number;
  email: string;
  role: string;
  token: string;
  used: boolean;
  createdAt: string;
}

export interface AccessCode {
  id: number;
  code: string;
  role: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

export interface FacilityStats {
  totalStudents: number;
  activeThisWeek: number;
  averageScore: number;
  completionRate: number;
}

export interface FacilityStudent {
  id: string;
  email: string;
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number | null;
  lastActive: string | null;
}

/* ─── Query key getters ─────────────────────────────────────────────────── */

export const getGetUserProfileQueryKey = () => ["user-profile"];
export const getListInterviewsQueryKey = () => ["interviews"];
export const getGetInterviewStatsQueryKey = () => ["interview-stats"];
export const getListAllUsersQueryKey = () => ["admin-users"];
export const getGetAdminStatsQueryKey = () => ["admin-stats"];
export const getListAllInterviewsQueryKey = () => ["admin-interviews"];
export const getListInvitesQueryKey = () => ["admin-invites"];
export const getListAccessCodesQueryKey = () => ["admin-access-codes"];

/* ─── Helpers (Supabase mode only) ─────────────────────────────────────── */

function serializeUser(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    role: row.role as "student" | "admin" | "facility",
    fullName: (row.full_name ?? null) as string | null,
    university: (row.university ?? null) as string | null,
    department: (row.department ?? null) as string | null,
    yearOfStudy: (row.year_of_study ?? null) as string | null,
    profileCompleted: (row.profile_completed ?? false) as boolean,
    createdAt: row.created_at as string,
  };
}

function toJDContext(jd: Record<string, unknown>): JDContext {
  return {
    role: jd.role as string,
    company: (jd.company ?? "") as string,
    skills: (jd.skills ?? []) as string[],
    experienceLevel: jd.experience_level as string,
    responsibilities: (jd.responsibilities ?? []) as string[],
    rawText: jd.raw_text as string,
  };
}

/* ─── User hooks ────────────────────────────────────────────────────────── */

export function useGetUserProfile() {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  return useQuery<UserProfile>({
    queryKey: getGetUserProfileQueryKey(),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated");

      if (!USE_SUPABASE) {
        return restFetch<UserProfile>("/api/users/profile");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: existing } = await sb
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (existing) return serializeUser(existing as Record<string, unknown>);

      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ?? `${userId}@unknown.com`;

      const { data: created, error } = await sb.rpc("upsert_user_profile", {
        p_user_id: userId,
        p_email: email,
      });

      if (error) throw new Error(error.message);
      if (!created || (created as unknown[]).length === 0)
        throw new Error("Failed to create user");

      return serializeUser((created as Record<string, unknown>[])[0]);
    },
    enabled: !!userId && isSignedIn === true,
  });
}

export function useCompleteUserProfile() {
  const { getToken, userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      data: {
        fullName: string;
        university: string;
        department?: string;
        yearOfStudy?: string;
      };
    }) => {
      if (!USE_SUPABASE) {
        return restFetch<UserProfile>("/api/users/profile/complete", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args.data),
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb
        .from("users")
        .update({
          full_name: args.data.fullName.trim(),
          university: args.data.university.trim(),
          department: args.data.department?.trim() ?? null,
          year_of_study: args.data.yearOfStudy?.trim() ?? null,
          profile_completed: true,
        })
        .eq("id", userId!)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return serializeUser(data as Record<string, unknown>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
    },
  });
}

export function useUpdateUserProfile() {
  return useCompleteUserProfile();
}

export function useRedeemAccessCode() {
  const { getToken, userId } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { data: { code: string } }) => {
      if (!USE_SUPABASE) {
        return restFetch("/api/users/redeem-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: args.data.code }),
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb.rpc("redeem_access_code", {
        p_code: args.data.code.toUpperCase().trim(),
        p_user_id: userId!,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
    },
  });
}

/* ─── Interview stats hook ──────────────────────────────────────────────── */

export function useGetInterviewStats() {
  const { getToken, userId } = useAuth();

  return useQuery<InterviewStats>({
    queryKey: getGetInterviewStatsQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<InterviewStats>("/api/interviews/stats");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: ivs } = await sb
        .from("interviews")
        .select(
          "id, jd_id, status, created_at, job_descriptions(role, company)"
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      const all = ivs ?? [];
      const recent = all.slice(0, 5);

      let totalScore = 0;
      let scoredCount = 0;

      const recentInterviews = await Promise.all(
        recent.map(async (iv: Record<string, unknown>) => {
          const jd = iv.job_descriptions as Record<string, unknown> | null;

          const { count: msgCount } = await sb
            .from("interview_messages")
            .select("id", { count: "exact", head: true })
            .eq("interview_id", iv.id as number);

          const { data: ev } = await sb
            .from("evaluations")
            .select("overall_score")
            .eq("interview_id", iv.id as number)
            .maybeSingle();

          if (ev) {
            totalScore += (ev as Record<string, number>).overall_score;
            scoredCount++;
          }

          return {
            id: iv.id as number,
            jdId: iv.jd_id as number,
            role: (jd?.role as string) ?? "Unknown Role",
            company: (jd?.company as string) ?? "",
            status: iv.status as "in_progress" | "completed",
            score: ev ? (ev as Record<string, number>).overall_score : null,
            messageCount: msgCount ?? 0,
            createdAt: iv.created_at as string,
          };
        })
      );

      return {
        totalInterviews: all.length,
        completedInterviews: all.filter(
          (i: Record<string, unknown>) => i.status === "completed"
        ).length,
        averageScore: scoredCount > 0 ? totalScore / scoredCount : 0,
        recentInterviews,
      };
    },
    enabled: !!userId,
  });
}

/* ─── List interviews ───────────────────────────────────────────────────── */

export function useListInterviews() {
  const { getToken, userId } = useAuth();

  return useQuery<InterviewSummary[]>({
    queryKey: getListInterviewsQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<InterviewSummary[]>("/api/interviews");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: ivs } = await sb
        .from("interviews")
        .select(
          "id, jd_id, status, created_at, job_descriptions(role, company)"
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      return await Promise.all(
        (ivs ?? []).map(async (iv: Record<string, unknown>) => {
          const jd = iv.job_descriptions as Record<string, unknown> | null;

          const { count: msgCount } = await sb
            .from("interview_messages")
            .select("id", { count: "exact", head: true })
            .eq("interview_id", iv.id as number);

          const { data: ev } = await sb
            .from("evaluations")
            .select("overall_score")
            .eq("interview_id", iv.id as number)
            .maybeSingle();

          return {
            id: iv.id as number,
            jdId: iv.jd_id as number,
            role: (jd?.role as string) ?? "Unknown Role",
            company: (jd?.company as string) ?? "",
            status: iv.status as "in_progress" | "completed",
            score: ev ? (ev as Record<string, number>).overall_score : null,
            messageCount: msgCount ?? 0,
            createdAt: iv.created_at as string,
          };
        })
      );
    },
    enabled: !!userId,
  });
}

/* ─── Get single interview ──────────────────────────────────────────────── */

export function useGetInterview(
  id: number,
  opts?: {
    query?: {
      enabled?: boolean;
      queryKey?: unknown[];
      refetchInterval?: number | false;
    };
  }
) {
  const { getToken, userId } = useAuth();
  const queryKey = opts?.query?.queryKey ?? ["interview", id];

  return useQuery<InterviewDetail>({
    queryKey,
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<InterviewDetail>(`/api/interviews/${id}`);
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: iv, error } = await sb
        .from("interviews")
        .select(
          "id, user_id, jd_id, status, created_at, job_descriptions(role, company)"
        )
        .eq("id", id)
        .single();

      if (error || !iv) throw new Error("Interview not found");
      const ivRow = iv as Record<string, unknown>;
      if (ivRow.user_id !== userId) throw new Error("Interview not found");

      const jd = ivRow.job_descriptions as Record<string, unknown> | null;

      const { data: messages } = await sb
        .from("interview_messages")
        .select("id, role, content, created_at")
        .eq("interview_id", id)
        .order("created_at", { ascending: true });

      const { data: ev } = await sb
        .from("evaluations")
        .select("*")
        .eq("interview_id", id)
        .maybeSingle();

      return {
        id: ivRow.id as number,
        jdId: ivRow.jd_id as number,
        role: (jd?.role as string) ?? "Unknown Role",
        company: (jd?.company as string) ?? "",
        status: ivRow.status as "in_progress" | "completed",
        messages: (messages ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as number,
          role: m.role as "ai" | "user",
          content: m.content as string,
          createdAt: m.created_at as string,
        })),
        evaluation: ev
          ? {
              id: (ev as Record<string, unknown>).id as number,
              interviewId: (ev as Record<string, unknown>).interview_id as number,
              overallScore: (ev as Record<string, unknown>).overall_score as number,
              hiringVerdict: (ev as Record<string, unknown>).hiring_verdict as string | undefined,
              feedback: (ev as Record<string, unknown>).feedback as string,
              strengths: (ev as Record<string, unknown>).strengths as string[],
              improvements: (ev as Record<string, unknown>).improvements as string[],
              criteriaScores: ((ev as Record<string, unknown>).criteria_scores ?? []) as Evaluation["criteriaScores"],
              questionEvals: ((ev as Record<string, unknown>).question_evals ?? []) as Evaluation["questionEvals"],
              createdAt: (ev as Record<string, unknown>).created_at as string,
            }
          : null,
        createdAt: ivRow.created_at as string,
      };
    },
    enabled: opts?.query?.enabled !== undefined ? opts.query.enabled : !!id,
    refetchInterval:
      opts?.query?.refetchInterval !== undefined
        ? opts.query.refetchInterval === false
          ? false
          : opts.query.refetchInterval
        : undefined,
  });
}

/* ─── Upload JD (parse + save) ──────────────────────────────────────────── */

export function useUploadJD() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (args: { data: { text: string } }) => {
      if (!USE_SUPABASE) {
        return restFetch<ParsedJD>("/api/jd/upload", {
          ...jsonInit({ text: args.data.text }),
        });
      }

      const parsed = await parseJD(args.data.text);

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: jd, error } = await sb
        .from("job_descriptions")
        .insert({
          user_id: userId!,
          role: parsed.role,
          company: parsed.company ?? "",
          skills: parsed.skills,
          experience_level: parsed.experienceLevel,
          responsibilities: parsed.responsibilities,
          raw_text: args.data.text,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      const jdRow = jd as Record<string, unknown>;
      return {
        id: jdRow.id as number,
        role: jdRow.role as string,
        company: jdRow.company as string,
        skills: jdRow.skills as string[],
        experienceLevel: jdRow.experience_level as string,
        responsibilities: jdRow.responsibilities as string[],
      } as ParsedJD;
    },
  });
}

/* ─── Create interview ──────────────────────────────────────────────────── */

export function useCreateInterview() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (args: { data: { jdId: number } }) => {
      if (!USE_SUPABASE) {
        return restFetch<{ id: number; userId: string; jdId: number; status: string; createdAt: string }>(
          "/api/interviews",
          { ...jsonInit({ jdId: args.data.jdId }) }
        );
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: jd, error: jdErr } = await sb
        .from("job_descriptions")
        .select("*")
        .eq("id", args.data.jdId)
        .eq("user_id", userId!)
        .single();

      if (jdErr || !jd) throw new Error("Job description not found");

      const ctx = toJDContext(jd as Record<string, unknown>);
      const questionSet = await generateQuestions(ctx);
      const firstQuestion = await getNextQuestion(ctx, questionSet, [], 0);

      const { data: interview, error: ivErr } = await sb
        .from("interviews")
        .insert({
          user_id: userId!,
          jd_id: args.data.jdId,
          status: "in_progress",
          question_set: questionSet,
        })
        .select()
        .single();

      if (ivErr || !interview) throw new Error("Failed to create interview");

      const ivRow = interview as Record<string, unknown>;

      await sb.from("interview_messages").insert({
        interview_id: ivRow.id as number,
        role: "ai",
        content: firstQuestion.content,
      });

      return {
        id: ivRow.id as number,
        userId: ivRow.user_id as string,
        jdId: ivRow.jd_id as number,
        status: ivRow.status as string,
        createdAt: ivRow.created_at as string,
      };
    },
  });
}

/* ─── Respond to interview ──────────────────────────────────────────────── */

export function useRespondToInterview() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (args: { id: number; data: { content: string } }) => {
      if (!USE_SUPABASE) {
        const result = await restFetch<{ id: number; content: string; isComplete: boolean }>(
          `/api/interviews/${args.id}/respond`,
          { ...jsonInit({ content: args.data.content }) }
        );
        return { content: result.content, isComplete: result.isComplete, phase: "" };
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: iv, error } = await sb
        .from("interviews")
        .select("id, user_id, jd_id, status, question_set")
        .eq("id", args.id)
        .single();

      if (error || !iv) throw new Error("Interview not found");
      const ivRow = iv as Record<string, unknown>;
      if (ivRow.user_id !== userId) throw new Error("Interview not found");
      if (ivRow.status === "completed") throw new Error("Interview already completed");

      const { data: jd } = await sb
        .from("job_descriptions")
        .select("*")
        .eq("id", ivRow.jd_id as number)
        .single();

      if (!jd) throw new Error("Job description not found");

      await sb.from("interview_messages").insert({
        interview_id: args.id,
        role: "user",
        content: args.data.content,
      });

      const { data: allMsgs } = await sb
        .from("interview_messages")
        .select("role, content")
        .eq("interview_id", args.id)
        .order("created_at", { ascending: true });

      const history = (allMsgs ?? []).map((m: Record<string, unknown>) => ({
        role: m.role as "ai" | "user",
        content: m.content as string,
      }));
      const userAnswerCount = history.filter((m) => m.role === "user").length;

      const ctx = toJDContext(jd as Record<string, unknown>);

      let questionSet = ivRow.question_set as QuestionSet | null;
      if (!questionSet) {
        questionSet = await generateQuestions(ctx);
        await sb
          .from("interviews")
          .update({ question_set: questionSet })
          .eq("id", args.id);
      }

      const aiResponse = await getNextQuestion(ctx, questionSet, history, userAnswerCount);

      await sb.from("interview_messages").insert({
        interview_id: args.id,
        role: "ai",
        content: aiResponse.content,
      });

      if (aiResponse.isComplete) {
        await sb
          .from("interviews")
          .update({ status: "completed" })
          .eq("id", args.id);
      }

      return {
        content: aiResponse.content,
        isComplete: aiResponse.isComplete,
        phase: aiResponse.phase,
      };
    },
  });
}

/* ─── Complete interview (evaluate) ────────────────────────────────────── */

export function useCompleteInterview() {
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (args: { id: number }) => {
      if (!USE_SUPABASE) {
        return restFetch(`/api/interviews/${args.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: existing } = await sb
        .from("evaluations")
        .select("*")
        .eq("interview_id", args.id)
        .maybeSingle();

      if (existing) return existing;

      const { data: iv } = await sb
        .from("interviews")
        .select("id, user_id, jd_id")
        .eq("id", args.id)
        .single();

      if (!iv) throw new Error("Interview not found");
      const ivRow = iv as Record<string, unknown>;
      if (ivRow.user_id !== userId) throw new Error("Interview not found");

      const { data: jd } = await sb
        .from("job_descriptions")
        .select("*")
        .eq("id", ivRow.jd_id as number)
        .single();

      if (!jd) throw new Error("Job description not found");

      const { data: msgs } = await sb
        .from("interview_messages")
        .select("role, content")
        .eq("interview_id", args.id)
        .order("created_at", { ascending: true });

      const history = (msgs ?? []).map((m: Record<string, unknown>) => ({
        role: m.role as "ai" | "user",
        content: m.content as string,
      }));

      const evaluation = await evaluateInterview(
        toJDContext(jd as Record<string, unknown>),
        history
      );

      await sb
        .from("interviews")
        .update({ status: "completed" })
        .eq("id", args.id);

      const { data: saved, error } = await sb
        .from("evaluations")
        .insert({
          interview_id: args.id,
          overall_score: evaluation.overallScore,
          hiring_verdict: evaluation.hiringVerdict,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          criteria_scores: evaluation.criteriaScores,
          question_evals: evaluation.questionEvals,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return saved;
    },
  });
}

/* ─── Admin hooks ───────────────────────────────────────────────────────── */

export function useGetAdminStats() {
  const { getToken } = useAuth();

  return useQuery<AdminStats>({
    queryKey: getGetAdminStatsQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<AdminStats>("/api/admin/stats");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const [
        { count: totalUsers },
        { count: totalInterviews },
        { count: completedInterviews },
        { data: scores },
      ] = await Promise.all([
        sb.from("users").select("id", { count: "exact", head: true }),
        sb.from("interviews").select("id", { count: "exact", head: true }),
        sb
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        sb.from("evaluations").select("overall_score"),
      ]);

      const avgScore =
        scores && scores.length > 0
          ? (scores as Array<{ overall_score: number }>).reduce(
              (s, e) => s + e.overall_score,
              0
            ) / scores.length
          : 0;

      return {
        totalUsers: totalUsers ?? 0,
        totalInterviews: totalInterviews ?? 0,
        completedInterviews: completedInterviews ?? 0,
        averageScore: avgScore,
      };
    },
  });
}

export function useListAllUsers() {
  const { getToken } = useAuth();

  return useQuery<AdminUser[]>({
    queryKey: getListAllUsersQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<AdminUser[]>("/api/admin/users");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: users } = await sb
        .from("users")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: true });

      return await Promise.all(
        (users ?? []).map(async (u: Record<string, unknown>) => {
          const { count } = await sb
            .from("interviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", u.id as string);

          return {
            id: u.id as string,
            email: u.email as string,
            role: u.role as string,
            totalInterviews: count ?? 0,
            createdAt: u.created_at as string,
          };
        })
      );
    },
  });
}

export function useUpdateUserRole() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      userId: string;
      data: { role: "student" | "admin" | "facility" };
    }) => {
      if (!USE_SUPABASE) {
        return restFetch(`/api/admin/users/${args.userId}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: args.data.role }),
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb.rpc("admin_update_user_role", {
        p_target_user_id: args.userId,
        p_role: args.data.role,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAllUsersQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    },
  });
}

export function useDeleteUser() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { userId: string }): Promise<void> => {
      if (!USE_SUPABASE) {
        await restFetch(`/api/admin/users/${args.userId}`, { method: "DELETE" });
        return;
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { error } = await sb.rpc("admin_delete_user", {
        p_target_user_id: args.userId,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAllUsersQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    },
  });
}

export function useListAllInterviews() {
  const { getToken } = useAuth();

  return useQuery<AdminInterview[]>({
    queryKey: getListAllInterviewsQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<AdminInterview[]>("/api/admin/all-interviews");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: ivs } = await sb
        .from("interviews")
        .select(
          "id, user_id, jd_id, status, created_at, job_descriptions(role), users(email)"
        )
        .order("created_at", { ascending: false });

      return await Promise.all(
        (ivs ?? []).map(async (iv: Record<string, unknown>) => {
          const jd = iv.job_descriptions as Record<string, unknown> | null;
          const user = iv.users as Record<string, unknown> | null;

          const { data: ev } = await sb
            .from("evaluations")
            .select("overall_score")
            .eq("interview_id", iv.id as number)
            .maybeSingle();

          return {
            id: iv.id as number,
            userId: iv.user_id as string,
            userEmail: (user?.email as string) ?? "unknown@unknown.com",
            role: (jd?.role as string) ?? "Unknown Role",
            status: iv.status as string,
            score: ev ? (ev as Record<string, number>).overall_score : null,
            createdAt: iv.created_at as string,
          };
        })
      );
    },
  });
}

export function useDeleteAdminInterview() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: number }): Promise<void> => {
      if (!USE_SUPABASE) {
        await restFetch(`/api/admin/interviews/${args.id}`, { method: "DELETE" });
        return;
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { error } = await sb.rpc("admin_delete_interview", {
        p_id: args.id,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAllInterviewsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    },
  });
}

/* ─── Invites ───────────────────────────────────────────────────────────── */

export function useListInvites() {
  const { getToken } = useAuth();

  return useQuery<Invite[]>({
    queryKey: getListInvitesQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        const data = await restFetch<Record<string, unknown>[]>("/api/admin/invites");
        return data.map((r) => ({
          id: r.id as number,
          email: r.email as string,
          role: r.role as string,
          token: r.token as string,
          used: r.used as boolean,
          createdAt: (r.createdAt ?? r.created_at) as string,
        }));
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        email: r.email as string,
        role: r.role as string,
        token: r.token as string,
        used: r.used as boolean,
        createdAt: r.created_at as string,
      }));
    },
  });
}

export function useCreateInvite() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { data: { email: string; role: string } }) => {
      if (!USE_SUPABASE) {
        return restFetch("/api/admin/invites", {
          ...jsonInit({ email: args.data.email, role: args.data.role }),
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb.rpc("admin_create_invite", {
        p_email: args.data.email,
        p_role: args.data.role,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListInvitesQueryKey() });
    },
  });
}

export function useDeleteInvite() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: number }): Promise<void> => {
      if (!USE_SUPABASE) {
        await restFetch(`/api/admin/invites/${args.id}`, { method: "DELETE" });
        return;
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { error } = await sb.rpc("admin_delete_invite", {
        p_id: args.id,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListInvitesQueryKey() });
    },
  });
}

export function useBulkInvite() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { invites: Array<{ email: string; role: string }> }) => {
      if (!USE_SUPABASE) {
        return restFetch<{ created: number; skipped: number; errors: string[] }>(
          "/api/admin/bulk-invite",
          { ...jsonInit({ invites: args.invites }) }
        );
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb.rpc("admin_bulk_invite", {
        p_invites: args.invites,
      });

      if (error) throw new Error(error.message);
      return data as { created: number; skipped: number; errors: string[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListInvitesQueryKey() });
    },
  });
}

/* ─── Access codes ──────────────────────────────────────────────────────── */

export function useListAccessCodes() {
  const { getToken } = useAuth();

  return useQuery<AccessCode[]>({
    queryKey: getListAccessCodesQueryKey(),
    queryFn: async () => {
      if (!USE_SUPABASE) {
        const data = await restFetch<Record<string, unknown>[]>("/api/admin/access-codes");
        return data.map((r) => ({
          id: r.id as number,
          code: r.code as string,
          role: r.role as string,
          active: (r.active ?? true) as boolean,
          maxUses: (r.maxUses ?? r.max_uses ?? 100) as number,
          usedCount: (r.usedCount ?? r.used_count ?? 0) as number,
          createdAt: (r.createdAt ?? r.created_at) as string,
        }));
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data, error } = await sb
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        code: r.code as string,
        role: r.role as string,
        active: r.active as boolean,
        maxUses: r.max_uses as number,
        usedCount: r.used_count as number,
        createdAt: r.created_at as string,
      }));
    },
  });
}

export function useCreateAccessCode() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      data: { role: string; code?: string; maxUses?: number };
    }) => {
      if (!USE_SUPABASE) {
        return restFetch("/api/admin/access-codes", {
          ...jsonInit({
            role: args.data.role,
            code: args.data.code,
            maxUses: args.data.maxUses,
          }),
        });
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const prefix = args.data.role.toUpperCase().slice(0, 3);
      const randomHex = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("").toUpperCase();
      const generatedCode = `${prefix}-${randomHex}`;
      const finalCode = args.data.code
        ? args.data.code.toUpperCase().trim()
        : generatedCode;

      const { data, error } = await sb.rpc("admin_create_access_code", {
        p_role: args.data.role,
        p_code: finalCode,
        p_max_uses: args.data.maxUses ?? 100,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAccessCodesQueryKey() });
    },
  });
}

export function useDeleteAccessCode() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: number }): Promise<void> => {
      if (!USE_SUPABASE) {
        await restFetch(`/api/admin/access-codes/${args.id}`, { method: "DELETE" });
        return;
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { error } = await sb.rpc("admin_delete_access_code", {
        p_id: args.id,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAccessCodesQueryKey() });
    },
  });
}

/* ─── Facility hooks ────────────────────────────────────────────────────── */

export function useGetFacilityStats() {
  const { getToken } = useAuth();

  return useQuery<FacilityStats>({
    queryKey: ["facility-stats"],
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<FacilityStats>("/api/facility/stats");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: students } = await sb
        .from("users")
        .select("id")
        .eq("role", "student");

      const studentIds = (students ?? []).map(
        (s: Record<string, unknown>) => s.id as string
      );

      if (studentIds.length === 0) {
        return {
          totalStudents: 0,
          activeThisWeek: 0,
          averageScore: 0,
          completionRate: 0,
        };
      }

      const oneWeekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [
        { count: totalInterviews },
        { count: completedInterviews },
        { count: activeThisWeek },
        { data: scores },
      ] = await Promise.all([
        sb
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .in("user_id", studentIds),
        sb
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .in("user_id", studentIds)
          .eq("status", "completed"),
        sb
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .in("user_id", studentIds)
          .gte("created_at", oneWeekAgo),
        sb
          .from("evaluations")
          .select("overall_score, interviews!inner(user_id)")
          .in("interviews.user_id", studentIds),
      ]);

      const avgScore =
        scores && scores.length > 0
          ? (scores as Array<{ overall_score: number }>).reduce(
              (s, e) => s + e.overall_score,
              0
            ) / scores.length
          : 0;

      return {
        totalStudents: studentIds.length,
        activeThisWeek: activeThisWeek ?? 0,
        averageScore: avgScore,
        completionRate:
          (totalInterviews ?? 0) > 0
            ? ((completedInterviews ?? 0) / (totalInterviews ?? 1)) * 100
            : 0,
      };
    },
  });
}

export function useListFacilityStudents() {
  const { getToken } = useAuth();

  return useQuery<FacilityStudent[]>({
    queryKey: ["facility-students"],
    queryFn: async () => {
      if (!USE_SUPABASE) {
        return restFetch<FacilityStudent[]>("/api/facility/students");
      }

      const token = await getToken({ template: "supabase" });
      const sb = getSupabase(token);

      const { data: students } = await sb
        .from("users")
        .select("id, email, created_at")
        .eq("role", "student")
        .order("created_at", { ascending: true });

      return await Promise.all(
        (students ?? []).map(async (s: Record<string, unknown>) => {
          const [
            { count: totalInterviews },
            { count: completedInterviews },
            { data: ivs },
            { data: scores },
          ] = await Promise.all([
            sb
              .from("interviews")
              .select("id", { count: "exact", head: true })
              .eq("user_id", s.id as string),
            sb
              .from("interviews")
              .select("id", { count: "exact", head: true })
              .eq("user_id", s.id as string)
              .eq("status", "completed"),
            sb
              .from("interviews")
              .select("created_at")
              .eq("user_id", s.id as string)
              .order("created_at", { ascending: false })
              .limit(1),
            sb
              .from("evaluations")
              .select("overall_score, interviews!inner(user_id)")
              .eq("interviews.user_id", s.id as string),
          ]);

          const avgScore =
            scores && scores.length > 0
              ? (scores as Array<{ overall_score: number }>).reduce(
                  (acc, e) => acc + e.overall_score,
                  0
                ) / scores.length
              : null;

          return {
            id: s.id as string,
            email: s.email as string,
            totalInterviews: totalInterviews ?? 0,
            completedInterviews: completedInterviews ?? 0,
            averageScore: avgScore,
            lastActive:
              ivs && ivs.length > 0
                ? (ivs[0] as Record<string, unknown>).created_at as string
                : null,
          };
        })
      );
    },
  });
}
