"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { formatFileSize } from "@/lib/utils";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface GoogleToken {
  id: string;
  expires_at: string;
  created_at: string;
}

interface Stats {
  total_cvs: number;
  total_applications: number;
  storage_used: number;
  success_rate: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [gmailStatus, setGmailStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");
  const [googleToken, setGoogleToken] = useState<GoogleToken | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    total_cvs: 0,
    total_applications: 0,
    storage_used: 0,
    success_rate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Fetch user data
  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (googleToken) {
      checkGmailStatus();
    } else {
      setGmailStatus("invalid");
    }
  }, [googleToken]);

  const checkGmailStatus = async () => {
    try {
      const res = await fetch("/api/gmail/check");
      const data = await res.json();

      if (data.valid) {
        setGmailStatus("valid");
      } else {
        setGmailStatus("invalid");
      }
    } catch {
      setGmailStatus("invalid");
    }
  };

  const fetchProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditedName(profileData.full_name || "");

      // Fetch Google tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from("google_tokens")
        .select("id, expires_at, created_at")
        .eq("user_id", user.id)
        .single();

      if (!tokenError && tokenData) {
        setGoogleToken(tokenData);
      }

      // Fetch stats
      const [cvsCount, emailsCount, storageData] = await Promise.all([
        supabase
          .from("cvs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("emails_sent")
          .select("status", { count: "exact" })
          .eq("user_id", user.id),
        supabase.from("cvs").select("file_size").eq("user_id", user.id),
      ]);

      const totalCvs = cvsCount.count || 0;
      const totalEmails = emailsCount.count || 0;

      // Calculate success rate
      const { data: successfulEmails } = await supabase
        .from("emails_sent")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "sent");

      const successCount = successfulEmails?.length || 0;
      const successRate =
        totalEmails > 0 ? Math.round((successCount / totalEmails) * 100) : 0;

      // Calculate storage used
      const storageUsed =
        storageData.data?.reduce((acc, cv) => acc + (cv.file_size || 0), 0) ||
        0;

      setStats({
        total_cvs: totalCvs,
        total_applications: totalEmails,
        storage_used: storageUsed,
        success_rate: successRate,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Update profile name
  const handleUpdateName = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editedName })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: editedName });
      setIsEditing(false);
      setSuccess("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Disconnect Google account
  const handleDisconnectGoogle = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect your Google account? You won't be able to send emails until you reconnect.",
      )
    ) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found");
        return;
      }

      const { error } = await supabase
        .from("google_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setGoogleToken(null);
      setSuccess("Google account disconnected successfully");
    } catch (error: any) {
      console.error("Error disconnecting Google:", error);
      setError(error.message || "Failed to disconnect Google account");
    } finally {
      setDisconnecting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and connected services.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total CVs */}
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
            <p className="text-2xl font-semibold text-gray-900">
              {stats.total_cvs}
            </p>
          </dd>
        </div>

        {/* Total Applications */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-3">
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Applications Sent
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {stats.total_applications}
            </p>
          </dd>
        </div>

        {/* Success Rate */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-purple-500 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Success Rate
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {stats.success_rate}%
            </p>
          </dd>
        </div>

        {/* Storage Used */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-yellow-500 p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">
              Storage Used
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {formatFileSize(stats.storage_used)}
            </p>
          </dd>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Personal Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdateName}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(profile?.full_name || "");
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profile"}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Your full name"
                  />
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-900">
                      {profile?.full_name || "No name set"}
                    </p>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </>
                )}
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex items-center gap-2 text-sm">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">{profile?.email}</span>
              <span className="text-xs text-gray-400">(verified)</span>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">
                Member since {profile && formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Card */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Connected Accounts
          </h2>

          {/* Google Account */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <GlobeAltIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Google</p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  {gmailStatus === "checking" && (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                      Checking connection...
                    </>
                  )}

                  {gmailStatus === "valid" && (
                    <>
                      Connected since{" "}
                      {googleToken && formatDate(googleToken.created_at)}
                      <span className="ml-2 text-green-600 font-medium">
                        ● Active
                      </span>
                    </>
                  )}

                  {gmailStatus === "invalid" && googleToken && (
                    <>
                      Connected since {formatDate(googleToken.created_at)}
                      <span className="ml-2 text-red-600 font-medium">
                        ● Reconnect required
                      </span>
                    </>
                  )}

                  {!googleToken && gmailStatus !== "checking" && (
                    <>Not connected</>
                  )}
                </p>
              </div>
            </div>

            {googleToken ? (
              <button
                onClick={handleDisconnectGoogle}
                disabled={disconnecting}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50 disabled:opacity-50"
              >
                {disconnecting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4" />
                    Disconnect
                  </>
                )}
              </button>
            ) : (
              <a
                href="/login"
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Connect
              </a>
            )}
          </div>

        </div>
      </div>

      {/* Security Settings Card */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>

          <div className="space-y-4">
            {/* Password (if email auth) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">
                    Last changed 30 days ago
                  </p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Change
              </button>
            </div>

            {/* Two Factor Authentication */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-gray-500">
                    Add an extra layer of security
                  </p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg bg-white shadow border border-red-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>

          <div className="space-y-4">
            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Delete Account
                </p>
                <p className="text-xs text-gray-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
