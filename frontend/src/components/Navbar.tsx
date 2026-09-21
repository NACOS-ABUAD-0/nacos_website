// frontend/src/components/Navbar.tsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Plus,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Grid,
  Folder,
  GraduationCap,
  QrCode,
  Users,
  ClipboardList,
  House,
  Rocket,
  CalendarDays,
  Images,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Crown,
  Handshake,
  MessageSquareWarning,
  Mail,
  type LucideIcon,
} from "lucide-react";
import NacosLogo from "/images/nacos_logo.png";
import AbuadLogo from "/images/abuadLogo.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type NavItem = { name: string; path: string; icon: LucideIcon };
type AccountLink = { to: string; icon: LucideIcon; label: string };

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#006E3A]/60 focus-visible:ring-offset-1";

// ── Nav items ───────────────────────────────────────────────────────────────
// Split into "primary" (always visible on desktop) and "more" (tucked into an
// overflow dropdown) — keeps the bar a single line at any width instead of
// wrapping/crowding as more nav items get added over time.
const primaryAuthNavItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: Rocket },
  { name: "Events", path: "/events", icon: CalendarDays },
  { name: "Resources", path: "/resources", icon: BookOpen },
  { name: "Gallery", path: "/gallery", icon: Images },
  { name: "Assistant", path: "/assistant", icon: Sparkles },
];
const moreAuthNavItems: NavItem[] = [
  { name: "Lecturers", path: "/lecturers", icon: GraduationCap },
  { name: "Executives", path: "/executives", icon: Crown },
  { name: "Committees", path: "/committees", icon: Users },
  { name: "Collaboration Hub", path: "/collaboration-hub", icon: Handshake },
  { name: "Complaints", path: "/complaints", icon: MessageSquareWarning },
  { name: "Contact", path: "/contact", icon: Mail },
];

const primaryPublicNavItems: NavItem[] = [
  { name: "Home", path: "/", icon: House },
  { name: "Projects", path: "/projects", icon: Rocket },
  { name: "Events", path: "/events", icon: CalendarDays },
  { name: "Gallery", path: "/gallery", icon: Images },
];
const morePublicNavItems: NavItem[] = [
  { name: "Lecturers", path: "/lecturers", icon: GraduationCap },
  { name: "Executives", path: "/executives", icon: Crown },
  { name: "Contact", path: "/contact", icon: Mail },
];

// Personal shortcuts — shown in the desktop user menu and the mobile drawer.
const accountLinks: AccountLink[] = [
  { to: "/dashboard", icon: Grid, label: "Dashboard" },
  { to: "/profile", icon: UserIcon, label: "Your Profile" },
  { to: "/my-projects", icon: Folder, label: "My Projects" },
  { to: "/my-collaborations", icon: Users, label: "My Collaborations" },
  { to: "/collaboration-requests", icon: ClipboardList, label: "Collaboration Requests" },
  { to: "/attendance/scan", icon: QrCode, label: "Scan Attendance" },
];

// ── Motion ──────────────────────────────────────────────────────────────────
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const popoverMotion = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
};

const drawerVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.26, ease: EASE_OUT, staggerChildren: 0.035, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.16 } },
};
const drawerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

// Animated hamburger ⇄ close: three bars that morph rather than swap icons.
const MenuToggleIcon = ({ open }: { open: boolean }) => (
  <span className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]" aria-hidden>
    <motion.span
      className="block h-0.5 w-5 rounded-full bg-current"
      animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
    />
    <motion.span
      className="block h-0.5 w-5 rounded-full bg-current"
      animate={open ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.2 }}
    />
    <motion.span
      className="block h-0.5 w-5 rounded-full bg-current"
      animate={open ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
    />
  </span>
);

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const { isDark } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // ── Condense the bar once the page scrolls ────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close dropdowns on outside click / Escape ─────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // ── Close menus on route change ───────────────────────────────────────────
  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  // ── Lock page scroll while the mobile menu is open, so scrolling inside the
  //    drawer scrolls the drawer, not the page behind it. Deliberately NOT
  //    `useScrollLock`: that pins <body> with `position: fixed`, which drags a
  //    sticky navbar (and the drawer hanging off it) out of the viewport
  //    whenever the page is scrolled. Locking <html>'s overflow leaves the
  //    scroll position untouched, so the bar stays put. The backdrop is
  //    `touch-none` and the drawer `overscroll-contain` to stop touch
  //    scroll-chaining on mobile Safari. ───────────────────────────────────
  useEffect(() => {
    if (!isMobileOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserMenuOpen(false);
    setIsMobileOpen(false);
  };

  const primaryNavItems = isAuthenticated ? primaryAuthNavItems : primaryPublicNavItems;
  const moreNavItems = isAuthenticated ? moreAuthNavItems : morePublicNavItems;
  // Mobile drawer shows the full flat list — it scrolls, so no overflow concern.
  const navItems = [...primaryNavItems, ...moreNavItems];

  const moreActive = moreNavItems.some((item) =>
    location.pathname.startsWith(item.path),
  );

  // ── Derived display values ────────────────────────────────────────────────
  const firstName = user?.full_name?.split?.(" ")[0] ?? "User";
  const initial = user?.full_name?.charAt?.(0)?.toUpperCase?.() ?? "U";

  // ── Shared class helpers ──────────────────────────────────────────────────
  const textBase = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-300" : "text-gray-700";
  const hairline = isDark ? "border-white/10" : "border-gray-200/70";
  const panel = isDark
    ? "bg-gray-950/95 backdrop-blur-xl border-white/10"
    : "bg-white/95 backdrop-blur-xl border-gray-200/70";
  const hoverPill = isDark ? "bg-white/10" : "bg-gray-900/[0.05]";
  // #006E3A on near-black is too dim to read — lift it in dark mode.
  const accentText = isDark ? "text-green-400" : "text-[#006E3A]";
  const accentHover = isDark ? "hover:text-green-400" : "hover:text-[#006E3A]";
  const accentBg = isDark ? "bg-green-400" : "bg-[#006E3A]";
  const menuItemIdle = isDark
    ? "text-gray-300 hover:bg-white/10 hover:text-white"
    : "text-gray-700 hover:bg-green-50 hover:text-[#006E3A]";

  // The bar is solid at the top of the page and turns into frosted glass (with
  // a hairline + soft shadow) once content scrolls under it. The old 10%
  // opacity made links unreadable over any page content.
  const solid = scrolled || isMobileOpen;
  const barSurface = solid
    ? isDark
      ? "bg-gray-950/80 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
      : "bg-white/80 backdrop-blur-xl border-gray-200/70 shadow-[0_8px_30px_-14px_rgba(15,23,42,0.25)]"
    : isDark
    ? "bg-gray-950 border-transparent"
    : "bg-white border-transparent";

  return (
    <nav
      className={`sticky top-0 z-[60] w-full border-b transition-[background-color,box-shadow,border-color] duration-300 ${barSurface}`}
    >
      <div
        className={`mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[auto_1fr_auto] lg:px-6 xl:px-10 transition-[padding] duration-300 ${
          solid ? "py-2" : "py-3 md:py-3.5"
        }`}
      >
        {/* ── Logo lockup ──────────────────────────────────────────────── */}
        <NavLink
          to="/"
          aria-label="NACOS ABUAD — home"
          className={`group flex shrink-0 items-center gap-2.5 rounded-xl ${FOCUS_RING}`}
        >
          {/* nacos_logo.png is a round mark centred in a tall transparent
              canvas (168×299) — sizing by height shrinks the visible circle,
              sizing by width inflates the bar. Square + object-cover crops the
              padding so the circle fills the box. */}
          <img
            src={NacosLogo}
            alt=""
            className={`object-cover object-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-4deg] ${
              solid ? "h-8 w-8 md:h-9 md:w-9" : "h-9 w-9 md:h-10 md:w-10"
            }`}
          />
          <img
            src={AbuadLogo}
            alt=""
            className={`w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:rotate-[4deg] ${
              solid ? "h-8 md:h-9" : "h-9 md:h-10"
            }`}
          />
          <span
            className={`mx-0.5 hidden h-7 w-px sm:block ${isDark ? "bg-white/15" : "bg-gray-300"}`}
            aria-hidden
          />
          <span className="flex flex-col leading-none">
            <span className={`text-xl font-extrabold leading-none tracking-tight md:text-[26px] ${textBase}`}>
              NACOS
            </span>
            <span
              className={`mt-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.26em] md:text-xs ${accentText}`}
            >
              ABUAD
            </span>
          </span>
        </NavLink>

        {/* ── Desktop links ────────────────────────────────────────────── */}
        <div
          className="relative hidden items-center justify-self-center lg:flex"
          onMouseLeave={() => setHovered(null)}
        >
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onMouseEnter={() => setHovered(item.path)}
              onFocus={() => setHovered(item.path)}
              className={({ isActive }) =>
                `relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5 ${FOCUS_RING} ${
                  isActive ? accentText : `${textMuted} ${accentHover}`
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {hovered === item.path && (
                    <motion.span
                      layoutId="nav-hover"
                      className={`absolute inset-0 rounded-full ${hoverPill}`}
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.35, ease: EASE_OUT }}
                      className={`absolute inset-x-0 bottom-0.5 z-10 mx-auto h-0.5 w-4 rounded-full ${accentBg}`}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* More dropdown — secondary nav items */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen((s) => !s)}
              onMouseEnter={() => setHovered("more")}
              onFocus={() => setHovered("more")}
              aria-haspopup="menu"
              aria-expanded={isMoreMenuOpen}
              className={`relative flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5 ${FOCUS_RING} ${
                moreActive || isMoreMenuOpen
                  ? accentText
                  : `${textMuted} ${accentHover}`
              }`}
            >
              {hovered === "more" && (
                <motion.span
                  layoutId="nav-hover"
                  className={`absolute inset-0 rounded-full ${hoverPill}`}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10">More</span>
              <ChevronDown
                className={`relative z-10 h-3.5 w-3.5 transition-transform duration-200 ${
                  isMoreMenuOpen ? "rotate-180" : ""
                }`}
              />
              {moreActive && (
                <motion.span
                  layoutId="nav-underline"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className={`absolute inset-x-0 bottom-0.5 z-10 mx-auto h-0.5 w-4 rounded-full ${accentBg}`}
                />
              )}
            </button>

            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  {...popoverMotion}
                  style={{ transformOrigin: "top right" }}
                  role="menu"
                  aria-label="More navigation links"
                  className={`absolute right-0 top-full z-50 mt-3 w-60 rounded-2xl border p-1.5 shadow-2xl ${panel}`}
                >
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        onClick={() => setIsMoreMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                            isActive
                              ? isDark
                                ? "bg-green-500/10 text-green-400"
                                : "bg-green-50 text-[#006E3A]"
                              : menuItemIdle
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 opacity-70" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Desktop right: auth actions ──────────────────────────────── */}
        <div className="hidden items-center gap-2.5 lg:flex xl:gap-3">
          {isAuthenticated ? (
            <>
              {/* Add Project CTA — icon-only until there's room for the label */}
              <NavLink
                to="/projects/new"
                aria-label="Add project"
                title="Add project"
                className={`group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#006E3A] px-3 text-sm font-semibold text-white shadow-md shadow-green-900/20 transition-all duration-200 hover:bg-[#005a30] hover:shadow-lg active:scale-95 xl:px-4 ${FOCUS_RING}`}
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                <span className="hidden xl:inline">Add Project</span>
              </NavLink>

              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition-all duration-200 hover:shadow-md xl:pr-3 ${FOCUS_RING} ${
                    isDark
                      ? "border-white/15 bg-white/5 hover:bg-white/10"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#008a49] to-[#006E3A] ring-2 ring-green-500/20">
                    <span className="text-sm font-semibold text-white">{initial}</span>
                  </span>

                  <span className="hidden flex-col text-left leading-tight xl:flex">
                    <span className={`text-sm font-semibold ${textBase}`}>{firstName}</span>
                    {user?.matric_number && (
                      <span className="text-[11px] text-gray-400">{user.matric_number}</span>
                    )}
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      {...popoverMotion}
                      style={{ transformOrigin: "top right" }}
                      role="menu"
                      aria-label="User menu"
                      className={`absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border shadow-2xl ${panel}`}
                    >
                      {/* User info header */}
                      <div
                        className={`flex items-center gap-3 border-b px-4 py-3.5 ${hairline} ${
                          isDark ? "bg-white/[0.03]" : "bg-green-50/60"
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#008a49] to-[#006E3A]">
                          <span className="font-semibold text-white">{initial}</span>
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${textBase}`}>
                            {user?.full_name}
                          </p>
                          <p className="truncate text-xs text-gray-400">{user?.email}</p>
                          {user?.matric_number && (
                            <p className="text-xs text-gray-400">{user.matric_number}</p>
                          )}
                        </div>
                      </div>

                      {/* Menu links */}
                      <div className="p-1.5">
                        {accountLinks.map(({ to, icon: Icon, label }) => (
                          <NavLink
                            key={to}
                            to={to}
                            role="menuitem"
                            onClick={() => setIsUserMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${FOCUS_RING} ${menuItemIdle}`}
                          >
                            <Icon className="h-4 w-4 text-gray-400" />
                            {label}
                          </NavLink>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div className={`border-t p-1.5 ${hairline}`}>
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 ${
                            isDark ? "hover:bg-red-500/10" : ""
                          } ${FOCUS_RING}`}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${textMuted} ${accentHover} ${
                  isDark ? "hover:bg-white/10" : "hover:bg-gray-900/[0.05]"
                } ${FOCUS_RING}`}
              >
                Sign In
              </NavLink>
              <NavLink
                to="/login?mode=signup"
                className={`group inline-flex h-10 items-center gap-1.5 rounded-full bg-[#006E3A] px-5 text-sm font-semibold text-white shadow-md shadow-green-900/20 transition-all duration-200 hover:bg-[#005a30] hover:shadow-lg active:scale-95 ${FOCUS_RING}`}
              >
                Join NACOS
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </NavLink>
            </>
          )}
        </div>

        {/* ── Mobile menu toggle ───────────────────────────────────────── */}
        <button
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-menu"
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors lg:hidden ${textBase} ${
            isDark ? "hover:bg-white/10 active:bg-white/15" : "hover:bg-gray-100 active:bg-gray-200"
          } ${FOCUS_RING}`}
          onClick={() => setIsMobileOpen((s) => !s)}
        >
          <MenuToggleIcon open={isMobileOpen} />
        </button>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop — tap anywhere outside the drawer to dismiss */}
            <motion.div
              key="backdrop"
              aria-hidden
              onClick={() => setIsMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-full h-[100dvh] touch-none bg-black/40 backdrop-blur-[2px] lg:hidden"
            />

            <motion.div
              key="drawer"
              id="mobile-menu"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ transformOrigin: "top center" }}
              className={`absolute inset-x-3 top-full mt-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-3xl border p-3 shadow-2xl sm:inset-x-6 lg:hidden ${panel}`}
            >
              {/* Signed-in identity card */}
              {isAuthenticated && (
                <motion.div variants={drawerItemVariants}>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileOpen(false)}
                    className={`mb-3 flex items-center gap-3 rounded-2xl p-3 ${FOCUS_RING} ${
                      isDark ? "bg-white/5" : "bg-green-50/70"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#008a49] to-[#006E3A]">
                      <span className="font-semibold text-white">{initial}</span>
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className={`truncate text-sm font-semibold ${textBase}`}>
                        {user?.full_name}
                      </span>
                      <span className="truncate text-xs text-gray-400">
                        {user?.matric_number || user?.email}
                      </span>
                    </span>
                  </NavLink>
                </motion.div>
              )}

              {/* Nav tiles */}
              <motion.p
                variants={drawerItemVariants}
                className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
              >
                Explore
              </motion.p>
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.path} variants={drawerItemVariants}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        onClick={() => setIsMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97] ${FOCUS_RING} ${
                            isActive
                              ? "border-[#006E3A] bg-[#006E3A] text-white shadow-md shadow-green-900/20"
                              : isDark
                              ? "border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/10"
                              : "border-gray-200/80 bg-white text-gray-800 hover:border-green-200 hover:bg-green-50"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="leading-tight">{item.name}</span>
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>

              {isAuthenticated ? (
                <>
                  <motion.p
                    variants={drawerItemVariants}
                    className="px-1 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                  >
                    Your space
                  </motion.p>
                  <div className="flex flex-col">
                    {accountLinks
                      .filter(({ to }) => to !== "/dashboard" && to !== "/profile")
                      .map(({ to, icon: Icon, label }) => (
                        <motion.div key={to} variants={drawerItemVariants}>
                          <NavLink
                            to={to}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${FOCUS_RING} ${menuItemIdle}`}
                          >
                            <Icon className="h-4 w-4 text-gray-400" />
                            {label}
                          </NavLink>
                        </motion.div>
                      ))}
                  </div>

                  <motion.div variants={drawerItemVariants} className="mt-3 flex gap-2">
                    <NavLink
                      to="/projects/new"
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#006E3A] text-sm font-semibold text-white shadow-md shadow-green-900/20 transition-all active:scale-[0.97] hover:bg-[#005a30] ${FOCUS_RING}`}
                    >
                      <Plus className="h-4 w-4" />
                      Add Project
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium text-red-500 transition-colors active:scale-[0.97] ${FOCUS_RING} ${
                        isDark
                          ? "border-white/10 hover:bg-red-500/10"
                          : "border-red-100 hover:bg-red-50"
                      }`}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              ) : (
                <motion.div variants={drawerItemVariants} className="mt-4 flex gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${FOCUS_RING} ${
                      isDark
                        ? "border-white/15 text-white hover:bg-white/10"
                        : "border-gray-300 text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/login?mode=signup"
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex h-12 flex-1 items-center justify-center rounded-xl bg-[#006E3A] text-sm font-semibold text-white shadow-md shadow-green-900/20 transition-all active:scale-[0.97] hover:bg-[#005a30] ${FOCUS_RING}`}
                  >
                    Join NACOS
                  </NavLink>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
