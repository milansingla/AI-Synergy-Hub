import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUploadJD, useCreateInterview } from "@/hooks/api";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, ArrowRight, Briefcase, Layers, BarChart2, Building2, ListChecks, Lock, ArrowUpRight } from "lucide-react";
import type { ParsedJD } from "@/hooks/api";

const schema = z.object({
  text: z.string().min(50, "Paste the full job description (at least 50 characters)"),
});
type FormValues = z.infer<typeof schema>;

export default function JDNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);

  const uploadJD = useUploadJD();
  const createInterview = useCreateInterview();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await uploadJD.mutateAsync({ data: { text: values.text } });
      setParsedJD(result);
    } catch {
      toast({ title: "Failed to parse job description", variant: "destructive" });
    }
  };

  const startInterview = async () => {
    if (!parsedJD) return;
    try {
      const interview = await createInterview.mutateAsync({ data: { jdId: parsedJD.id } });
      navigate(`/interviews/${interview.id}`);
    } catch (err) {
      if (err instanceof Error && err.message === "free_limit_reached") {
        setFreeLimitReached(true);
      } else {
        toast({ title: "Failed to start interview", variant: "destructive" });
      }
    }
  };

  const responsibilities = parsedJD ? (parsedJD.responsibilities as string[]) : [];

  if (freeLimitReached) {
    return (
      <AppLayout>
        <div className="px-8 py-16 max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
              <Lock size={22} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">You've used your free interview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              The free plan includes <strong>1 mock interview</strong>. To practise again — and unlock cohort analytics, bulk JD uploads, and detailed scoring history — ask your placement officer about upgrading to a Professional plan.
            </p>
            <div className="space-y-3">
              <Link href="/interviews">
                <Button variant="outline" className="w-full gap-2">
                  View my interview results
                </Button>
              </Link>
              <a href="/pricing" target="_blank" rel="noreferrer">
                <Button className="w-full gap-2">
                  See Professional plan <ArrowUpRight size={14} />
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Already on an institutional plan?{" "}
              <a href="/contact" className="underline">Contact us</a> and we'll sort it out.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Upload job description</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a job description and we'll extract the role, company, skills, and generate highly targeted interview questions.
          </p>
        </div>

        {!parsedJD ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Job description text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="input-jd-text"
                          placeholder="Paste the full job description here — role, responsibilities, required skills, experience level, etc."
                          className="min-h-[280px] font-mono text-sm resize-none bg-background border-border focus:border-primary/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={uploadJD.isPending}
                  className="gap-2"
                  data-testid="btn-parse-jd"
                >
                  {uploadJD.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Parsing with AI...</>
                  ) : (
                    <><Zap size={14} /> Parse job description</>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Parsed result card */}
            <div className="rounded-xl border border-primary/30 bg-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-primary uppercase tracking-wider">Parsed successfully</span>
              </div>

              <div className="space-y-5">
                {/* Role */}
                <div className="flex items-start gap-3">
                  <Briefcase size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <p className="font-semibold" data-testid="text-parsed-role">{parsedJD.role}</p>
                  </div>
                </div>

                {/* Company */}
                {parsedJD.company && (
                  <div className="flex items-start gap-3">
                    <Building2 size={15} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company</p>
                      <p className="font-semibold" data-testid="text-parsed-company">{parsedJD.company}</p>
                    </div>
                  </div>
                )}

                {/* Experience level */}
                <div className="flex items-start gap-3">
                  <BarChart2 size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Experience level</p>
                    <p className="font-medium" data-testid="text-parsed-level">{parsedJD.experienceLevel}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex items-start gap-3">
                  <Layers size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Required skills</p>
                    <div className="flex flex-wrap gap-1.5" data-testid="list-skills">
                      {(parsedJD.skills as string[]).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs font-mono"
                          data-testid={`badge-skill-${skill}`}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Responsibilities */}
                {responsibilities.length > 0 && (
                  <div className="flex items-start gap-3">
                    <ListChecks size={15} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Key responsibilities</p>
                      <ul className="space-y-1.5">
                        {responsibilities.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary text-xs mt-0.5 shrink-0">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview quality callout */}
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Interview questions will be specifically tailored to{" "}
              {parsedJD.company ? (
                <span className="text-foreground font-medium">{parsedJD.company}</span>
              ) : "this company"}'s requirements, referencing the exact responsibilities and technologies above.
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={startInterview}
                disabled={createInterview.isPending}
                className="gap-2"
                data-testid="btn-start-interview"
              >
                {createInterview.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Starting...</>
                ) : (
                  <>Start interview <ArrowRight size={14} /></>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setParsedJD(null)}
                data-testid="btn-upload-another"
              >
                Upload another
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
