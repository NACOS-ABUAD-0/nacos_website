// frontend/src/pages/reset-password.tsx
import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authAPI } from "../lib/api";

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const colors = ["bg-red-400", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: s, color: colors[s], label: labels[s] };
}

export const ResetPasswordPage: React.FC = () => {
  const [params]        = useSearchParams();
  const navigate        = useNavigate();
  const uid             = params.get("uid")   ?? "";
  const token           = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors,    setErrors]    = useState<{ password?: string; password2?: string }>({});

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex bg-[#E8F4F8] justify-center items-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium mb-4">
            Invalid or missing reset link. Please request a new one.
          </p>
          <Link to="/forgot-password" className="text-green-600 font-semibold text-sm">
            Request new link →
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!password)                         newErrors.password  = "Password is required.";
    if (password.length > 0 && password.length < 8)
                                           newErrors.password  = "Minimum 8 characters.";
    if (password !== password2)            newErrors.password2 = "Passwords do not match.";
    if (Object.keys(newErrors).length)     { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await authAPI.confirmPasswordReset(uid, token, password, password2);
      toast.success("Password reset! Please sign in with your new password.");
      navigate("/login");
    } catch (err: any) {
      const msg =
        err?.token?.[0] ?? err?.uid?.[0] ??
        err?.password?.[0] ?? err?.non_field_errors?.[0] ??
        "Reset failed. The link may have expired.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getStrength(password);

  return (
    <div className="min-h-screen flex bg-[#E8F4F8] w-full justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
        <div className="flex gap-4 justify-center mb-6">
          <img src="/images/nacos_logo.png" alt="NACOS" className="w-12" />
          <img src="/images/abuadLogo.png"  alt="ABUAD" className="w-12" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">Set new password</h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose a strong password for your NACOS ABUAD account.
        </p>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
            autoComplete="new-password"
            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 h-1">
                {[1,2,3,4].map((n) => (
                  <div key={n} className={`flex-1 rounded-full ${n <= strength.score ? strength.color : "bg-gray-200"}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={password2}
            onChange={(e) => { setPassword2(e.target.value); setErrors((p) => ({ ...p, password2: undefined })); }}
            placeholder="Re-enter your password"
            disabled={isLoading}
            autoComplete="new-password"
            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.password2 ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400
            text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
        >
          {isLoading ? "Resetting…" : "Reset Password"}
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-green-600 hover:text-green-700 font-semibold">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};