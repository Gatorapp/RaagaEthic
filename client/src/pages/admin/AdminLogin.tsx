"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/admin-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAdmin();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(password);
    setSubmitting(false);
    if (ok) {
      router.push("/admin/dashboard");
    } else {
      toast({ title: "Incorrect password", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo variant="stacked" />
        </div>
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Admin Access
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              data-testid="input-admin-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting} data-testid="button-admin-login">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
