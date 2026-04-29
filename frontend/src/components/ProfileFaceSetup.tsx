// frontend/src/components/ProfileFaceSetup.tsx

/**
 * ProfileFaceSetup — face-login enrollment section for the Profile page.
 *
 * States:
 *   • Disabled  → show "Enable Face Login" CTA
 *   • Enabled   → show status badge + "Re-enroll" / "Disable" actions
 *   • Enrolling → show <FaceCapture> camera UI
 */

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaceCapture } from "./FaceCapture";
import type { faceAuthService, FaceStatusResponse } from "../services/faceAuthService";

type PanelState = "loading" | "disabled" | "enabled" | "enrolling";

export const ProfileFaceSetup: React.FC = () => {
  const [panel, setPanel] = useState<PanelState>("loading");
  const [status, setStatus] = useState<FaceStatusResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch current status ───────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const data = await faceAuthService.getStatus();
      setStatus(data);
      setPanel(data.face_login_enabled ? "enabled" : "disabled");
    } catch {
      // Non-fatal: section simply won't render advanced info
      setPanel("disabled");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Handle captured frames → enroll ───────────────────────────────────────

  const handleCapture = useCallback(
    async (dataUrls: string[]) => {
      const toastId = toast.loading("Enrolling your face…");
      try {
        const res = await faceAuthService.register(dataUrls);
        toast.success(res.message, { id: toastId });
        await fetchStatus();
        if (res.warnings?.length) {
          res.warnings.forEach((w) => toast(w, { icon: "⚠️" }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Enrollment failed.";
        toast.error(msg, { id: toastId });
        setPanel(status?.face_login_enabled ? "enabled" : "disabled");
      }
    },
    [fetchStatus, status],
  );

  // ── Handle disable ─────────────────────────────────────────────────────────

  const handleDisable = useCallback(async () => {
    if (!window.confirm("Remove all face data and disable face login?")) return;
    setIsDeleting(true);
    try {
      const res = await faceAuthService.deleteFaceData();
      toast.success(res.message);
      await fetchStatus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not disable face login.");
    } finally {
      setIsDeleting(false);
    }
  }, [fetchStatus]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (panel === "loading") return null;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Face Login</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Sign in quickly using your face — no password needed
            </p>
          </div>
          {/* Status badge */}
          {panel === "enabled" && (
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Enabled
            </span>
          )}
          {panel === "disabled" && (
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
              Disabled
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* ── Disabled state ─────────────────────────────────────────── */}
        {panel === "disabled" && (
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm mb-4">
              Enroll your face to enable fast, password-free login. You can always
              fall back to email + password login.
            </p>
            <ul className="text-left text-sm text-gray-500 mb-6 space-y-1 max-w-sm mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Only numeric embeddings stored — no images saved
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Takes under 30 seconds to set up
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> You can disable it any time
              </li>
            </ul>
            <button
              onClick={() => setPanel("enrolling")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Enable Face Login
            </button>
          </div>
        )}

        {/* ── Enabled state ──────────────────────────────────────────── */}
        {panel === "enabled" && status && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.embeddings_count}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Face sample{status.embeddings_count !== 1 ? "s" : ""} stored
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {status.max_embeddings}
                </div>
                <div className="text-xs text-gray-500 mt-1">Maximum samples</div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Raw images are never stored — only mathematical face embeddings.
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setPanel("enrolling")}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
              >
                Re-enroll Face
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Removing…" : "Disable & Remove"}
              </button>
            </div>
          </div>
        )}

        {/* ── Enrolling state ────────────────────────────────────────── */}
        {panel === "enrolling" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-1">Face Enrollment</h3>
              <p className="text-sm text-gray-500">
                We'll capture 3 photos to build an accurate face profile.
                Look directly at the camera, ensure good lighting, and blink
                once slowly when you're ready.
              </p>
            </div>

            <FaceCapture
              captureCount={3}
              instruction="Look straight at the camera and blink once slowly when ready."
              onCapture={(urls) => {
                setPanel(status?.face_login_enabled ? "enabled" : "disabled");
                handleCapture(urls);
              }}
              onCancel={() =>
                setPanel(status?.face_login_enabled ? "enabled" : "disabled")
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};