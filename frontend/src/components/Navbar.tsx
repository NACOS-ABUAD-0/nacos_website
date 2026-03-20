// frontend/src/components/Navbar.tsx

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, User as UserIcon, Grid, Folder, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NacosLogo from "../assets/nacos_logo.png";
import AbuadLogo from "/images/abuadLogo.png";

/**
 * NACOS ABUAD Navbar
 *
 * Design: New navbar visual (glassmorphism, dual logos, mobile slide-in panel).
 * Functionality: Old navbar logic (auth state, active route highlighting,
 * user dropdown with profile/dashboard/my-projects, logout, Add Project CTA).
 *
 * Key decisions:
 * - No icons on nav links (new design spec) — icons only in dropdown menu items.
 * - Mobile panel slides in from the right (translate-x trick, no extra lib).
 * - Outside-click closes the user dropdown via a ref + mousedown listener.
 * - isActivePath handles both exact "/" and startsWith for nested routes.
 */

type NavItem = { name: string; path: string };

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth() as {
    user: any;
    logout: () => void;
    isAuthenticated: boolean;
  };

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setIsMobileOpen(false);
  };

  // Authenticated users see Dashboard instead of Home
  const authNavItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/projects" },
    { name: "Events", path: "/events" },
    { name: "Resources", path: "/resources" },
    { name: "Gallery", path: "/gallery" },
    { name: "Executives", path: "/executives" },
  ];

  const publicNavItems: NavItem[] = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "Events", path: "/events" },
    { name: "Resources", path: "/resources" },
    { name: "Gallery", path: "/gallery" },
    { name: "Executives", path: "/executives" },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Derive display values safely
  const firstName = user?.full_name?.split?.(" ")[0] ?? "User";
  const initial = user?.full_name?.charAt?.(0)?.toUpperCase?.() ?? "U";

  return (
    <nav className="fixed top-0 z-50 w-full backdrop-blur-xl border-b bg-white/10 border-white/20">
      <div className="flex justify-between items-center px-6 md:px-12 py-4">

        {/* ── Logo Section ── */}
        <Link to="/" className="flex gap-2 items-center" aria-label="NACOS ABUAD home">
          <img src={AbuadLogo} alt="ABUAD Logo" className="w-8 md:w-10" />
          <img src={NacosLogo} alt="NACOS Logo" className="w-8 md:w-10" />
          <h1 className="font-bold text-lg lg:text-2xl">NACOS ABUAD</h1>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`text-lg font-medium transition-colors ${
                    active
                      ? "text-[#006E3A] border-b-2 border-[#006E3A] pb-0.5"
                      : "text-black hover:text-[#006E3A]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Auth Area ── */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Add Project CTA */}
              <Link
                to="/projects/new"
                className="flex items-center gap-2 px-5 py-2 bg-[#006E3A] hover:bg-[#005a30] transition-all rounded-lg text-white font-semibold text-base"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className="flex items-center gap-2 bg-white/80 border border-white/40 rounded-xl px-3 py-2 hover:shadow-md transition-all"
                >
                  {/* Avatar circle */}
                  <div className="w-8 h-8 bg-[#006E3A] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">{initial}</span>
                  </div>
                  <span className="hidden xl:block text-sm font-medium text-gray-800">{firstName}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Panel */}
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-3 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 py-2"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      {user?.matric_number && (
                        <p className="text-xs text-gray-400 mt-0.5">{user.matric_number}</p>
                      )}
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-[#006E3A] transition-colors"
                      >
                        <Grid className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-[#006E3A] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Your Profile
                      </Link>
                      <Link
                        to="/my-projects"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-[#006E3A] transition-colors"
                      >
                        <Folder className="w-4 h-4 text-gray-400" />
                        My Projects
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Public: Sign In + Join Now */
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-black hover:text-[#006E3A] font-medium text-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-8 py-2.5 bg-[#006E3A] hover:bg-[#005a30] transition-all rounded-lg text-white font-semibold text-lg"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile Menu Toggle ── */}
        <button
          className="lg:hidden"
          onClick={() => setIsMobileOpen((s) => !s)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ── Mobile Slide-in Panel ── */}
      <div
        className={`fixed inset-0 top-[72px] bg-black/90 backdrop-blur-2xl transition-transform duration-300 lg:hidden ${
          isMobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center gap-4 pt-6 px-6">
          {/* Nav links */}
          {navItems.map((item) => {
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`w-full text-center py-3 rounded-lg text-lg font-medium transition-colors ${
                  active
                    ? "bg-[#006E3A] text-white"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="w-full border-t border-white/20 pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                {/* Authenticated user info */}
                <div className="text-center text-white/80 text-sm mb-1">
                  Signed in as <span className="font-semibold text-white">{firstName}</span>
                </div>
                <Link
                  to="/projects/new"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#006E3A] hover:bg-[#005a30] rounded-lg text-white font-bold text-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Project
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-3.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold text-lg transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 text-red-400 hover:text-red-300 font-semibold text-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-3.5 text-white font-semibold text-lg hover:bg-white/10 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-4 bg-[#006E3A] hover:bg-[#005a30] rounded-lg text-white font-bold text-xl transition-colors"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;