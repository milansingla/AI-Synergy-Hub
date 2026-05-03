import { useEffect } from "react";

const DEFAULT_TITLE = "Synorlab — AI Mock Interview Platform for Indian Universities";
const DEFAULT_DESC = "AI-powered mock interview platform for Indian university placement departments. Students practice job-specific interviews, get instant scored feedback, and placement teams get actionable cohort data.";

export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Synorlab` : DEFAULT_TITLE;
    document.title = fullTitle;

    const setMeta = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };

    const desc = description ?? DEFAULT_DESC;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', desc);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="description"]', DEFAULT_DESC);
      setMeta('meta[property="og:title"]', DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', DEFAULT_DESC);
      setMeta('meta[name="twitter:title"]', DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', DEFAULT_DESC);
    };
  }, [title, description]);
}
