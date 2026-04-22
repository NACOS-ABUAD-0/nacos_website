// frontend/src/pages/forgot-password.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../lib/api";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]           = useState("");
  const [matric, setMatric]         = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Email is required."); return; }
    setError("");
    setIsLoading(true);
    try {
      await authAPI.requestPasswordReset(email.trim().toLowerCase(), matric.trim());
      setSubmitted(true);
    } catch (err: any) {
      // Show field-level errors; ignore the vague "link will be sent" sentinel
      const msg =
        err?.email?.[0] ??
        err?.matric_number?.[0] ??
        err?.non_field_errors?.[0] ??
        "Something went wrong. Please try again.";
      if (!msg.includes("link will be sent")) setError(msg);
      else setSubmitted(true); // treat as success to prevent enumeration
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#E8F4F8] w-full justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        <div className="flex gap-4 justify-center mb-6">
          <img src="/images/nacos_logo.png" alt="NACOS" className="w-12" />
          <img src="/images/abuadLogo.png"  alt="ABUAD" className="w-12" />
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Check your email</h2>
            <p className="text-sm text-gray-600 mb-6">
              If this email is registered, we've sent a password-reset link.
              The link expires in <strong>1 hour</strong>.
            </p>
            <Link
              to="/login"
              className="text-green-600 hover:text-green-700 font-semibold text-sm"
            >
              ← Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Forgot password?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email (and optionally your matric number) to receive a reset link.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@university.edu"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matric Number <span className="text-gray-400 font-normal">(optional, for extra security)</span>
              </label>
              <input
                type="text"
                value={matric}
                onChange={(e) => setMatric(e.target.value)}
                placeholder="e.g. 23/SCI01/002"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400
                text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-3"
            >
              {isLoading ? "Sending…" : "Send Reset Link"}
            </button>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};