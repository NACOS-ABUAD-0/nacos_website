// frontend/src/components/RegisterFlow.tsx

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type AccountType = "student" | "staff";

interface StepState {
  accountType: AccountType;
  email: string;
  surname: string;
  otherNames: string;
  level: string;
  matricNumber: string;
  password: string;
  password2: string;
  verificationToken: string;
  studentInfo: { full_name: string; department: string } | null;
}

const LEVELS = ["100", "200", "300", "400"];

interface Props {
  onRegistered: () => void;
}

// ─── Password strength helper ───────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;

  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Too short",  color: "bg-red-400"    },
    1: { label: "Weak",       color: "bg-red-400"    },
    2: { label: "Fair",       color: "bg-yellow-400" },
    3: { label: "Good",       color: "bg-blue-400"   },
    4: { label: "Strong",     color: "bg-green-500"  },
  };
  return { score, ...map[score] };
}

// ─── Shared field component (matches existing form style) ───────────────────────

const Field: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}> = ({ label, type = "text", value, onChange, error, placeholder, disabled, autoComplete }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors
        focus:ring-2 focus:ring-green-500 focus:border-transparent
        ${error ? "border-red-400 bg-red-50" : "border-gray-300"}
        ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, options, placeholder, error, disabled }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors
        focus:ring-2 focus:ring-green-500 focus:border-transparent
        ${error ? "border-red-400 bg-red-50" : "border-gray-300"}
        ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
        ${value ? "text-gray-900" : "text-gray-400"}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-gray-900">{o.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Account Type Toggle ─────────────────────────────────────────────────────────

const AccountTypeToggle: React.FC<{
  value: AccountType;
  onChange: (v: AccountType) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a</label>
    <div className="grid grid-cols-2 gap-2">
      {(["student", "staff"] as AccountType[]).map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors duration-200
            ${value === type
              ? "bg-green-600 border-green-600 text-white"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {type === "student" ? "Student" : "Staff"}
        </button>
      ))}
    </div>
    {value === "staff" && (
      <p className="mt-2 text-xs text-gray-500">
        No matric number needed. An admin will review and approve your account after signup.
      </p>
    )}
  </div>
);

// ─── Step Indicator ─────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: Step; steps: string[] }> = ({ current, steps }) => {
  return (
    <div className="flex items-center justify-center mb-6 gap-2">
      {steps.map((label, i) => {
        const num = (i + 1) as Step;
        const done    = current > num;
        const active  = current === num;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-colors duration-300
                  ${done   ? "bg-green-600 text-white"
                  : active ? "bg-green-600 text-white ring-2 ring-green-300"
                           : "bg-gray-200 text-gray-500"}`}
              >
                {done ? "✓" : num}
              </div>
              <span className={`text-xs mt-1 ${active ? "text-green-700 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 transition-colors duration-300
                  ${done ? "bg-green-600" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── RegisterFlow ───────────────────────────────────────────────────────────────

export const RegisterFlow: React.FC<Props> = ({ onRegistered }) => {
  const { register } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [state, setState] = useState<StepState>({
    accountType: "student",
    email: "",
    surname: "",
    otherNames: "",
    level: "",
    matricNumber: "",
    password: "",
    password2: "",
    verificationToken: "",
    studentInfo: null,
  });

  const isStaff = state.accountType === "staff";
  const steps = isStaff ? ["Email", "Details", "Password"] : ["Email", "Identity", "Password"];

  const [errors, setErrors] = useState<Partial<Record<keyof StepState, string>>>({});

  const set = (field: keyof StepState) => (value: string) => {
    setState((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const setAccountType = (accountType: AccountType) => {
    setState((s) => ({ ...s, accountType }));
    setErrors({});
  };

  // ── Step 1 — Email ──────────────────────────────────────────────────────────

  const handleEmailSubmit = async () => {
    const email = state.email.trim().toLowerCase();
    if (!email) {
      setErrors({ email: "Email is required." });
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      setErrors({ email: "Please enter a valid email address." });
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.checkEmail(email);
      setState((s) => ({ ...s, email }));
      setStep(2);
    } catch (err: any) {
      const msg =
        err?.email?.[0] ??
        err?.detail ??
        err?.non_field_errors?.[0] ??
        "Email check failed. Please try again.";
      setErrors({ email: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2 — Identity ───────────────────────────────────────────────────────

  const handleIdentitySubmit = async () => {
    const newErrors: typeof errors = {};
    if (!state.surname.trim())      newErrors.surname      = "Surname is required.";
    if (!state.otherNames.trim())   newErrors.otherNames   = "Other names are required.";
    if (!isStaff) {
      if (!state.level)               newErrors.level        = "Select your level.";
      if (!state.matricNumber.trim()) newErrors.matricNumber = "Matric number is required.";
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    // Staff never go through matric/roster verification — straight to password.
    if (isStaff) {
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.verifyStudent(
        state.email,
        state.surname.trim(),
        state.otherNames.trim(),
        state.matricNumber.trim(),
      );
      setState((s) => ({
        ...s,
        verificationToken: res.data.verification_token,
        studentInfo: res.data.student,
      }));
      setStep(3);
    } catch (err: any) {
      // Field-level problems (e.g. matric typed in lowercase) are shown under
      // the offending field so the student sees exactly what to fix.
      const fieldErrors: typeof errors = {};
      if (err?.matric_number?.[0]) fieldErrors.matricNumber = err.matric_number[0];
      if (err?.surname?.[0])       fieldErrors.surname      = err.surname[0];
      if (err?.other_names?.[0])   fieldErrors.otherNames   = err.other_names[0];

      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        return;
      }

      const msg =
        err?.non_field_errors?.[0] ??
        err?.detail ??
        "Identity verification failed. Please check your details.";
      toast.error(msg);
      setErrors({ surname: " ", otherNames: " ", matricNumber: " " }); // highlight fields
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3 — Password ───────────────────────────────────────────────────────

  const handlePasswordSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!state.password)                       newErrors.password  = "Password is required.";
    if (state.password !== state.password2)    newErrors.password2 = "Passwords do not match.";
    if (state.password.length > 0 && state.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await register({
        email: state.email,
        surname: state.surname.trim(),
        otherNames: state.otherNames.trim(),
        password: state.password,
        password2: state.password2,
        accountType: state.accountType,
        // Staff signups omit these entirely — no matric/level/roster check.
        ...(isStaff ? {} : {
          level: state.level,
          matricNumber: state.matricNumber.trim(),
          verificationToken: state.verificationToken,
        }),
      });
      toast.success(
        isStaff
          ? "Account created! An admin will review and approve it shortly."
          : "Welcome to NACOS ABUAD!"
      );
      onRegistered();
    } catch (err: any) {
      // AuthContext already shows toasts for field errors; show a fallback here
      const msg = err?.detail ?? "Registration failed. Please try again.";
      if (!err || typeof err !== "object" || Object.keys(err).length === 0) {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(state.password);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
      <p className="text-sm text-gray-500 mb-5">
        Join the NACOS ABUAD innovation community
      </p>

      <StepIndicator current={step} steps={steps} />

      {/* ── STEP 1: Email ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <AccountTypeToggle value={state.accountType} onChange={setAccountType} disabled={isLoading} />
          <p className="text-sm text-gray-600 mb-4">
            {isStaff
              ? "Enter your email to get started."
              : "Enter your university email to get started."}
          </p>
          <Field
            label="University Email"
            type="email"
            value={state.email}
            onChange={set("email")}
            error={errors.email}
            placeholder="you@university.edu"
            autoComplete="email"
            disabled={isLoading}
          />
          <button
            onClick={handleEmailSubmit}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400
              text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-2"
          >
            {isLoading ? "Checking…" : "Continue →"}
          </button>
        </div>
      )}

      {/* ── STEP 2: Identity ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            {isStaff
              ? "Tell us your name."
              : "Confirm your identity using your official student records."}
          </p>
          <Field
            label="Email (confirmed)"
            value={state.email}
            onChange={() => {}}
            disabled
          />
          <Field
            label="Surname"
            value={state.surname}
            onChange={set("surname")}
            error={errors.surname}
            placeholder={isStaff ? "Your family name" : "Your family name, as on your student record"}
            autoComplete="family-name"
            disabled={isLoading}
          />
          <Field
            label="Other Names"
            value={state.otherNames}
            onChange={set("otherNames")}
            error={errors.otherNames}
            placeholder="First and middle names"
            autoComplete="given-name"
            disabled={isLoading}
          />
          {!isStaff && (
            <>
              <SelectField
                label="Level"
                value={state.level}
                onChange={set("level")}
                error={errors.level}
                placeholder="Select your current level"
                options={LEVELS.map((l) => ({ value: l, label: `${l} Level` }))}
                disabled={isLoading}
              />
              <Field
                label="Matric Number"
                value={state.matricNumber}
                onChange={set("matricNumber")}
                error={errors.matricNumber}
                placeholder="e.g. 23/SCI01/002"
                autoComplete="off"
                disabled={isLoading}
              />
            </>
          )}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-600 font-semibold
                py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              ← Back
            </button>
            <button
              onClick={handleIdentitySubmit}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (isStaff ? "Continuing…" : "Verifying…") : (isStaff ? "Continue →" : "Verify →")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Password ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          {/* Verified student info banner */}
          {state.studentInfo && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-semibold text-green-800">✓ Identity Verified</p>
              <p className="text-green-700">{state.studentInfo.full_name}</p>
              <p className="text-green-600 text-xs">
                {state.studentInfo.department} · {state.level} Level
              </p>
            </div>
          )}

          <Field
            label="Create Password"
            type="password"
            value={state.password}
            onChange={set("password")}
            error={errors.password}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
          />

          {/* Password strength bar */}
          {state.password.length > 0 && (
            <div className="mb-4 -mt-2">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`flex-1 rounded-full transition-colors duration-300
                      ${n <= pwStrength.score ? pwStrength.color : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{pwStrength.label}</p>
            </div>
          )}

          <Field
            label="Confirm Password"
            type="password"
            value={state.password2}
            onChange={set("password2")}
            error={errors.password2}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(2)}
              disabled={isLoading}
              className="flex-1 border border-gray-300 text-gray-600 font-semibold
                py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              ← Back
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};