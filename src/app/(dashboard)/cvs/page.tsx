"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useDropzone } from "react-dropzone";
import { formatFileSize } from "@/lib/utils";

interface CV {
  id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  status: "processing" | "processed" | "failed";
  ats_score: number | null;
  version: number;
  created_at: string;
  structured_data: any | null;
  error_message: string | null;
  storage_path: string;
}

export default function CVsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch user's CVs
  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("version", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCvs(data || []);
    } catch (error) {
      console.error("Error fetching CVs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file
      if (file.type !== "application/pdf") {
        setUploadError("Please upload a PDF file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must be less than 10MB");
        return;
      }

      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 500);

        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // ✅ خزّن path فقط
        const { error: dbError } = await supabase.from("cvs").insert({
          user_id: user.id,
          file_url: fileName, // ✅ هنا الصح
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          status: "processed",
          version: (cvs[0]?.version || 0) + 1,
          structured_data: {
            file_name: file.name,
            upload_date: new Date().toISOString(),
            file_size: file.size,
          },
        });

        if (dbError) throw dbError;

        // Refresh CV list
        await fetchCVs();

        // Reset upload state
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      } catch (error: any) {
        console.error("Upload error:", error);
        setUploadError(error.message || "Failed to upload CV");
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [cvs, supabase],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  // Handle delete CV
  const handleDelete = async (cvId: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: files } = await supabase.storage
          .from("cvs")
          .list(user.id);

        const fileName = files?.find((f) => fileUrl.includes(f.name))?.name;

        if (fileName) {
          await supabase.storage.from("cvs").remove([`${user.id}/${fileName}`]);
        }
      }

      const { error } = await supabase.from("cvs").delete().eq("id", cvId);

      if (error) throw error;

      await fetchCVs();
    } catch (error) {
      console.error("Error deleting CV:", error);
      alert("Failed to delete CV");
    }
  };

  // Refresh signed URL before viewing
  const handleView = async (cv: CV) => {
    try {
      const { data: signedUrlData, error } = await supabase.storage
        .from("cvs")
        .createSignedUrl(cv.file_url, 3600);

      if (error) throw error;

      window.open(signedUrlData.signedUrl, "_blank");
    } catch (error) {
      console.error("Error generating view URL:", error);
      alert("Failed to open CV. Please try again.");
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "processing":
        return (
          <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
        );
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading your CVs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section - Matching dashboard */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My CVs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and manage your CVs. Each version is stored securely.
        </p>
      </div>

      {/* Stats Grid - Matching dashboard stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total CVs Stat */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Total CVs
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{cvs.length}</p>
            <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-500">
              v{cvs[0]?.version || 0}
            </p>
          </dd>
        </div>

        {/* Storage Used Stat */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-3">
              <CloudArrowUpIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Storage Used
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {formatFileSize(cvs.reduce((acc, cv) => acc + cv.file_size, 0))}
            </p>
          </dd>
        </div>

        {/* Processed CVs Stat */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-purple-500 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Processed
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {cvs.filter((cv) => cv.status === "processed").length}
            </p>
          </dd>
        </div>

        {/* Average ATS Score Stat */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-yellow-500 p-3">
              {/* <ChartBarIcon className="h-6 w-6 text-white" /> */}
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Avg ATS Score
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {cvs.filter((cv) => cv.ats_score).length > 0
                ? Math.round(
                    cvs.reduce((acc, cv) => acc + (cv.ats_score || 0), 0) /
                      cvs.filter((cv) => cv.ats_score).length,
                  )
                : "N/A"}
            </p>
          </dd>
        </div>
      </div>

      {/* Upload Card - Matching dashboard card style */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Upload New CV
          </h2>
          <div
            {...getRootProps()}
            className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : uploading
                  ? "border-gray-300 bg-gray-50 cursor-wait"
                  : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div>
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500 animate-bounce" />
                <p className="mt-2 text-sm text-gray-600">
                  Uploading... {uploadProgress}%
                </p>
                <div className="mt-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive
                    ? "Drop your CV here"
                    : "Drag and drop your CV here, or click to select"}
                </p>
                <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <XCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CV List Card - Matching dashboard card style */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your CVs</h2>

          {cvs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No CVs uploaded
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first CV above.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {cvs.map((cv) => (
                  <li key={cv.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {getStatusIcon(cv.status)}
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {cv.file_name}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-500">
                              Version {cv.version}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(cv.file_size)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(cv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleView(cv)}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(cv.id, cv.file_url)}
                          className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(cv.status)}`}
                        >
                          {cv.status}
                        </span>
                      </div>
                    </div>

                    {/* Show ATS score if available */}
                    {cv.ats_score && (
                      <div className="mt-2 ml-9">
                        <span className="text-xs text-gray-500">
                          ATS Score:{" "}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            cv.ats_score >= 80
                              ? "text-green-600"
                              : cv.ats_score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {cv.ats_score}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Matching dashboard quick actions */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/cvs"
              className="relative block rounded-lg border border-gray-300 p-4 hover:border-gray-400"
            >
              <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                Upload New Version
              </p>
              <p className="text-xs text-gray-500">
                Upload a new version of your CV
              </p>
            </a>
            <a
              href="/applications"
              className={`relative block rounded-lg border p-4 ${
                cvs.length > 0
                  ? "border-gray-300 hover:border-gray-400"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
            >
              {/* <PaperAirplaneIcon className={`h-6 w-6 ${cvs.length > 0 ? 'text-gray-400' : 'text-gray-300'}`} /> */}
              <p
                className={`mt-2 text-sm font-medium ${cvs.length > 0 ? "text-gray-900" : "text-gray-400"}`}
              >
                New Application
              </p>
              <p
                className={`text-xs ${cvs.length > 0 ? "text-gray-500" : "text-gray-400"}`}
              >
                {cvs.length > 0 ? "Apply to a new job" : "Upload a CV first"}
              </p>
            </a>
          </div>
        </div>
      </div>

      {/* Tips Card - Matching dashboard style */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Tips for Better ATS Scores
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Use Standard Headings
                </p>
                <p className="text-xs text-gray-500">
                  Experience, Education, Skills - keep it simple
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Include Keywords
                </p>
                <p className="text-xs text-gray-500">
                  Match keywords from job descriptions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Avoid Complex Formatting
                </p>
                <p className="text-xs text-gray-500">
                  No tables, columns, or fancy layouts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Use Text-Based PDF
                </p>
                <p className="text-xs text-gray-500">
                  Ensure your PDF is searchable, not scanned
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
