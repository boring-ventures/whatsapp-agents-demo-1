import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password/components/reset-password-form";

// Force dynamic rendering to prevent static generation issues with cookies
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Enter your new password",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </Card>
    </AuthLayout>
  );
}
