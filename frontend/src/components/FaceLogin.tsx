// frontend/src/components/FaceLogin.tsx

/**
 * FaceLogin — face-based authentication tab for the Login page.
 *
 * Usage (in your login.tsx):
 *
 *   import { FaceLogin } from "../components/FaceLogin";
 *   ...
 *   <FaceLogin onSuccess={(data) => {
 *     // store tokens exactly like you do for password login
 *     localStorage.setItem("access_token", data.access);
 *     localStorage.setItem("refresh_token", data.refresh);
 *     login(data.user);            // call your AuthContext method
 *     navigate("/dashboard");
 *   }} />
 */

import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FaceCapture } from "./FaceCapture";
import type { faceAuthService, FaceLoginResponse } from "../lib/hooks/faceAuthService";

type LoginStep = "form" | "camera" | "processing";

interface FaceLoginProps {
  /** Called with the raw backend response on successful authentication. */
  onSuccess: (data: FaceLoginResponse) => void;
  /** Optional: shown below the component as a link */
  onSwitchToPassword?: () => void;
}

export const FaceLogin: React.FC<FaceLoginProps> = ({
  onSuccess,
  onSwitchToPassword,
}) => {
  const [step, setStep] = useState<LoginStep>("form");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // ── Validate email before opening camera ──────────────────────────────────

  const handleProceed = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setEmailError("Enter a valid email address.");
        return;
      }
      setEmailError("");
      setStep("camera");
    },
    [email],
  );

  // ── Handle captured frame → authenticate ──────────────────────────────────

  const handleCapture = useCallback(
    async (dataUrls: string[]) => {
      if (!dataUrls[0]) {
        toast.error("No image captured. Please try again.");
        setStep("form");
        return;
      }
      setStep("processing");
      try {
        const data = await faceAuthService.login(email.trim().toLowerCase(), dataUrls[0]);
        toast.success("Face recognised! Signing you in…");
        onSuccess(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Face login failed.";
        toast.error(msg);
        setStep("form"); // let user retry or switch to password
      }
    },
    [email, onSuccess],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Step 1 — email entry */}
      {step === "form" && (
        <form onSubmit={handleProceed} className="space-y-4">
          <div>
            <label
              htmlFor="face-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="face-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              autoComplete="email"
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Continue with Face
          </button>
        </form>
      )}

      {/* Step 2 — camera capture */}
      {step === "camera" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500 text-center">
            Signing in as <span className="font-medium text-gray-800">{email}</span>
          </p>
          <FaceCapture
            captureCount={1}
            instruction="Look straight at the camera and blink once slowly when ready."
            onCapture={handleCapture}
            onCancel={() => setStep("form")}
          />
        </div>
      )}

      {/* Step 3 — processing spinner */}
      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Verifying your face…</p>
        </div>
      )}

      {/* Switch to password login */}
      {onSwitchToPassword && step !== "processing" && (
        <p className="text-center text-sm text-gray-500">
          Or{" "}
          <button
            type="button"
            onClick={onSwitchToPassword}
            className="text-green-600 hover:underline font-medium"
          >
            use email + password
          </button>
        </p>
      )}
    </div>
  );
};