import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Check if user metadata has basic profile info, if not, set defaults
    if (data?.session?.user) {
      const user = data.session.user;
      const metadata = user.user_metadata || {};

      // If user doesn't have role set, update it to USER
      if (!metadata.role) {
        await supabase.auth.updateUser({
          data: {
            role: "USER",
          },
        });
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
