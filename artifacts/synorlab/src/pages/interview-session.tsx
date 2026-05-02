import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetInterview,
  useRespondToInterview,
  useCompleteInterview,
  getListInterviewsQueryKey,
  getGetInterviewStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle, Bot, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({ content: z.string().min(1, "Type your answer") });
type FormValues = z.infer<typeof schema>;

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const interviewId = Number(id);
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: interview, isLoading } = useGetInterview(interviewId, {
    query: {
      enabled: !!interviewId,
      queryKey: ["getInterview", interviewId],
      refetchInterval: false,
    },
  });

  const respond = useRespondToInterview();
  const complete = useCompleteInterview();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interview?.messages]);

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await respond.mutateAsync({ id: interviewId, data: { content: values.content } });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["getInterview", interviewId] });
      if (result.isComplete) {
        toast({ title: "Interview complete! Generating evaluation..." });
        await handleComplete();
      }
    } catch {
      toast({ title: "Failed to send response", variant: "destructive" });
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await complete.mutateAsync({ id: interviewId });
      await queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetInterviewStatsQueryKey() });
      navigate(`/interviews/${interviewId}/results`);
    } catch {
      toast({ title: "Failed to complete interview", variant: "destructive" });
      setIsCompleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full max-w-3xl mx-auto px-6 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex-1 space-y-3 mt-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!interview) return null;

  const isCompleted = interview.status === "completed";

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-0px)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-sm">{interview.role}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {interview.messages.length} messages · {isCompleted ? "completed" : "in progress"}
              </p>
            </div>
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleComplete}
                disabled={isCompleting || respond.isPending}
                className="gap-2 text-xs"
                data-testid="btn-complete-interview"
              >
                {isCompleting ? (
                  <><Loader2 size={12} className="animate-spin" /> Evaluating...</>
                ) : (
                  <><CheckCircle size={12} /> Finish & get score</>
                )}
              </Button>
            )}
            {isCompleted && (
              <Button
                size="sm"
                onClick={() => navigate(`/interviews/${interviewId}/results`)}
                className="gap-2 text-xs"
                data-testid="btn-view-results"
              >
                View results <ArrowRight size={12} />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" data-testid="messages-container">
          {interview.messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[90%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
              data-testid={`message-${i}`}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "ai" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                )}
              >
                {msg.role === "ai" ? <Bot size={13} /> : <User size={13} />}
              </div>
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "ai"
                    ? "bg-card border border-border rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {(respond.isPending || isCompleting) && (
            <div className="flex gap-3 max-w-[90%]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/20 text-primary shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
              <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isCompleted && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          {...field}
                          onKeyDown={handleKeyDown}
                          disabled={respond.isPending || isCompleting}
                          placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                          className="min-h-[60px] max-h-[180px] resize-none bg-card border-border text-sm"
                          data-testid="input-answer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={respond.isPending || isCompleting}
                  className="h-10 w-10 shrink-0 self-end"
                  data-testid="btn-send"
                >
                  {respond.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
