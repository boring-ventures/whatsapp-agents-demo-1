import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import AuthLayout from "@/components/auth/auth-layout";
import { MagicLinkForm } from "@/components/auth/magic-link/components/magic-link-form";
import Link from "next/link";

// Force dynamic rendering to prevent static generation issues with cookies
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In with Magic Link",
  description: "Sign in without a password",
};

export default function MagicLinkPage() {
  return (
    <AuthLayout>
      <Card className="p-6">
        <div className="flex flex-col space-y-2 text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            Passwordless Sign In
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a magic link to sign in.{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
        <MagicLinkForm />
      </Card>
    </AuthLayout>
  );
}
