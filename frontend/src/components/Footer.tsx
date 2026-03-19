// frontend/src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white border-t border-white">
      {/* Added gradient background and top border for premium depth */}
      <div className="max-w-[1500px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Enhanced spacing and structure */}

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section with enhanced logo treatment */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <img
                  className="w-7 transition-transform hover:scale-110 duration-300"
                  src="/images/abuadLogo.png"
                  alt="ABUAD Logo"
                />
                <img
                  className="w-7 transition-transform hover:scale-110 duration-300"
                  src="/images/nacos_logo (1).png"
                  alt="NACOS Logo"
                />
                <span className="ml-1 font-bold text-lg tracking-tight">
                  NACOS ABUAD
                </span>
              </div>
            </div>
            <p className="text-white text-lg leading-relaxed max-w-sm">
              Support Student innovations, sponsor events, and help shape
              Nigeria’s Next Generation of Tech Leaders
            </p>
          </div>

          {/* Quick links section */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Explore</h3>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Projects", path: "/projects" },
                { name: "Events", path: "/events" },
                { name: "Resources", path: "/resources" },
                { name: "Gallery", path: "/gallery" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-white hover:text-green-300 transition-colors duration-200 inline-flex items-center gap-2 group"
                  >
                    <span>{link.name}</span>
                    <svg
                      className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact/Info section */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@nacosabuad.org"
                  className="text-white hover:text-green-300 transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <Link
                  to="/executives"
                  className="text-white hover:text-green-300 transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>Our Team</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsorship"
                  className="text-white hover:text-green-300 transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  <span>Partner With Us</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section with copyright and social links */}
        <div className="pt-8 border-t border-white">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright text */}
            <div className="text-green-100 text-sm">
              &copy; {new Date().getFullYear()} NACOS ABUAD. All rights
              reserved.
            </div>

            {/* Social links */}
          </div>
        </div>

        {/* Subtle decorative element */}
        <div className="absolute bottom-4 right-4 opacity-10">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    </footer>
  );
};
