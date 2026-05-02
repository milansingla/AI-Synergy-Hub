import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetUserProfile,
  useUpdateUserProfile,
  useRedeemAccessCode,
  getGetUserProfileQueryKey,
  UpdateUserProfileBodyRole,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Shield, Clock, KeyRound } from "lucide-react";

const schema = z.object({
  role: z.enum(["student", "admin", "facility"]),
});
type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const redeemCode = useRedeemAccessCode();

  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
    values: profile
      ? { role: profile.role as "student" | "admin" | "facility" }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProfile.mutateAsync({
        data: { role: values.role as typeof UpdateUserProfileBodyRole[keyof typeof UpdateUserProfileBodyRole] },
      });
      await queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleRedeem = async () => {
    if (!codeInput.trim()) return;
    setRedeeming(true);
    try {
      await redeemCode.mutateAsync({ data: { code: codeInput.trim() } });
      await queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      toast({ title: "Code redeemed!", description: "Your role has been updated." });
      setCodeInput("");
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Invalid or expired code";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const roleBadgeClass =
    profile?.role === "admin"
      ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
      : profile?.role === "facility"
      ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
      : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>

        <div className="space-y-4">
          {/* Account info */}
          <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Mail size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <p className="text-sm font-mono">{profile?.email || "—"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Clock size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Member since</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <p className="text-sm font-mono">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Shield size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Current role</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span
                    className={`text-xs font-mono font-semibold border rounded px-1.5 py-0.5 ${roleBadgeClass}`}
                  >
                    {profile?.role || "—"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Redeem access code */}
          <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound size={14} className="text-primary" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Redeem Access Code
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If your institution provided an access code, enter it below to upgrade your account role.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. FAC-A1B2C3"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                className="flex-1 bg-background border-border text-sm font-mono h-9"
              />
              <Button
                size="sm"
                onClick={handleRedeem}
                disabled={redeeming || !codeInput.trim()}
                className="h-9 gap-1.5"
              >
                {redeeming ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                Redeem
              </Button>
            </div>
          </div>

          {/* Role selector */}
          <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</h2>
            <p className="text-xs text-muted-foreground">
              Your role determines what panels you can access. Contact your administrator if you need
              elevated permissions, or use an access code above.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <Shield size={13} className="text-muted-foreground" />
                        Account role
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="w-40 bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
                            <SelectItem value="facility">facility</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateProfile.isPending || isLoading}
                  >
                    {updateProfile.isPending ? (
                      <><Loader2 size={13} className="animate-spin mr-1.5" />Saving…</>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Badge variant="secondary" className="text-xs font-mono">
                    current: {profile?.role || "—"}
                  </Badge>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
