"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [redirect, setRedirect] = useState("");

  useEffect(() => {
    // Get redirect path from URL
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    setRedirect(redirect);

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router, supabase.auth]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/gmail.send",
        redirectTo: `${window.location.origin}/callback?redirect=${redirect}`,
        queryParams: {
          access_type: "offline",
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Job Application Automation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with Google to enable Gmail integration
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full inline-flex space-x-2 cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <FcGoogle className="text-4xl mr-2"/>
            Sign in with Google
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>By signing in, you grant permission to:</p>
          <ul className="list-disc text-left mt-2 ml-6">
            <li>Send emails on your behalf via Gmail</li>
            <li>Store your CV for job applications</li>
            <li>Process your data to generate tailored applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
