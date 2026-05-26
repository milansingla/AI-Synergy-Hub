import { supabase } from "./supabase";

interface AppConfig {
  AI_INTEGRATIONS_OPENAI_BASE_URL: string;
  AI_INTEGRATIONS_OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
}

let _config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (_config?.AI_INTEGRATIONS_OPENAI_API_KEY) return _config;

  const { data } = await supabase.from("app_config").select("key, value");

  const map = Object.fromEntries(
    (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  );

  const apiKey =
    (map["AI_INTEGRATIONS_OPENAI_API_KEY"] || "") ||
    (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ||
    "";

  const baseURL =
    (map["AI_INTEGRATIONS_OPENAI_BASE_URL"] || "") ||
    (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ||
    "";

  const groqKey =
    (map["GROQ_API_KEY"] || "") ||
    (import.meta.env.VITE_GROQ_API_KEY as string | undefined) ||
    "";

  if (apiKey) {
    _config = { AI_INTEGRATIONS_OPENAI_API_KEY: apiKey, AI_INTEGRATIONS_OPENAI_BASE_URL: baseURL, GROQ_API_KEY: groqKey };
  }

  return { AI_INTEGRATIONS_OPENAI_API_KEY: apiKey, AI_INTEGRATIONS_OPENAI_BASE_URL: baseURL, GROQ_API_KEY: groqKey };
}

export function getConfig(): AppConfig {
  return _config ?? { AI_INTEGRATIONS_OPENAI_API_KEY: "", AI_INTEGRATIONS_OPENAI_BASE_URL: "", GROQ_API_KEY: "" };
}

export function resetConfig() {
  _config = null;
}
