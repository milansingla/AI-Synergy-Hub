import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompleteUserProfile, getGetUserProfileQueryKey } from "@/hooks/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
  "Doctoral",
  "Other",
];

export default function ProfileSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const completeProfile = useCompleteUserProfile();

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = fullName.trim().length >= 2 && university.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await completeProfile.mutateAsync({
        data: {
          fullName: fullName.trim(),
          university: university.trim(),
          department: department.trim() || undefined,
          yearOfStudy: yearOfStudy || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      navigate("/dashboard");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Sparkles size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Tell us a little about yourself so we can personalise your interview experience.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xl"
        >
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <User size={11} /> Full name <span className="text-primary">*</span>
            </label>
            <Input
              placeholder="e.g. Priya Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              required
              className="bg-background/50"
            />
          </div>

          {/* University */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Building2 size={11} /> University / Institution <span className="text-primary">*</span>
            </label>
            <Input
              placeholder="e.g. IIT Bombay"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              className="bg-background/50"
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen size={11} /> Department / Program
              <span className="text-muted-foreground/50 text-[10px] font-normal normal-case tracking-normal">optional</span>
            </label>
            <Input
              placeholder="e.g. Computer Science & Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* Year of study */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <GraduationCap size={11} /> Year of study
              <span className="text-muted-foreground/50 text-[10px] font-normal normal-case tracking-normal">optional</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {YEAR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setYearOfStudy(yearOfStudy === opt ? "" : opt)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg border transition-all",
                    yearOfStudy === opt
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit || saving}
            className="w-full gap-2 mt-2"
            size="lg"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Saving…</>
            ) : (
              <>Continue to dashboard <ChevronRight size={15} /></>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            You can update these details later in{" "}
            <span className="text-foreground">Settings</span>.
          </p>
        </form>
      </div>
    </div>
  );
}
