// frontend/src/pages/register.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/AuthForm';

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (data: any) => {
    await register(data.email, data.fullName, data.matricNumber || "", data.password, data.password2);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Enhanced header with platform context */}
          <div className="text-center lg:text-left">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-2xl font-bold text-gray-900 mb-8 hover:text-green-600 transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <img
                  className="h-8 w-8"
                  src="/assets/abuad-logo.png"
                  alt="ABUAD Logo"
                />
                <img
                  className="h-8 w-8"
                  src="/assets/nacos-logo.png"
                  alt="NACOS Logo"
                />
              </div>
              <span>NACOS ABUAD</span>
            </Link>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Join the Innovation Community
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Create your account to showcase projects, connect with peers, and access exclusive resources
            </p>
          </div>

          <AuthForm type="register" onSubmit={handleRegister} isLoading={isLoading} />

          {/* Enhanced footer with login link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Platform showcase */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>

        <div className="relative h-full flex items-center justify-center p-12">
          <div className="max-w-md text-white text-center">
            {/* Platform value proposition */}
            <div className="mb-12">
              <h3 className="text-3xl font-bold mb-6">
                Build Your Tech Portfolio
              </h3>
              <p className="text-green-100 text-lg leading-relaxed mb-8">
                Join 250+ computing students building the future of African technology
              </p>
            </div>

            {/* Platform features */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Showcase Your Work</h4>
                  <p className="text-green-100 text-sm">Display projects to the community and potential employers</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Access Resources</h4>
                  <p className="text-green-100 text-sm">Learn from curated materials and tutorials</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold mb-1">Career Opportunities</h4>
                  <p className="text-green-100 text-sm">Connect with recruiters and industry partners</p>
                </div>
              </div>
            </div>

            {/* Student verification info */}
            <div className="mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <h4 className="font-semibold mb-2 text-green-100">Student Verification</h4>
              <p className="text-green-100 text-sm">
                Use your ABUAD email and matric number to verify your student status and access all features
              </p>
            </div>

            {/* Community stats */}
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
      </div>
    </div>
  );
};