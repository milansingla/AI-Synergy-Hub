import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetUserProfile,
  useUpdateUserProfile,
  getGetUserProfileQueryKey,
  UpdateUserProfileBodyRole,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Shield, Clock } from "lucide-react";

const schema = z.object({
  role: z.enum(["student", "admin"]),
});
type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
    values: profile ? { role: profile.role as "student" | "admin" } : undefined,
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

  return (
    <AppLayout>
      <div className="px-8 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Read-only account info */}
          <div className="space-y-4 pb-6 border-b border-border">
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
                  <p className="text-sm font-mono" data-testid="text-email">{profile?.email || "—"}</p>
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
                  <p className="text-sm font-mono" data-testid="text-joined">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Editable role */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</h2>
            <p className="text-xs text-muted-foreground">
              Your role determines what you can access. Contact your administrator if you need elevated permissions.
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
                          <SelectTrigger className="w-40 bg-background border-border" data-testid="select-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
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
                    data-testid="btn-save-profile"
                  >
                    {updateProfile.isPending ? (
                      <><Loader2 size={13} className="animate-spin mr-1.5" />Saving...</>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Badge
                    variant="secondary"
                    className="text-xs font-mono"
                    data-testid="badge-current-role"
                  >
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
