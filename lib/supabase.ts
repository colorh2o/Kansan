import "server-only";

import { createContextClient } from "@supabase/server/core";
import { NextResponse } from "next/server";

export function getPublicSupabase() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return {
      response: NextResponse.json(
        { error: "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY on the server." },
        { status: 503 },
      ),
    };
  }

  try {
    return {
      supabase: createContextClient({
        env: { url, publishableKeys: { default: publishableKey } },
      }),
    };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Supabase client setup failed. Check the Vercel SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY values, then redeploy." },
        { status: 503 },
      ),
    };
  }
}