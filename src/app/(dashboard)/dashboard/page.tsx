import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  DocumentTextIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's CVs
  const { data: cvs } = await supabase
    .from("cvs")
    .select("*")
    .eq("user_id", user.id
)
    .order("created_at", { ascending: false });

  // Get recent applications
  const { data: recentEmails } = await supabase
    .from("emails_sent")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestCV = cvs?.[0];
  const totalApplications = recentEmails?.length || 0;
  const successfulApplications =
    recentEmails?.filter((e) => e.status === "sent").length || 0;

  const stats = [
    {
      name: "Total Applications",
      value: totalApplications,
      icon: PaperAirplaneIcon,
      change: "+4.75%",
      changeType: "positive",
    },
    {
      name: "Successful Sends",
      value: successfulApplications,
      icon: ChartBarIcon,
      change: `${totalApplications ? Math.round((successfulApplications / totalApplications) * 100) : 0}%`,
      changeType: "positive",
    },
    {
      name: "CV Versions",
      value: cvs?.length || 0,
      icon: DocumentTextIcon,
      change: latestCV ? `v${latestCV.version}` : "0",
      changeType: "neutral",
    },
    {
      name: "Pending",
      value: recentEmails?.filter((e) => e.status === "pending").length || 0,
      icon: ClockIcon,
      change: "",
      changeType: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user.user_metadata?.full_name || "User"}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your job application activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              )}
            </dd>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Latest CV Card */}
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Latest CV</h2>
            {latestCV ? (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {latestCV.file_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded{" "}
                      {new Date(latestCV.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {latestCV.ats_score && (
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-blue-600">
                        {latestCV.ats_score}
                      </p>
                      <p className="text-xs text-gray-500">ATS Score</p>
                    </div>
                  )}
                </div>
                {latestCV.status === "processing" && (
                  <p className="mt-2 text-sm text-yellow-600">Processing...</p>
                )}
              </div>
            ) : (
              <div className="mt-4 text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No CV
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading your CV.
                </p>
                <div className="mt-6">
                  <a
                    href="/cvs"
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Upload CV
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications Card */}
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Applications
            </h2>
            {recentEmails && recentEmails.length > 0 ? (
              <div className="mt-4 flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentEmails.map((email) => (
                    <li key={email.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.company_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {email.job_title || "Position not specified"}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              email.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : email.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {email.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(email.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 text-center py-8">
                <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No applications yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start applying for jobs once you've uploaded your CV.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/cvs"
              className="relative block rounded-lg border border-gray-300 p-4 hover:border-gray-400"
            >
              <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                Upload New CV
              </p>
              <p className="text-xs text-gray-500">
                Upload and analyze a new version of your CV
              </p>
            </a>
            <a
              href="/applications"
              className={`relative block rounded-lg border p-4 ${
                latestCV
                  ? "border-gray-300 hover:border-gray-400"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
            >
              <PaperAirplaneIcon
                className={`h-6 w-6 ${latestCV ? "text-gray-400" : "text-gray-300"}`}
              />
              <p
                className={`mt-2 text-sm font-medium ${latestCV ? "text-gray-900" : "text-gray-400"}`}
              >
                New Application
              </p>
              <p
                className={`text-xs ${latestCV ? "text-gray-500" : "text-gray-400"}`}
              >
                {latestCV ? "Apply to a new job" : "Upload a CV first"}
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
