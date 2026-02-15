"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { formatFileSize } from "@/lib/utils";

interface Application {
  id: string;
  company_name: string;
  company_email: string;
  job_title: string | null;
  job_description: string | null;
  status: "pending" | "sent" | "failed" | "bounced";
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  cv_id: string | null;
  email_content: string | null;
  cv: {
    file_name: string;
    version: number;
  } | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    bounced: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, dateFilter]);

  const fetchApplications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch applications with CV details
      const { data, error } = await supabase
        .from("emails_sent")
        .select(`
          *,
          cv:cvs (
            file_name,
            version
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        sent: data?.filter((a) => a.status === "sent").length || 0,
        pending: data?.filter((a) => a.status === "pending").length || 0,
        failed: data?.filter((a) => a.status === "failed").length || 0,
        bounced: data?.filter((a) => a.status === "bounced").length || 0,
      };
      setStats(stats);

    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (app.job_title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          app.company_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

      filtered = filtered.filter((app) => {
        const appDate = new Date(app.created_at);
        switch (dateFilter) {
          case "today":
            return appDate >= today;
          case "week":
            return appDate >= weekAgo;
          case "month":
            return appDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredApplications(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "bounced":
        return <XCircleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "bounced":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading application history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Application History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all your job applications and their status.
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Sent</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-yellow-500 p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Pending</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-red-500 p-3">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Failed</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <dt>
            <div className="absolute rounded-md bg-orange-500 p-3">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Bounced</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stats.bounced}</p>
          </dd>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by company, job title, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <PaperAirplaneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {applications.length === 0
                ? "You haven't sent any applications yet."
                : "Try adjusting your filters."}
            </p>
            {applications.length === 0 && (
              <div className="mt-6">
                <a
                  href="/applications"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Send Your First Application
                </a>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredApplications.map((app) => (
              <li
                key={app.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(app.status)}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {app.company_name}
                        </p>
                        {app.job_title && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-sm text-gray-600 truncate">
                              {app.job_title}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <BuildingOfficeIcon className="h-3 w-3" />
                          {app.company_email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(app.created_at)}
                        </div>
                        {app.cv && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <DocumentTextIcon className="h-3 w-3" />
                            v{app.cv.version}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                    {app.sent_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(app.sent_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedApp?.id === app.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {/* Left Column - Details */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Application Details</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Company:</dt>
                            <dd className="text-gray-900">{app.company_name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Email:</dt>
                            <dd className="text-gray-900">{app.company_email}</dd>
                          </div>
                          {app.job_title && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Position:</dt>
                              <dd className="text-gray-900">{app.job_title}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Sent:</dt>
                            <dd className="text-gray-900">
                              {app.sent_at
                                ? new Date(app.sent_at).toLocaleString()
                                : "Not sent yet"}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">CV Version:</dt>
                            <dd className="text-gray-900">
                              {app.cv ? `v${app.cv.version}` : "Unknown"}
                            </dd>
                          </div>
                        </dl>

                        {app.error_message && (
                          <div className="mt-4 rounded-md bg-red-50 p-3">
                            <p className="text-xs font-medium text-red-800">Error:</p>
                            <p className="text-xs text-red-700 mt-1">{app.error_message}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Email Preview */}
                      {app.email_content && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Email Preview</h4>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-6">
                              {app.email_content}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center gap-3">
                      {app.status === "failed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Retry logic here
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                          <ArrowPathIcon className="h-3 w-3" />
                          Retry
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/applications?company=${encodeURIComponent(
                            app.company_name
                          )}`;
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <PaperAirplaneIcon className="h-3 w-3" />
                        Apply Again
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary Card */}
      {filteredApplications.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-700">
                Showing {filteredApplications.length} of {applications.length} applications
              </span>
            </div>
            <div className="text-xs text-blue-600">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}