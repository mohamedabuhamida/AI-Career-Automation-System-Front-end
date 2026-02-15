import Link from "next/link";
import Image from "next/image";
import {
  RocketLaunchIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Career AI
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  How it Works
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Pricing
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Testimonials
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative isolate pt-24">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-200 to-blue-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Automate Your Job Applications with{" "}
              <span className="text-blue-600">AI-Powered Precision</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Stop copy-pasting. Let AI tailor your CV and cover letters for
              every job application. Get more interviews with less effort.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start Free Trial
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Watch Demo <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="mt-10 flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                14-day free trial
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 flow-root sm:mt-24">
            <div className="relative -m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <Image
                src={"/dashboard.png"}
                alt="App screenshot"
                width={2432}
                height={1442}
                className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Smart Automation
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to land your dream job
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our AI agents work together to optimize your applications and save
              you hours of manual work.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Simple Process
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Three steps to automated applications
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.name} className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">
                    {step.name}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ATS Scoring Preview */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            <div>
              <h2 className="text-base font-semibold leading-7 text-blue-600">
                Beat the Bots
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Optimize for ATS systems
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our AI analyzes your CV against job descriptions and provides an
                ATS score. Get recommendations to improve your chances of
                getting past automated filters.
              </p>
              <div className="mt-10 space-y-4">
                {atsFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 text-gray-600">
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    ATS Compatibility Score
                  </h3>
                  <span className="text-3xl font-bold text-blue-600">85%</span>
                </div>
                <div className="mt-4 h-4 w-full rounded-full bg-gray-200">
                  <div className="h-4 w-[85%] rounded-full bg-blue-600" />
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Keywords matched</span>
                    <span className="font-medium">24/30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Format compatibility</span>
                    <span className="font-medium">Excellent</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Missing sections</span>
                    <span className="font-medium">2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              Pricing
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Plans for every job seeker
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                  plan.featured ? "ring-2 ring-blue-600" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    className={`text-lg font-semibold leading-8 ${plan.featured ? "text-blue-600" : "text-gray-900"}`}
                  >
                    {plan.name}
                  </h3>
                  {plan.featured && (
                    <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    /month
                  </span>
                </p>
                <Link
                  href="/login"
                  className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.featured
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Get started today
                </Link>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckBadgeIcon
                        className="h-6 w-5 flex-none text-blue-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-lg font-semibold leading-8 tracking-tight text-blue-600">
              Testimonials
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by job seekers
            </p>
          </div>
          <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.author}
                  className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200"
                >
                  <div className="flex items-center gap-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-600">"{testimonial.content}"</p>
                  <div className="mt-4 flex text-blue-600">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to accelerate your job search?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of job seekers who are landing interviews with
              AI-powered applications.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="text-sm font-semibold leading-6 text-white"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Career AI</h3>
              <p className="mt-4 text-sm text-gray-400">
                AI-powered job application automation to help you land your
                dream job faster.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Product</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    How it Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Company</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-400">
              &copy; 2024 Career AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Data for features
const features = [
  {
    name: "AI CV Optimization",
    description:
      "Our AI analyzes job descriptions and automatically tailors your CV to highlight the most relevant skills and experience.",
    icon: DocumentTextIcon,
  },
  {
    name: "Smart Cover Letters",
    description:
      "Generate personalized cover letters in seconds that capture your unique voice and match the company culture.",
    icon: EnvelopeIcon,
  },
  {
    name: "ATS Scoring",
    description:
      "Get real-time ATS compatibility scores and recommendations to ensure your application gets past automated filters.",
    icon: ChartBarIcon,
  },
  {
    name: "Bulk Applications",
    description:
      "Apply to multiple jobs at once while maintaining personalization. Our AI handles the heavy lifting.",
    icon: BoltIcon,
  },
  {
    name: "Email Tracking",
    description:
      "Track when your emails are opened and get notified when recruiters view your application.",
    icon: ClockIcon,
  },
  {
    name: "Secure & Private",
    description:
      "Your data is encrypted and never shared. We use bank-level security to protect your information.",
    icon: ShieldCheckIcon,
  },
];

const steps = [
  {
    name: "Upload Your CV",
    description:
      "Upload your existing CV once. Our AI parses and structures it for optimal processing.",
  },
  {
    name: "Paste Job Description",
    description:
      "Simply paste the job description and company details. Our AI analyzes the requirements.",
  },
  {
    name: "Send Applications",
    description:
      "Review and send tailored applications directly from your Gmail account with one click.",
  },
];

const atsFeatures = [
  "Keyword optimization based on job description",
  "Format validation for major ATS systems",
  "Missing skills identification",
  "Experience relevance scoring",
  "Formatting recommendations",
];

const pricingPlans = [
  {
    name: "Basic",
    description: "Perfect for occasional job seekers",
    price: "19",
    features: [
      "10 applications per month",
      "CV optimization",
      "Basic ATS scoring",
      "Email templates",
    ],
    featured: false,
  },
  {
    name: "Pro",
    description: "For active job seekers",
    price: "39",
    features: [
      "50 applications per month",
      "Advanced CV optimization",
      "Detailed ATS analysis",
      "Cover letter generation",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For recruiters and teams",
    price: "99",
    features: [
      "Unlimited applications",
      "Team collaboration",
      "API access",
      "Custom AI training",
      "Dedicated account manager",
    ],
    featured: false,
  },
];

const testimonials = [
  {
    author: "Sarah Johnson",
    role: "Marketing Manager",
    content:
      "Career AI helped me land 3 interviews in my first week! The CV optimization is incredible - it identified keywords I was missing and helped me tailor my applications perfectly.",
  },
  {
    author: "Michael Chen",
    role: "Software Engineer",
    content:
      "The ATS scoring feature is a game-changer. I went from zero callbacks to multiple interviews after optimizing my CV based on the recommendations.",
  },
  {
    author: "Emily Rodriguez",
    role: "Product Designer",
    content:
      "I was spending hours customizing cover letters. Now it takes minutes. The quality is amazing and it feels like it really understands my voice.",
  },
];
