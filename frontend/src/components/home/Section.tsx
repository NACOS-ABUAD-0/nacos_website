// src/components/home/Section.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  ctaText,
  ctaLink,
  id
}) => {
  return (
    <section id={id} className="py-20 bg-white relative overflow-hidden">
      {/* Subtle background decoration for premium feel */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-100 to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section header with enhanced typography and spacing */}
        <div className="text-center mb-16">
          {/* Decorative accent line */}
          <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mx-auto mb-6"></div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main content area */}
        <div className="relative">
          {children}
        </div>

        {/* Enhanced CTA with premium styling */}
        {ctaText && ctaLink && (
          <div className="text-center mt-16">
            <Link
              to={ctaLink}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {ctaText}
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>

            {/* Subtle decorative element */}
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
    </section>
  );
};