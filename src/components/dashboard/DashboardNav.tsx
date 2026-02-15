"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface GoogleToken {
  id: string;
  expires_at: string;
  created_at: string;
}

interface DashboardNavProps {
  user: User;
  hasCV: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  current: boolean;
  disabled?: boolean;
}

export default function DashboardNav({ user, hasCV }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [googleToken, setGoogleToken] = useState<GoogleToken | null>(null);

  useEffect(() => {
    if (googleToken) {
      checkGmailStatus();
    }
  }, [googleToken]);

  const checkGmailStatus = async () => {
    try {
      await fetch("/api/gmail/check");
    } catch (error) {
      console.error("Error checking Gmail status:", error);
    }
  };

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname === "/dashboard",
    },
    {
      name: "My CVs",
      href: "/cvs",
      icon: DocumentTextIcon,
      current: pathname.startsWith("/cvs"),
    },
    {
      name: "Applications",
      href: "/applications",
      icon: PaperAirplaneIcon,
      current: pathname.startsWith("/applications"),
      disabled: !hasCV,
    },
    {
      name: "History",
      href: "/history",
      icon: ClockIcon,
      current: pathname.startsWith("/history"),
    },
  ];

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-blue-600"
              >
                Career AI
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.disabled ? "#" : item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    item.current
                      ? "border-b-2 border-blue-500 text-gray-900"
                      : item.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  aria-disabled={item.disabled}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      // You could show a toast notification here
                      alert("Please upload a CV first to access applications");
                    }
                  }}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Profile dropdown */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative ml-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.email || ""}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              {/* Profile dropdown menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.disabled ? "#" : item.href}
                className={`block py-2 pl-3 pr-4 text-base font-medium ${
                  item.current
                    ? "border-l-4 border-blue-500 bg-blue-50 text-blue-700"
                    : item.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "border-l-4 border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                }`}
                aria-disabled={item.disabled}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    alert("Please upload a CV first to access applications");
                  }
                }}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile user menu */}
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.email || ""}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user.user_metadata?.full_name || "User"}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Warning Banner (if no CV) */}
      {!hasCV && pathname !== "/cvs" && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700">
                  You haven't uploaded a CV yet. Upload your CV to start
                  applying for jobs!
                </p>
              </div>
              <Link
                href="/cvs"
                className="text-sm font-medium text-yellow-700 hover:text-yellow-600 hover:underline"
              >
                Upload CV →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
