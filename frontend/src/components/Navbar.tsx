// frontend/src/components/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Folder,
  Calendar,
  BookOpen,
  Image as ImageIcon,
  Users,
  Plus,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Grid,
} from 'lucide-react';

/**
 * World-class Navbar for NACOS ABUAD
 *
 * Design decisions (short):
 * - Strict green/white palette with subtle gradients for CTA and logo container.
 * - Rounded-2xl cards, rounded-xl buttons, and gentle elevation (shadow-lg -> shadow-2xl on hover).
 * - Smooth transitions (200-300ms) and slight transforms for hover micro-interactions.
 * - Semantic HTML, accessible attributes for menus and buttons.
 * - Lightweight: no heavy animation libraries; purely Tailwind transitions for performance.
 */

/** Keep types flexible to match your existing AuthContext typing.
 * Replace `any` with your concrete `User` type if available.
 */
type NavItem = { name: string; path: string; icon: React.ReactNode };

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth() as {
    user: any;
    logout: () => void;
    isAuthenticated: boolean;
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click (accessible behavior)
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const authNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <Grid className="w-4 h-4" /> },
    { name: 'Projects', path: '/projects', icon: <Folder className="w-4 h-4" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Resources', path: '/resources', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Gallery', path: '/gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Executives', path: '/executives', icon: <Users className="w-4 h-4" /> },
  ];

  const publicNavItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Projects', path: '/projects', icon: <Folder className="w-4 h-4" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Resources', path: '/resources', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Gallery', path: '/gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Executives', path: '/executives', icon: <Users className="w-4 h-4" /> },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const firstName = user?.full_name?.split?.(' ')[0] ?? 'User';
  const initial = user?.full_name?.charAt?.(0)?.toUpperCase?.() ?? 'U';

  return (
    <nav
      aria-label="Primary navigation"
      className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group" aria-label="NACOS ABUAD home">
              {/* Logo container: subtle gradient, rounded-2xl, shadow, hover elevation */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-[#059669] to-[#10b981] rounded-2xl px-4 py-2 group-hover:from-[#07a26a] group-hover:to-[#059669] transition-all duration-300 shadow-lg hover:shadow-2xl transform group-hover:-translate-y-0.5">
                {/* Icon/mark: white rounded tokens to feel premium */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm">
                    <span className="text-[#059669] font-bold text-xs leading-none">A</span>
                  </div>
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm">
                    <span className="text-[#059669] font-bold text-xs leading-none">N</span>
                  </div>
                </div>

                <span className="text-white font-bold text-lg tracking-tight select-none">
                  NACOS ABUAD
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#059669] text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-green-50 hover:text-[#059669] hover:shadow-md'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={active ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: auth + mobile toggle */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Add Project CTA (desktop) */}
                <Link
                  to="/projects/new"
                  className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-[#059669] to-[#10b981] text-white px-5 py-2 rounded-xl font-medium hover:from-[#07a26a] hover:to-[#059669] transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </Link>

                {/* User menu */}
                <div className="relative" ref={menuRef}>
                  {/* eslint-disable-next-line jsx-a11y/aria-proptypes */}
                  <button
                    onClick={() => setIsMenuOpen((s) => !s)}
                    aria-haspopup="menu"
                    {...(isMenuOpen ? { 'aria-expanded': true as const } : { 'aria-expanded': false as const })}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl px-3 py-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-[#059669] to-[#10b981] rounded-full flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-white font-semibold text-sm">{initial}</span>
                    </div>

                    <div className="hidden lg:flex flex-col leading-tight">
                      <span className="text-gray-800 font-medium text-sm">{firstName}</span>
                      <span className="text-gray-400 text-xs">{user?.matric_number || ''}</span>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {/* Dropdown - elegant card */}
                  {isMenuOpen && (
                    <div
                      role="menu"
                      aria-label="User menu"
                      className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 py-2 animate-in fade-in-80"
                    >
                      {/* User header */}
                      <div className="px-4 py-3 border-b border-gray-200/60">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        {user?.matric_number && <p className="text-xs text-gray-400 mt-1">{user.matric_number}</p>}
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-[#059669] transition-colors duration-200"
                          role="menuitem"
                        >
                          <Grid className="w-4 h-4 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-[#059669] transition-colors duration-200"
                          role="menuitem"
                        >
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span>Your Profile</span>
                        </Link>

                        <Link
                          to="/my-projects"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-[#059669] transition-colors duration-200"
                          role="menuitem"
                        >
                          <Folder className="w-4 h-4 text-gray-500" />
                          <span>My Projects</span>
                        </Link>
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-gray-200/60 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Public actions (Sign in / Join)
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 font-medium hover:text-[#059669] transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#059669] to-[#10b981] text-white px-6 py-2 rounded-xl font-medium hover:from-[#07a26a] hover:to-[#059669] transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Join Now</span>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((s) => !s)}
              aria-label="Open mobile menu"
              {...(isMobileMenuOpen ? { 'aria-expanded': true as const } : { 'aria-expanded': false as const })}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu sheet */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 mt-3 py-4 animate-in slide-in-from-top-5">
            <div className="px-4 space-y-2">
              {navItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${active ? 'bg-[#059669] text-white shadow-lg' : 'text-gray-700 hover:bg-green-50 hover:text-[#059669]'
                      }`}
                  >
                    <span className={active ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {isAuthenticated && (
                <Link
                  to="/projects/new"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#059669] to-[#10b981] text-white rounded-xl font-medium hover:from-[#07a26a] hover:to-[#059669] transition-all duration-200 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </Link>
              )}

              {/* mobile auth CTA when not signed in */}
              {!isAuthenticated && (
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 text-gray-700 font-medium hover:text-[#059669] transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="ml-auto inline-flex items-center gap-2 bg-gradient-to-r from-[#059669] to-[#10b981] text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Join</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
