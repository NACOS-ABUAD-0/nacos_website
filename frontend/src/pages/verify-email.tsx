// frontend/src/pages/verify-email.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const { verifyEmail, resendVerificationEmail, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (uid && token) {
      handleVerification();
    }
  }, [uid, token]);

  const handleVerification = async () => {
    if (!uid || !token) {
      setStatus('error');
      setErrorMessage('Invalid verification link.');
      return;
    }

    setStatus('verifying');
    try {
      await verifyEmail(uid, token);
      setStatus('success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.error || 'Failed to verify email. The link may be invalid or expired.');
    }
  };

  const handleResend = async () => {
    try {
      await resendVerificationEmail();
    } catch (err) {
      // Error is already handled by toast in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors"
            >
              <img
                className="h-10 w-10"
                src="/assets/nacos-logo.png"
                alt="NACOS Logo"
              />
              <span>NACOS ABUAD</span>
            </Link>
          </div>

          {/* Verification Status */}
          {status === 'verifying' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 text-green-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You'll be redirected to your dashboard shortly.
              </p>
              <Link
                to="/dashboard"
                className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              
              <div className="space-y-4">
                {user && !user.is_email_verified && (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                )}
                
                <Link
                  to="/login"
                  className="block text-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {status === 'idle' && !uid && !token && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-16 w-16 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h2>
              <p className="text-gray-600 mb-6">
                Please check your email for the verification link, or use the button below to resend it.
              </p>
              
              {user && !user.is_email_verified && (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link to="/contact" className="text-green-600 hover:text-green-700 font-semibold">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

