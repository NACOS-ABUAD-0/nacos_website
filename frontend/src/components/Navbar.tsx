// frontend/src/components/Navbar.tsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Plus,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Grid,
  Folder,
} from "lucide-react";
import NacosLogo from "/images/nacos_logo.png";
import AbuadLogo from "../../public/images/abuadLogo.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type NavItem = { name: string; path: string };

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { isDark } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // ── Close user dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Close mobile menu on route change ────────────────────────────────────
  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setIsMobileOpen(false);
  };

  // ── Nav items ─────────────────────────────────────────────────────────────
  const authNavItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/projects" },
    { name: "Events", path: "/events" },
    { name: "Resources", path: "/resources" },
    { name: "Gallery", path: "/gallery" },
    { name: "Executives", path: "/executives" },
    { name: "Contact", path: "/contact" },
  ];

  const publicNavItems: NavItem[] = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "Events", path: "/events" },
    { name: "Resources", path: "/resources" },
    { name: "Gallery", path: "/gallery" },
    { name: "Executives", path: "/executives" },
    { name: "Contact", path: "/contact" },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  // ── Derived display values ────────────────────────────────────────────────
  const firstName = user?.full_name?.split?.(" ")[0] ?? "User";
  const initial = user?.full_name?.charAt?.(0)?.toUpperCase?.() ?? "U";

  // ── Shared class helpers ──────────────────────────────────────────────────
  const textBase = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-300" : "text-gray-700";
  const bgPanel = isDark
    ? "bg-black/95 backdrop-blur-xl"
    : "bg-white/95 backdrop-blur-xl";

  return (
    <nav
      className={`sticky top-0 z-[60] w-full transition-all duration-300 ${
        isDark
          ? "bg-black/10 backdrop-blur-lg"
          : "bg-white/10 backdrop-blur-lg"
      }`}
    >
      <div className="flex justify-between items-center px-6 md:px-12 py-4">
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <NavLink to="/" className="flex gap-3 items-center group">
          <img src={AbuadLogo} alt="ABUAD Logo" className="w-7 md:w-9" />
          <img src={NacosLogo} alt="NACOS Logo" className="w-9 md:w-11" />
          <h1 className={`font-bold text-lg lg:text-2xl ${textBase}`}>
            NACOS ABUAD
          </h1>
        </NavLink>

        {/* ── Desktop links ────────────────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `text-base font-medium transition-colors ${
                  isActive
                    ? "text-[#006E3A]"
                    : `${textMuted} hover:text-[#006E3A]`
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* ── Desktop right: auth actions ──────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Add Project CTA */}
              <NavLink
                to="/projects/new"
                className="inline-flex items-center gap-2 bg-[#006E3A] hover:bg-[#005a30] text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </NavLink>

              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-md ${
                    isDark
                      ? "border-white/20 bg-white/5 hover:bg-white/10"
                      : "border-gray-200 bg-white/80 hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar circle */}
                  <div className="w-8 h-8 bg-[#006E3A] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {initial}
                    </span>
                  </div>

                  <div className="flex flex-col leading-tight text-left">
                    <span className={`font-medium text-sm ${textBase}`}>
                      {firstName}
                    </span>
                    {user?.matric_number && (
                      <span className="text-xs text-gray-400">
                        {user.matric_number}
                      </span>
                    )}
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown panel */}
                {isUserMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className={`absolute right-0 mt-2 w-60 rounded-2xl shadow-2xl border py-2 z-50 ${bgPanel} ${
                      isDark ? "border-white/10" : "border-gray-200/60"
                    }`}
                  >
                    {/* User info header */}
                    <div
                      className={`px-4 py-3 border-b ${
                        isDark ? "border-white/10" : "border-gray-100"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold truncate ${textBase}`}
                      >
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user?.email}
                      </p>
                      {user?.matric_number && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {user.matric_number}
                        </p>
                      )}
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      {[
                        {
                          to: "/dashboard",
                          icon: <Grid className="w-4 h-4" />,
                          label: "Dashboard",
                        },
                        {
                          to: "/profile",
                          icon: <UserIcon className="w-4 h-4" />,
                          label: "Your Profile",
                        },
                        {
                          to: "/projects/my-projects",
                          icon: <Folder className="w-4 h-4" />,
                          label: "My Projects",
                        },
                      ].map(({ to, icon, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isDark
                              ? "text-gray-300 hover:bg-white/10 hover:text-white"
                              : "text-gray-700 hover:bg-green-50 hover:text-[#006E3A]"
                          }`}
                        >
                          <span className="text-gray-400">{icon}</span>
                          {label}
                        </NavLink>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div
                      className={`border-t pt-1 ${
                        isDark ? "border-white/10" : "border-gray-100"
                      }`}
                    >
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`text-base font-medium transition-colors ${textMuted} hover:text-[#006E3A]`}
              >
                Sign In
              </NavLink>
            </>
          )}
        </div>

        {/* ── Mobile menu toggle ───────────────────────────────────────── */}
        <button
          aria-label="Toggle menu"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-menu"
          className={`lg:hidden ${textBase}`}
          onClick={() => setIsMobileOpen((s) => !s)}
        >
          {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────────────────── */}
      <div
        id="mobile-menu"
        className={`
          absolute right-4 top-[68px] w-[55%] max-w-xs
          transform transition-all duration-300 ease-in-out
          lg:hidden rounded-2xl shadow-2xl py-4
          ${bgPanel} ${isDark ? "border border-white/10" : "border border-gray-200/60"}
          ${
            isMobileOpen
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-3 invisible pointer-events-none"
          }
        `}
      >
        <div className="flex flex-col gap-1 px-3">
          {/* Nav links */}
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#006E3A] text-white"
                    : `${textMuted} hover:bg-green-50 hover:text-[#006E3A]`
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          <div
            className={`my-2 border-t ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          />

          {isAuthenticated ? (
            <>
              {/* User info strip */}
              <div className="flex items-center gap-3 px-4 py-2 mb-1">
                <div className="w-9 h-9 bg-[#006E3A] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {initial}
                  </span>
                </div>
                <div className="flex flex-col leading-tight overflow-hidden">
                  <span className={`text-sm font-semibold truncate ${textBase}`}>
                    {user?.full_name}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Auth nav links */}
              {[
                { to: "/dashboard", icon: <Grid className="w-4 h-4" />, label: "Dashboard" },
                { to: "/profile", icon: <UserIcon className="w-4 h-4" />, label: "Profile" },
                { to: "/projects/my-projects", icon: <Folder className="w-4 h-4" />, label: "My Projects" },
              ].map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? "text-gray-300 hover:bg-white/10"
                      : "text-gray-700 hover:bg-green-50 hover:text-[#006E3A]"
                  }`}
                >
                  <span className="text-gray-400">{icon}</span>
                  {label}
                </NavLink>
              ))}

              {/* Add Project */}
              <NavLink
                to="/projects/new"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 mx-1 mt-1 px-4 py-2.5 bg-[#006E3A] hover:bg-[#005a30] text-white rounded-lg text-sm font-semibold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </NavLink>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${textMuted} hover:bg-green-50 hover:text-[#006E3A]`}
              >
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 mx-1 px-4 py-2.5 bg-[#006E3A] hover:bg-[#005a30] text-white rounded-lg text-sm font-semibold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Join Now
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;