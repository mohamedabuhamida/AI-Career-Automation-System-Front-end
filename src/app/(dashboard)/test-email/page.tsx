'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PaperAirplaneIcon, EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function TestEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    details?: any
  } | null>(null)
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email from JobAI',
    body: 'This is a test email to verify Gmail integration is working correctly.'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Email sent successfully!',
          details: data
        })
        // Clear form on success
        setFormData(prev => ({
          ...prev,
          to: '',
          subject: 'Test Email from JobAI',
          body: 'This is a test email to verify Gmail integration is working correctly.'
        }))
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send email',
          details: data
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error',
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Test Email Integration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Send a test email to verify your Gmail integration is working correctly.
          </p>
        </div>
      </div>

      {/* Token Status Check */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
            Gmail Connection Status
          </h3>
          <TokenStatus />
        </div>
      </div>

      {/* Test Email Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="to" className="block text-sm font-medium leading-6 text-gray-900">
                To Email Address
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  name="to"
                  id="to"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="recipient@example.com"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium leading-6 text-gray-900">
                Subject
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium leading-6 text-gray-900">
                Email Body
              </label>
              <div className="mt-2">
                <textarea
                  name="body"
                  id="body"
                  rows={5}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                />
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`rounded-md p-4 ${
                result.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </h3>
                    {result.details && (
                      <div className="mt-2 text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Test Buttons */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => setFormData({
            to: formData.to,
            subject: 'Job Application: Software Engineer Position',
            body: `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company. With my background in full-stack development and passion for creating efficient solutions, I believe I would be a great addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my skills align with your needs.

Best regards,
[Your Name]`
          })}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Load Sample Application
        </button>
        
        <button
          onClick={() => setFormData({
            to: formData.to,
            subject: 'Thank You for Your Time',
            body: `Dear [Name],

Thank you for taking the time to speak with me today about the [Position] role. I truly enjoyed learning more about the team and the exciting projects at [Company].

Our conversation confirmed my interest in this position, and I am confident that my skills in [Skill 1] and [Skill 2] would allow me to contribute meaningfully to your team.

I look forward to hearing from you about the next steps.

Best regards,
[Your Name]`
          })}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Load Sample Follow-up
        </button>
      </div>
    </div>
  )
}

// Component to check token status
function TokenStatus() {
  const [status, setStatus] = useState<
    "checking" | "valid" | "invalid" | "error"
  >("checking");

  const [details, setDetails] = useState<any>(null);

  const checkGmailStatus = async () => {
    setStatus("checking");

    try {
      const res = await fetch("/api/gmail/check", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }

      setDetails(data);
    } catch (err) {
      setStatus("error");
    }
  };

  useEffect(() => {
    checkGmailStatus();
  }, []);

  if (status === "checking") {
    return (
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <svg
          className="animate-spin h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Checking Gmail connection...
      </div>
    );
  }

  if (status === "valid") {
    return (
      <div className="mt-2">
        <div className="flex items-center text-sm text-green-600">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          ✓ Gmail connected successfully
        </div>

        {details?.email && (
          <p className="mt-1 text-xs text-gray-500">
            Connected account: {details.email}
          </p>
        )}
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="mt-2">
        <div className="flex items-center text-sm text-yellow-600">
          <XCircleIcon className="h-4 w-4 mr-1" />
          No valid Gmail connection found
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Please reconnect your Google account with Gmail permissions.
        </p>

        <button
          onClick={() => (window.location.href = "/api/auth/google")}
          className="mt-2 text-xs text-blue-600 underline"
        >
          Reconnect Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 text-sm text-red-600">
      Error checking connection status
    </div>
  );
}
