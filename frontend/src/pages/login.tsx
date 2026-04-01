// frontend/src/pages/login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthForm } from "../components/AuthForm";

export const LoginPage: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // ── Handles the LOGIN form ────────────────────────────────────────────────
  const handleLogin = async (data: any) => {
    await login(data.email, data.password);
    navigate("/dashboard");
  };

  // ── Handles the REGISTER form ─────────────────────────────────────────────
  // Previously this was also calling handleLogin — which sent registration
  // data to /auth/login/ and got "unable to login with provided credentials".
  const handleRegister = async (data: any) => {
    await register(
      data.email,
      data.fullName,
      data.matricNumber || "",
      data.password,
      data.password2
    );
    navigate("/dashboard");
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
              <img
                src="/images/nacos_logo (1).png"
                alt="NACOS Logo"
                className="w-[80px] lg:w-[100px]"
              />
              <img
                src="/images/abuadLogo.png"
                alt="ABUAD Logo"
                className="w-[80px] lg:w-[100px]"
              />
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
                <img src="/images/nacos_logo (1).png" alt="NACOS" className="w-12" />
                <img src="/images/abuadLogo.png" alt="ABUAD" className="w-12" />
              </div>

              {isLogin ? (
                <AuthForm
                  type="login"
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                  onNotRegistered={() => setIsLogin(false)}
                />
              ) : (
                // ✅ Now correctly calls handleRegister → register() → /auth/register/
                <AuthForm
                  type="register"
                  onSubmit={handleRegister}
                  isLoading={isLoading}
                  onRegistered={() => setIsLogin(true)}
                />
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