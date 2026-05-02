import { useState, useEffect } from "react";
import {
  useGetUserProfile,
  useRedeemAccessCode,
  useCompleteUserProfile,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Mail,
  Shield,
  Clock,
  KeyRound,
  Info,
  User,
  Building2,
  BookOpen,
  GraduationCap,
  Pencil,
  Check,
  X,
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

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetUserProfile();
  const redeemCode = useRedeemAccessCode();
  const completeProfile = useCompleteUserProfile();

  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setUniversity(profile.university ?? "");
      setDepartment(profile.department ?? "");
      setYearOfStudy(profile.yearOfStudy ?? "");
    }
  }, [profile]);

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

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !university.trim()) {
      toast({ title: "Name and university are required", variant: "destructive" });
      return;
    }
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
      toast({ title: "Profile updated successfully" });
      setEditing(false);
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(profile?.fullName ?? "");
    setUniversity(profile?.university ?? "");
    setDepartment(profile?.department ?? "");
    setYearOfStudy(profile?.yearOfStudy ?? "");
    setEditing(false);
  };

  const roleBadgeClass =
    profile?.role === "admin"
      ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
      : profile?.role === "facility"
      ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
      : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";

  const isAdmin = profile?.role === "admin";

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and profile</p>
        </div>

        <div className="space-y-4">
          {/* ── Profile info ── */}
          <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</h2>
              {!editing && !isLoading && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-3">
                <ProfileRow icon={User} label="Full name" loading={isLoading}>
                  {profile?.fullName || <span className="text-muted-foreground/50 italic">Not set</span>}
                </ProfileRow>
                <ProfileRow icon={Building2} label="University" loading={isLoading}>
                  {profile?.university || <span className="text-muted-foreground/50 italic">Not set</span>}
                </ProfileRow>
                <ProfileRow icon={BookOpen} label="Department" loading={isLoading}>
                  {profile?.department || <span className="text-muted-foreground/50 italic">Not set</span>}
                </ProfileRow>
                <ProfileRow icon={GraduationCap} label="Year of study" loading={isLoading}>
                  {profile?.yearOfStudy || <span className="text-muted-foreground/50 italic">Not set</span>}
                </ProfileRow>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User size={10} /> Full name <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    autoFocus
                    className="bg-background/50 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={10} /> University / Institution <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. IIT Bombay"
                    className="bg-background/50 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <BookOpen size={10} /> Department
                    <span className="text-muted-foreground/40 text-[10px]">optional</span>
                  </label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="bg-background/50 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap size={10} /> Year of study
                    <span className="text-muted-foreground/40 text-[10px]">optional</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {YEAR_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setYearOfStudy(yearOfStudy === opt ? "" : opt)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-lg border transition-all",
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
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving || !fullName.trim() || !university.trim()}
                    className="gap-1.5 h-9"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="gap-1.5 h-9"
                  >
                    <X size={13} /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Account info ── */}
          <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>

            <ProfileRow icon={Mail} label="Email" loading={isLoading}>
              <span className="font-mono">{profile?.email || "—"}</span>
            </ProfileRow>

            <ProfileRow icon={Clock} label="Member since" loading={isLoading}>
              <span className="font-mono">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
              </span>
            </ProfileRow>

            <ProfileRow icon={Shield} label="Current role" loading={isLoading}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-semibold border rounded px-1.5 py-0.5 ${roleBadgeClass}`}>
                  {profile?.role || "—"}
                </span>
                {!isAdmin && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info size={11} />
                    Assigned by your administrator
                  </span>
                )}
              </div>
            </ProfileRow>
          </div>

          {/* ── Redeem access code ── */}
          {!isAdmin && (
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
          )}

          {/* ── Role info notice ── */}
          {!isAdmin && (
            <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</h2>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed bg-secondary/40 rounded-lg px-3 py-2.5">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>
                  Role changes can only be made by an administrator. To request a role change, contact your institution's admin, or use an access code above if one was provided to you.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  loading,
  children,
}: {
  icon: React.ElementType;
  label: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
        <Icon size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {loading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <p className="text-sm">{children}</p>
        )}
      </div>
    </div>
  );
}
