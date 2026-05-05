// frontend/src/pages/login.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthForm } from "../components/AuthForm";
import { RegisterFlow } from "../components/RegisterFlow";
import { FaceLogin } from "../components/FaceLogin";                 // ProfileFaceSetup removed — wasn't used here
import type { FaceLoginResponse } from "../services/faceAuthService"; // ✅ correct path

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"password" | "face">("password");
  const navigate = useNavigate();

  const handleLogin = async (data: any) => {
    await login(data.email, data.password);
    navigate("/dashboard");
  };

  // ── Face login success ─────────────────────────────────────────────────────
  // 1. Store tokens under the EXACT keys AuthContext reads ("accessToken" /
  //    "refreshToken" — camelCase, matching src/lib/api.ts).
  // 2. Use window.location.href instead of navigate() so the page fully
  //    reloads. That re-triggers AuthContext's initAuth() useEffect, which
  //    calls getProfile() with the new token and sets isAuthenticated = true.
  //    A client-side navigate() stays in the same JS session and initAuth()
  //    never runs again, leaving the app in a logged-out state.
  const handleFaceLoginSuccess = (data: FaceLoginResponse) => {
    localStorage.setItem("accessToken", data.access);    // ✅ matches api.ts interceptor
    localStorage.setItem("refreshToken", data.refresh);  // ✅ matches api.ts interceptor
    window.location.href = "/dashboard";                  // ✅ hard reload → initAuth fires
  };

  return (
    <div className="min-h-screen flex bg-[#E8F4F8] w-full justify-center items-center p-4">
      <div className="w-full max-w-6xl">
        <div className="w-full min-h-[600px] lg:h-[700px] bg-white shadow-lg flex flex-col lg:flex-row overflow-hidden p-4 lg:p-5 rounded-3xl lg:rounded-4xl relative">

          {/* IMAGE PANEL — desktop only */}
          <div
            className={`hidden lg:flex w-1/2 text-white flex-col justify-center items-center transition-transform duration-700 ease-in-out rounded-3xl bg-[url('/images/hmm.png')] bg-cover bg-center absolute top-5 bottom-5 left-5 z-20 ${
              isLogin ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ width: "calc(50% - 20px)" }}
          >
            <div className="flex gap-5 items-center p-6 rounded-2xl">
              <img src="/images/nacos_logo.png" alt="NACOS Logo" className="w-[80px] lg:w-[100px]" />
              <img src="/images/abuadLogo.png" alt="ABUAD" className="w-[80px] lg:w-[100px]" />
            </div>
          </div>

          {/* FORM PANEL */}
          <div
            className={`w-full lg:w-1/2 bg-white flex items-center justify-center transition-transform duration-700 ease-in-out py-10 ${
              isLogin ? "lg:translate-x-full" : "lg:translate-x-0"
            }`}
          >
            <div className="w-full max-w-md px-4">
              {/* Mobile logos */}
              <div className="flex lg:hidden gap-4 justify-center items-center mb-8">
                <img src="/images/nacos_logo.png" alt="NACOS" className="w-12" />
                <img src="/images/abuadLogo.png" alt="ABUAD" className="w-12" />
              </div>

              {isLogin ? (
                <>
                  {/* Auth method toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("password")}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        authMethod === "password"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod("face")}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        authMethod === "face"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      👁 Face Login
                    </button>
                  </div>

                  {authMethod === "password" ? (
                    <>
                      <AuthForm
                        type="login"
                        onSubmit={handleLogin}
                        isLoading={isLoading}
                        onNotRegistered={() => setIsLogin(false)}
                      />
                      <div className="mt-4 text-center">
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors duration-200"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </>
                  ) : (
                    <FaceLogin
                      onSuccess={handleFaceLoginSuccess}
                      onSwitchToPassword={() => setAuthMethod("password")}
                    />
                  )}
                </>
              ) : (
                <RegisterFlow onRegistered={() => setIsLogin(true)} />
              )}
            </div>
          </div>
        </div>

        {/* Toggle text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? (
              <>
                New to NACOS ABUAD?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
                >
                  Join the innovation community
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};