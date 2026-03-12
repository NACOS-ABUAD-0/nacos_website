// frontend/src/pages/login.tsx
import React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthForm } from "../components/AuthForm";

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (data: any) => {
    await login(data.email, data.password);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[#E8F4F8] w-full justify-center items-center">
      <div className="">
        <div className="w-[1200px] h-[700px] bg-white shadow-lg flex overflow-hidden p-5 rounded-4xl">
          {/* IMAGE PANEL */}
          <div
            className={`w-1/2 text-white flex flex-col justify-center items-center transition-transform duration-700 ease-in-out rounded-3xl bg-[url('/images/hmm.png')] bg-cover bg-center ${
              isLogin ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex gap-5 items-center">
              <img src="/images/nacos_logo (1).png" alt="" className="w-[100px]" />
              <img src="/images/abuadLogo.png" alt="" className="w-[100px]" />
            </div>
            {/* <h2 className="text-3xl font-bold mb-4">
              {isLogin ? "New here?" : "Already have an account?"}
            </h2>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="border px-6 py-2 rounded-lg"
            >
              {isLogin ? "Register" : "Login"}
            </button> */}
          </div>

          {/* FORM PANEL */}
          <div
            className={`w-1/2  bg-white flex items-center justify-center transition-transform duration-700 ease-in-out ${
              isLogin ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {isLogin ? (
              <AuthForm
                type="login"
                onSubmit={handleLogin}
                isLoading={isLoading}
              />
            ) : (
              <AuthForm
                type="register"
                onSubmit={handleLogin}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
        {isLogin ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              New to NACOS ABUAD?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Join the innovation community
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an accoun?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
      {/* Left side - Auth Form */}
      {/* <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-2xl font-bold text-gray-900 mb-8 hover:text-green-600 transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <img
                  className="w-10"
                  src="/images/abuadLogo.png"
                  alt="ABUAD Logo"
                />
                <img
                  className="w-10"
                  src="/images/nacos_logo.png"
                  alt="NACOS Logo"
                />
              </div>
              <span>NACOS ABUAD</span>
            </Link>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome back
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-md">
              Sign in to access your projects, connect with the community, and
              continue your innovation journey
            </p>
          </div>

          <AuthForm type="login" onSubmit={handleLogin} isLoading={isLoading} />

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              New to NACOS ABUAD?{" "}
              <Link
                to="/register"
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Join the innovation community
              </Link>
            </p>
          </div>
        </div>
      </div> */}

      {/* Right side - Platform showcase */}

      {/* <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="absolute inset-0 bg-black/10"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        ></div>

        <div className="relative h-full flex items-center justify-center p-12">
          <div className="max-w-md text-white text-center">
            <div className="mb-12">
              <h3 className="text-3xl font-bold mb-6">Your Gateway to Innovation</h3>
              <p className="text-green-100 text-lg leading-relaxed mb-8">
                Join 250+ computing students building Nigeria's tech future
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Showcase Projects</h4>
                  <p className="text-green-100 text-sm">Display your work to the community and potential employers</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Connect & Collaborate</h4>
                  <p className="text-green-100 text-sm">Join events and work with fellow innovators</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Access Resources</h4>
                  <p className="text-green-100 text-sm">Learn from curated materials and tutorials</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">250+</div>
                  <div className="text-green-100 text-sm">Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">120+</div>
                  <div className="text-green-100 text-sm">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">36+</div>
                  <div className="text-green-100 text-sm">Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};
