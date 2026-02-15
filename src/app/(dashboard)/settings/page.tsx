"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BellIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  LanguageIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Switch } from "@headlessui/react";

interface Settings {
  // Notification Settings
  emailNotifications: boolean;
  applicationUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  
  // Application Settings
  defaultCVId: string | null;
  signature: string;
  replyToEmail: string;
  bccEmail: string;
  
  // Template Settings
  emailTemplate: "professional" | "friendly" | "concise";
  includeATSKeywords: boolean;
  autoOptimizeCV: boolean;
  
  // Privacy Settings
  shareAnalytics: boolean;
  keepHistory: boolean;
  autoDeleteAfter: number | null; // days
  
  // Appearance
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
}

interface CV {
  id: string;
  file_name: string;
  version: number;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
];

const TIMEZONES = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00",
  "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00", "UTC-02:00", "UTC-01:00",
  "UTC+00:00", "UTC+01:00", "UTC+02:00", "UTC+03:00", "UTC+04:00", "UTC+05:00",
  "UTC+06:00", "UTC+07:00", "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00",
  "UTC+12:00", "UTC+13:00", "UTC+14:00",
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("notifications");
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    applicationUpdates: true,
    marketingEmails: false,
    weeklyReports: true,
    defaultCVId: null,
    signature: "\n\nBest regards,\n[Your Name]",
    replyToEmail: "",
    bccEmail: "",
    emailTemplate: "professional",
    includeATSKeywords: true,
    autoOptimizeCV: true,
    shareAnalytics: true,
    keepHistory: true,
    autoDeleteAfter: null,
    theme: "system",
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC+00:00",
  });

  // Fetch user data and settings
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

      // Fetch user's CVs
      const { data: cvsData, error: cvsError } = await supabase
        .from("cvs")
        .select("id, file_name, version")
        .eq("user_id", user.id)
        .eq("status", "processed")
        .order("version", { ascending: false });

      if (cvsError) throw cvsError;
      setCvs(cvsData || []);

      // TODO: Fetch settings from a settings table
      // For now, we'll use defaults or load from localStorage
      const savedSettings = localStorage.getItem("user_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save to localStorage for now
      // TODO: Save to a settings table in Supabase
      localStorage.setItem("user_settings", JSON.stringify(settings));
      
      setSuccess("Settings saved successfully");
      
      // Apply theme
      applyTheme(settings.theme);
      
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setError(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const resetToDefaults = () => {
    setSettings({
      emailNotifications: true,
      applicationUpdates: true,
      marketingEmails: false,
      weeklyReports: true,
      defaultCVId: cvs[0]?.id || null,
      signature: "\n\nBest regards,\n[Your Name]",
      replyToEmail: "",
      bccEmail: "",
      emailTemplate: "professional",
      includeATSKeywords: true,
      autoOptimizeCV: true,
      shareAnalytics: true,
      keepHistory: true,
      autoDeleteAfter: null,
      theme: "system",
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC+00:00",
    });
  };

  const tabs = [
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "applications", name: "Applications", icon: EnvelopeIcon },
    { id: "templates", name: "Email Templates", icon: DocumentTextIcon },
    { id: "privacy", name: "Privacy & Data", icon: ShieldCheckIcon },
    { id: "appearance", name: "Appearance", icon: PaintBrushIcon },
    { id: "language", name: "Language & Region", icon: GlobeAltIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account preferences and configuration.
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

      {/* Settings Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white shadow">
            <div className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <tab.icon className={`h-5 w-5 ${
                        activeTab === tab.id ? "text-blue-700" : "text-gray-400"
                      }`} />
                      {tab.name}
                    </div>
                    <ChevronRightIcon className={`h-4 w-4 ${
                      activeTab === tab.id ? "text-blue-700" : "text-gray-400"
                    }`} />
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="rounded-lg bg-white shadow">
            <div className="p-6">
              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                        className={`${
                          settings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.emailNotifications ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Application Updates</p>
                        <p className="text-xs text-gray-500">Get notified when applications are sent or fail</p>
                      </div>
                      <Switch
                        checked={settings.applicationUpdates}
                        onChange={(checked) => setSettings({ ...settings, applicationUpdates: checked })}
                        disabled={!settings.emailNotifications}
                        className={`${
                          settings.applicationUpdates && settings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          !settings.emailNotifications && "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`${
                            settings.applicationUpdates ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                        <p className="text-xs text-gray-500">Receive weekly summary of your activity</p>
                      </div>
                      <Switch
                        checked={settings.weeklyReports}
                        onChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                        disabled={!settings.emailNotifications}
                        className={`${
                          settings.weeklyReports && settings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          !settings.emailNotifications && "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`${
                            settings.weeklyReports ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                        <p className="text-xs text-gray-500">Receive tips and product updates</p>
                      </div>
                      <Switch
                        checked={settings.marketingEmails}
                        onChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
                        className={`${
                          settings.marketingEmails ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.marketingEmails ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>
              )}

              {/* Applications Tab */}
              {activeTab === "applications" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Application Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default CV
                      </label>
                      <select
                        value={settings.defaultCVId || ""}
                        onChange={(e) => setSettings({ ...settings, defaultCVId: e.target.value || null })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        <option value="">Always ask</option>
                        {cvs.map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            {cv.file_name} (v{cv.version})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose which CV to use by default for new applications
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Signature
                      </label>
                      <textarea
                        value={settings.signature}
                        onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                        rows={3}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Your email signature..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reply-To Email
                      </label>
                      <input
                        type="email"
                        value={settings.replyToEmail}
                        onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="reply@example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        If blank, your Gmail address will be used
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BCC Email
                      </label>
                      <input
                        type="email"
                        value={settings.bccEmail}
                        onChange={(e) => setSettings({ ...settings, bccEmail: e.target.value })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="bcc@example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Get a copy of all sent applications
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === "templates" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Email Template Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Template Style
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                          { id: "professional", name: "Professional", description: "Formal and business-like" },
                          { id: "friendly", name: "Friendly", description: "Warm and approachable" },
                          { id: "concise", name: "Concise", description: "Short and to the point" },
                        ].map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => setSettings({ ...settings, emailTemplate: template.id as any })}
                            className={`relative rounded-lg border p-4 text-left ${
                              settings.emailTemplate === template.id
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">{template.name}</p>
                            <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Include ATS Keywords</p>
                        <p className="text-xs text-gray-500">Automatically include keywords from job descriptions</p>
                      </div>
                      <Switch
                        checked={settings.includeATSKeywords}
                        onChange={(checked) => setSettings({ ...settings, includeATSKeywords: checked })}
                        className={`${
                          settings.includeATSKeywords ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.includeATSKeywords ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Auto-Optimize CV</p>
                        <p className="text-xs text-gray-500">Automatically optimize CV based on job description</p>
                      </div>
                      <Switch
                        checked={settings.autoOptimizeCV}
                        onChange={(checked) => setSettings({ ...settings, autoOptimizeCV: checked })}
                        className={`${
                          settings.autoOptimizeCV ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.autoOptimizeCV ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Privacy & Data Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Share Anonymous Analytics</p>
                        <p className="text-xs text-gray-500">Help us improve by sharing usage data</p>
                      </div>
                      <Switch
                        checked={settings.shareAnalytics}
                        onChange={(checked) => setSettings({ ...settings, shareAnalytics: checked })}
                        className={`${
                          settings.shareAnalytics ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.shareAnalytics ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Keep Application History</p>
                        <p className="text-xs text-gray-500">Store your application history</p>
                      </div>
                      <Switch
                        checked={settings.keepHistory}
                        onChange={(checked) => setSettings({ ...settings, keepHistory: checked })}
                        className={`${
                          settings.keepHistory ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.keepHistory ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {settings.keepHistory && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auto-Delete History After
                        </label>
                        <select
                          value={settings.autoDeleteAfter || ""}
                          onChange={(e) => setSettings({ ...settings, autoDeleteAfter: e.target.value ? Number(e.target.value) : null })}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        >
                          <option value="">Keep forever</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="180">6 months</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Download Your Data</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Get a copy of all your data including CVs, applications, and settings.
                      </p>
                      <button className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <DocumentTextIcon className="h-4 w-4" />
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Appearance Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                          { id: "light", name: "Light", icon: SunIcon },
                          { id: "dark", name: "Dark", icon: MoonIcon },
                          { id: "system", name: "System", icon: ComputerDesktopIcon },
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setSettings({ ...settings, theme: theme.id as any })}
                            className={`relative rounded-lg border p-4 text-center ${
                              settings.theme === theme.id
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <theme.icon className={`h-6 w-6 mx-auto ${
                              settings.theme === theme.id ? "text-blue-600" : "text-gray-400"
                            }`} />
                            <p className="mt-2 text-sm font-medium text-gray-900">{theme.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === "language" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Language & Region</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LanguageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={settings.language}
                          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                          className="block w-full pl-10 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="block w-full pl-10 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Reset to defaults
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary Card */}
      <div className="rounded-lg bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <SparklesIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Your Settings Summary</h3>
            <p className="mt-1 text-xs text-blue-700">
              {settings.emailNotifications ? "📧 Email notifications on" : "🔕 Email notifications off"} • 
              {" "}{settings.defaultCVId ? "📄 Default CV set" : "📄 No default CV"} • 
              {" "}🌐 {LANGUAGES.find(l => l.code === settings.language)?.name || "English"} • 
              {" "}{settings.theme === "system" ? "💻 System theme" : settings.theme === "dark" ? "🌙 Dark theme" : "☀️ Light theme"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}