"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PaperAirplaneIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  SparklesIcon,
  CommandLineIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { startCvOptimization } from "@/lib/api";
import Link from "next/link";

interface CV {
  id: string;
  file_name: string;
  version: number;
  ats_score: number | null;
  file_url: string; // Ensure your Supabase query fetches this
}

export default function ApplicationsPage() {
  const router = useRouter();
  const supabase = createClient();

  // States
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOptimizedCvUrl, setNewOptimizedCvUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    match_score: number;
    pdf_url: string;
    email_sent: boolean;
    missing_keywords: string[];
  } | null>(null);

  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    selected_cv: null as CV | null,
  });

  const [rateLimit, setRateLimit] = useState({
    used: 0,
    limit: 50,
    remaining: 50,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: cvsData } = await supabase
        .from("cvs")
        .select("id, file_name, version, ats_score, file_url")
        .eq("user_id", user.id)
        .eq("status", "processed")
        .order("version", { ascending: false });

      setCvs(cvsData || []);

      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("emails_sent")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today);

      setRateLimit({
        used: count || 0,
        limit: 50,
        remaining: 50 - (count || 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selected_cv) {
      setError("Please select a CV");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Get the Public URL for the CV from Supabase Storage
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from("cvs") // bucket name
        .createSignedUrl(formData.selected_cv.file_url, 600); // expires in 60 sec

      if (signedError) {
        console.error("Signed URL Error:", signedError);
        throw new Error(signedError.message);
      }

      if (!signedUrlData?.signedUrl) {
        throw new Error("Signed URL not returned");
      }

      const cvSecureUrl = signedUrlData.signedUrl;

      // 2. Call our FastAPI Agent
      const aiResult = await startCvOptimization({
        userId: user.id,
        userEmail: user.email!,
        cvPath: cvSecureUrl,
        jobInput: formData.job_description,
        // jobTitle: formData.job_title
      });

      setResult({
        match_score: aiResult.match_score,
        pdf_url: aiResult.pdf_url,
        email_sent: aiResult.email_sent,
        missing_keywords: aiResult.missing_keywords,
      });

      // Refresh limit
      fetchData();
    } catch (err: any) {
      setError(err.message || "The AI Agent encountered an error.");
    } finally {
      setIsProcessing(false);
    }

  };

  const getOptimizedCvLink = async (pdfUrl: string) => {
    try {
      const { data, error } = await supabase.storage.from("cvs").createSignedUrl(pdfUrl, 600);
      if (error) {
        throw error;
      }
      setNewOptimizedCvUrl(data?.signedUrl || null);
      return data?.signedUrl || null;
    } catch (err) {
      console.error("Error generating signed URL for optimized CV:", err);
      return null;
    }

  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 text-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="h-7 w-7 text-blue-600" />
            AI Application Engine
          </h1>
          <p className="text-sm text-gray-500">
            Optimize, Render, and Apply in one click.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Daily Limit
          </span>
          <p className="text-sm font-bold text-gray-900">
            {rateLimit.used} / {rateLimit.limit}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleRunAIEngine}
            className="bg-white shadow rounded-xl p-6 space-y-6 border border-gray-100"
          >
            {/* CV Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                1. Select Base CV
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cvs.map((cv) => (
                  <button
                    key={cv.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, selected_cv: cv })
                    }
                    className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      formData.selected_cv?.id === cv.id
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate">
                            {cv.file_name}
                          </span>

                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            v{cv.version}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-900 block">
                2. Job Information
              </label>
              <input
                type="text"
                placeholder="Job Title (e.g. Machine Learning Engineer)"
                className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Paste Job Description or URL here..."
                rows={8}
                className="w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.job_description}
                onChange={(e) =>
                  setFormData({ ...formData, job_description: e.target.value })
                }
                required
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isProcessing || rateLimit.remaining <= 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Agents working...
                </>
              ) : (
                <>
                  <CommandLineIcon className="h-5 w-5" />
                  Run AI Pipeline
                </>
              )}
            </button>
          </form>

          {/* Success Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                    <CheckCircleIcon className="h-6 w-6" />
                    Pipeline Complete!
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                      <p className="text-xs text-gray-500 uppercase">
                        Match Score
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        {result.match_score}%
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-100">
                      <p className="text-xs text-gray-500 uppercase">
                        Email Status
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {result.email_sent
                          ? "Sent to Company"
                          : "Sent to your Inbox"}
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={newOptimizedCvUrl || "#"}
                  onClick={() => getOptimizedCvLink(result.pdf_url)}
                  target={'_blank'}                  
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 pointer"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  View Optimized CV
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <XCircleIcon className="h-5 w-5" />
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Status & History */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <div className="bg-gray-900 rounded-xl p-6 text-white shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Agent Pipeline Status
            </h3>
            <div className="space-y-4">
              <StatusStep
                label="Analyzing Job"
                active={isProcessing}
                completed={!!result}
              />
              <StatusStep
                label="Optimizing Keywords"
                active={isProcessing}
                completed={!!result}
              />
              <StatusStep
                label="Rendering Tailwind Layout"
                active={isProcessing}
                completed={!!result}
              />
              <StatusStep
                label="Generating PDF & Upload"
                active={isProcessing}
                completed={!!result}
              />
              <StatusStep
                label="Gmail Delivery"
                active={isProcessing}
                completed={!!result}
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Quick Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-3">
              <li className="flex gap-2">
                <span>1.</span> Paste the job description or a link to a job
                posting.
              </li>
              <li className="flex gap-2">
                <span>2.</span> The AI will optimize your CV content
                specifically for that role.
              </li>
              <li className="flex gap-2">
                <span>3.</span> It will then create a professional A4 PDF and
                send it to the employer automatically.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for the Pipeline Sidebar
function StatusStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {completed ? (
        <CheckCircleIcon className="h-5 w-5 text-green-400" />
      ) : active ? (
        <ArrowPathIcon className="h-5 w-5 text-blue-400 animate-spin" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-gray-700" />
      )}
      <span
        className={`text-sm ${completed ? "text-gray-300" : active ? "text-white font-medium" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
