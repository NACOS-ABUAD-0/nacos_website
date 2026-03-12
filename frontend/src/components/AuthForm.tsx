import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    matricNumber: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await onSubmit(formData);
    } catch (err: any) {
      if (typeof err === "object") {
        setErrors(err);
        Object.entries(err).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(`${field}: ${msg}`));
          } else {
            toast.error(`${field}: ${messages}`);
          }
        });
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background pattern for premium feel */}
      {/* <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f766e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div> */}

      {/* Floating decorative elements */}
      {/* <div className="absolute top-20 left-10 w-8 h-8 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-32 right-12 w-6 h-6 bg-emerald-300 rounded-full opacity-30"></div> */}

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Enhanced header section */}
        <div className="text-center">
          {/* <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 text-white"
                  src="/images/abuadLogo.png"
                  alt="ABUAD Logo"
                />
                <img
                  className="h-8 w-8 text-white filter brightness-0 invert"
                  src="/assets/nacos-logo.png"
                  alt="NACOS Logo"
                />
              </div>
            </div>
          </div> */}

          {/* Enhanced typography */}
          <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            {type === "login" ? "Welcome Back" : "Join Our Community"}
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            {type === "login" ? "Sign in to continue your journey" : "Start building with fellow innovators"}
          </p>

          {/* Streamlined link text */}
          <p className="text-sm text-gray-500">
            {type === "login" ? (
              <>
                New here?{" "}
                <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200">
                  Create account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Enhanced form container */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-2 font-medium">{errors.email as string}</p>
              )}
            </div>

            {type === "register" && (
              <>
                {/* Full Name field */}
                <div>
                  <label htmlFor="fullName" className="sr-only">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-2 font-medium">{errors.full_name as string}</p>
                  )}
                </div>

                {/* Matric Number field */}
                <div>
                  <label htmlFor="matricNumber" className="sr-only">Matric Number</label>
                  <input
                    id="matricNumber"
                    name="matricNumber"
                    type="text"
                    className="relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Matric Number (optional)"
                    value={formData.matricNumber}
                    onChange={handleChange}
                  />
                  {errors.matric_number && (
                    <p className="text-red-500 text-xs mt-2 font-medium">{errors.matric_number as string}</p>
                  )}
                </div>
              </>
            )}

            {/* Password field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-2 font-medium">{errors.password as string}</p>
              )}
            </div>

            {type === "register" && (
              <div>
                <label htmlFor="password2" className="sr-only">Confirm Password</label>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  required
                  className="relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Confirm Password"
                  value={formData.password2}
                  onChange={handleChange}
                />
                {errors.password2 && (
                  <p className="text-red-500 text-xs mt-2 font-medium">{errors.password2 as string}</p>
                )}
              </div>
            )}
          </div>

          {/* Enhanced submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : type === "login" ? (
                <div className="flex items-center gap-2">
                  Sign In
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Additional info for register form */}
          {type === "register" && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our community guidelines and privacy policy
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};