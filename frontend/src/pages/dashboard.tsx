// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProjects } from '../lib/hooks/useProjects';
import { useEvents } from '../lib/hooks/useEvents';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, resourcesAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { motion, AnimatePresence, useInView, easeInOut} from 'framer-motion';
import {
  Mail, Code2, Plus, CalendarDays, BookOpen,
  Users, Rocket, Settings, ChevronRight,
  Bell, BadgeCheck, Hash, Moon, Sun,
} from 'lucide-react';

// ========== Animation Variants ==========
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardHover = {
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

const buttonPress = {
  hover: { scale: 1.02 },
  tap: { scale: 0.96 },
};

const iconHover = {
  hover: { rotate: 3, scale: 1.05, transition: { duration: 0.2 } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const scaleOnHover = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

// ========== Theme Tokens (unchanged) ==========
const LIGHT = {
  page:        'bg-gray-50',
  card:        'bg-white border-gray-100 shadow-sm',
  cardHov:     'hover:border-green-200 hover:shadow-md',
  innerBg:     'bg-green-50 border-green-100',
  t1:          'text-gray-900',
  t2:          'text-gray-500',
  t3:          'text-gray-300',
  divider:     'divide-gray-100',
  field:       'bg-gray-50 border-gray-100',
  fLabel:      'text-gray-400',
  fVal:        'text-gray-800',
  actCard:     'bg-gray-50 border-gray-100 hover:bg-green-50 hover:border-green-200',
  emptyBox:    'bg-gray-100 border-gray-200',
  emptyIco:    'text-gray-300',
  heroBg:      'bg-gradient-to-br from-green-600 to-emerald-700',
  heroSub:     'text-green-100',
  statCard:    'bg-white border-gray-100 shadow-sm',
  comVal:      'text-green-600',
  comLbl:      'text-gray-400',
  evItem:      'bg-gray-50 border-gray-100 hover:bg-green-50 hover:border-green-200',
  ring:        '0 0 0 3px rgba(22,163,74,0.15),0 0 0 6px rgba(22,163,74,0.06)',
  btnGhost:    'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  btnPrimary:  'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-200',
  alertBg:     'bg-amber-50 border-amber-200',
  alertT:      'text-amber-800',
  alertD:      'text-amber-700',
  alertBtn:    'bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200',
  alertGhost:  'border-gray-200 text-gray-600 hover:bg-gray-100',
  badgeBg:     'bg-green-100 border-green-200 text-green-700',
  badgeDot:    'bg-green-500',
  profHero:    'bg-green-50 border-green-100',
  link:        'text-green-600 hover:text-green-700',
  notif:       'bg-white/20 border-white/30 text-white hover:bg-white/30',
  toggle:      'bg-white/20 border-white/30 text-white hover:bg-white/30',
  newProj:     'bg-white text-green-700 hover:bg-green-50 hover:shadow-green-200',
  gridClr:     'rgba(22,163,74,0.04)',
  glowClr:     'rgba(22,163,74,0.06)',
} as const;

const DARK = {
  page:        'bg-[#0a0f1e]',
  card:        'bg-[#161d2e] border-white/[0.07]',
  cardHov:     'hover:border-white/[0.14]',
  innerBg:     'bg-green-500/[0.05] border-green-500/10',
  t1:          'text-white',
  t2:          'text-slate-400',
  t3:          'text-slate-600',
  divider:     'divide-white/[0.07]',
  field:       'bg-white/[0.04] border-white/[0.07]',
  fLabel:      'text-slate-500',
  fVal:        'text-white',
  actCard:     'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]',
  emptyBox:    'bg-white/[0.04] border-white/10',
  emptyIco:    'text-slate-600',
  heroBg:      'bg-[#111827] border-b border-white/[0.07]',
  heroSub:     'text-slate-400',
  statCard:    'bg-[#161d2e] border-white/[0.07]',
  comVal:      'text-green-400',
  comLbl:      'text-slate-500',
  evItem:      'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/10',
  ring:        '0 0 0 3px rgba(22,163,74,0.22),0 0 0 7px rgba(22,163,74,0.09)',
  btnGhost:    'bg-white/[0.05] border-white/[0.07] text-slate-300 hover:bg-white/[0.09] hover:text-white',
  btnPrimary:  'bg-green-600 hover:bg-green-500 text-white hover:shadow-green-900/40',
  alertBg:     'bg-amber-500/[0.07] border-amber-500/20',
  alertT:      'text-amber-300',
  alertD:      'text-slate-400',
  alertBtn:    'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25',
  alertGhost:  'border-white/[0.07] text-slate-400 hover:text-white hover:border-white/[0.14]',
  badgeBg:     'bg-green-500/10 border-green-500/20 text-green-400',
  badgeDot:    'bg-green-400',
  profHero:    'bg-green-500/[0.05] border-green-500/10',
  link:        'text-green-400 hover:text-green-300',
  notif:       'bg-white/[0.06] border-white/[0.09] text-slate-300 hover:bg-white/[0.1] hover:text-white',
  toggle:      'bg-white/[0.06] border-white/[0.09] text-slate-300 hover:bg-white/[0.1] hover:text-white',
  newProj:     'bg-green-600 hover:bg-green-500 text-white hover:shadow-green-900/40',
  gridClr:     'rgba(22,163,74,0.025)',
  glowClr:     'rgba(22,163,74,0.07)',
} as const;

type T = typeof LIGHT;

const syne = { fontFamily: "'Syne', sans-serif" } as const;
const ic = (l: string, d: string) => (isDark: boolean) => isDark ? d : l;

// ========== Sub-components with Enhanced Animations ==========
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: string;
  trendCls: string;
  accent: string;
  iconBg: string;
  i: number;
  t: T;
}
const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend, trendCls, accent, iconBg, i, t }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      custom={i}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUp}
      whileHover="hover"
      variants={cardHover}
      className={`relative ${t.statCard} border rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-200`}
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] ${accent}`} />
      <motion.div
        className={`w-8 h-8 sm:w-9 sm:h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
        whileHover="hover"
        variants={iconHover}
      >
        {icon}
      </motion.div>
      <motion.div
        className={`text-2xl sm:text-[28px] font-extrabold ${t.t1} leading-none mb-1`}
        style={syne}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {value}
      </motion.div>
      <div className={`text-[11px] sm:text-xs ${t.t2} leading-snug`}>{label}</div>
      <span className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${trendCls}`}>
        {trend}
      </span>
    </motion.div>
  );
};

interface ActionCardProps {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc: string;
  t: T;
}
const ActionCard: React.FC<ActionCardProps> = ({ to, icon, iconBg, label, desc, t }) => (
  <motion.div whileHover="hover" whileTap="tap" variants={cardHover}>
    <Link
      to={to}
      className={`flex items-center gap-3 p-3.5 border rounded-xl ${t.actCard} transition-all duration-200 group`}
    >
      <div className={`w-8 h-8 sm:w-9 sm:h-9 ${iconBg} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${t.t1} leading-tight`}>{label}</div>
        <div className={`text-[11px] ${t.t2} mt-0.5`}>{desc}</div>
      </div>
      <ChevronRight className={`w-3.5 h-3.5 ${t.t3} ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Link>
  </motion.div>
);

interface EventItemProps {
  day: string;
  month: string;
  title: string;
  meta: string;
  tag: string;
  dayClr: string;
  monthClr: string;
  boxBg: string;
  tagCls: string;
  t: T;
}
const EventItem: React.FC<EventItemProps> = ({ day, month, title, meta, tag, dayClr, monthClr, boxBg, tagCls, t }) => (
  <motion.div
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center gap-3 p-3 border rounded-xl ${t.evItem} cursor-pointer transition-all duration-200`}
  >
    <div className={`w-10 h-11 ${boxBg} rounded-xl flex flex-col items-center justify-center flex-shrink-0`}>
      <span className={`font-extrabold text-sm sm:text-base leading-none ${dayClr}`} style={syne}>{day}</span>
      <span className={`text-[9px] tracking-widest uppercase font-medium mt-0.5 ${monthClr}`}>{month}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${t.t1} truncate`}>{title}</div>
      <div className={`text-[11px] ${t.t2} mt-0.5 truncate`}>{meta}</div>
    </div>
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap ${tagCls}`}>{tag}</span>
  </motion.div>
);

interface ProjectItemProps {
  id: number;
  title: string;
  description: string;
  tags?: { name: string }[];
  t: T;
}
const ProjectItem: React.FC<ProjectItemProps> = ({ id, title, description, tags, t }) => (
  <motion.div whileHover="hover" whileTap="tap" variants={cardHover}>
    <Link
      to={`/projects/${id}`}
      className={`flex items-start gap-3 p-3 border rounded-xl ${t.actCard} transition-all duration-200`}
    >
      <div className={`w-8 h-8 ${t.innerBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Code2 className={`w-4 h-4 ${t.t1}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${t.t1} truncate`}>{title}</div>
        <div className={`text-[11px] ${t.t2} mt-0.5 line-clamp-2`}>{description}</div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className={`text-[9px] ${t.badgeBg} px-1.5 py-0.5 rounded-full`}>{tag.name}</span>
            ))}
            {tags.length > 2 && <span className="text-[9px] text-gray-400">+{tags.length - 2}</span>}
          </div>
        )}
      </div>
      <ChevronRight className={`w-3.5 h-3.5 ${t.t3} ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Link>
  </motion.div>
);

// ========== Main Component ==========
export const DashboardPage: React.FC = () => {
  const { user, resendVerificationEmail, isLoading: authLoading } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const t = isDark ? DARK : LIGHT;

  // Fetch user's projects
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [projectsError, setProjectsError] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Fetch upcoming events
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const upcomingEvents = eventsData?.results?.filter((e: any) => e.status === 'upcoming') || [];
  const eventCount = upcomingEvents.length;

  // Fetch active members count (total users)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => usersAPI.getCount().then(res => res.data),
    retry: 1,
  });
  const activeMembersCount = usersData?.count ?? '—';

  // Fetch resources count
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', 'count'],
    queryFn: () => resourcesAPI.getCount().then(res => res.data),
    retry: 1,
  });
  const resourcesCount = resourcesData?.count ?? '—';

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const { projectsAPI } = await import('../lib/api');
        const res = await projectsAPI.getMyProjects();
        const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setMyProjects(data);
      } catch (err) {
        console.error('Failed to fetch my projects', err);
        setProjectsError(true);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchMyProjects();
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  // Helper to format event date
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = getGreeting();

  // Refs for scroll animations
  const statsRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });
  const leftInView = useInView(leftColRef, { once: true, amount: 0.2 });
  const rightInView = useInView(rightColRef, { once: true, amount: 0.2 });

  return (
    <div className={`min-h-screen flex flex-col font-dm ${t.page} transition-colors duration-300`}>
      {/* Subtle grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(${t.gridClr} 1px,transparent 1px),linear-gradient(90deg,${t.gridClr} 1px,transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* Ambient glow */}
      <motion.div
        className="fixed -top-40 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none z-0"
        style={{ background: `radial-gradient(circle,${t.glowClr} 0%,transparent 70%)` }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: easeInOut as const,
        }}
      />

      <Navbar />

      <main className="flex-grow relative z-10">
        {/* HERO */}
        <div className={`${t.heroBg} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
            >
              <motion.div variants={fadeIn}>
                <motion.p
                  className={`text-[11px] tracking-[2px] uppercase font-medium mb-1.5 ${isDark ? 'text-green-400' : 'text-green-200'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {greeting}
                </motion.p>
                <motion.h1
                  className="font-extrabold text-[clamp(26px,5vw,48px)] text-white leading-[1.1] tracking-tight"
                  style={syne}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                >
                  Welcome back,{' '}
                  <span className={isDark ? 'bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent' : ''}>
                    {user?.full_name?.split(' ')[0] ?? 'Student'}
                  </span>!
                </motion.h1>
                <motion.p
                  className={`text-sm mt-2 ${t.heroSub}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  NACOS ABUAD Innovation Portal · Computing Department
                </motion.p>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-2 sm:gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <motion.button
                  onClick={() => setIsDark(!isDark)}
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-all duration-200 ${t.toggle}`}
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonPress}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span className="hidden xs:inline">{isDark ? 'Light' : 'Dark'}</span>
                </motion.button>
                <motion.button
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-all duration-200 ${t.notif}`}
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonPress}
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </motion.button>
                <motion.div whileHover="hover" whileTap="tap" variants={buttonPress}>
                  <Link
                    to="/projects/new"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${t.newProj}`}
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* PAGE BODY */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5 sm:gap-6">
            {/* Email verification banner with AnimatePresence */}
            <AnimatePresence>
              {user && !user.is_email_verified && (
                <motion.div
                  custom={2}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border rounded-2xl p-4 ${t.alertBg} transition-colors duration-300`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <motion.div
                      className={`w-8 h-8 ${isDark ? 'bg-amber-500/15' : 'bg-amber-100'} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Mail className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    </motion.div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${t.alertT}`}>Verify your email address</p>
                      <p className={`text-xs mt-0.5 ${t.alertD} break-all sm:break-normal`}>
                        We sent a link to <strong className={isDark ? 'text-slate-300' : 'text-amber-900'}>{user.email}</strong> — click it to activate your account.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 pl-11 sm:pl-0">
                    <motion.div whileHover="hover" whileTap="tap" variants={buttonPress}>
                      <Link
                        to="/verify-email"
                        className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${t.alertBtn}`}
                      >
                        Verify Email
                      </Link>
                    </motion.div>
                    <motion.button
                      onClick={resendVerificationEmail}
                      disabled={authLoading}
                      className={`px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors disabled:opacity-40 ${t.alertGhost}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {authLoading ? 'Sending…' : 'Resend'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats row with scroll animation */}
            <motion.div
              ref={statsRef}
              initial="hidden"
              animate={statsInView ? "visible" : "hidden"}
              variants={staggerContainer}
              className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
            >
              <StatCard
                i={3}
                value={myProjects.length.toString()}
                label="Projects Submitted"
                trend="Get started"
                accent="bg-green-500"
                iconBg={isDark ? 'bg-green-500/10' : 'bg-green-100'}
                trendCls={isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}
                icon={<Rocket className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />}
                t={t}
              />
              <StatCard
                i={4}
                value={eventCount.toString()}
                label="Upcoming Events"
                trend="This month"
                accent="bg-violet-500"
                iconBg={isDark ? 'bg-violet-500/10' : 'bg-violet-100'}
                trendCls={isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'}
                icon={<CalendarDays className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />}
                t={t}
              />
              <StatCard
                i={5}
                value={resourcesLoading ? '...' : (resourcesCount === '—' ? '2000+' : resourcesCount.toString())}
                label="Resources"
                trend="New uploads"
                accent="bg-blue-500"
                iconBg={isDark ? 'bg-blue-500/10' : 'bg-blue-100'}
                trendCls={isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'}
                icon={<BookOpen className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />}
                t={t}
              />
              <StatCard
                i={6}
                value={usersLoading ? '...' : (activeMembersCount === '—' ? '250+' : activeMembersCount.toString())}
                label="Active Members"
                trend="+12 this week"
                accent="bg-amber-500"
                iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
                trendCls={isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'}
                icon={<Users className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />}
                t={t}
              />
            </motion.div>

            {/* Main two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5 sm:gap-6">
              {/* LEFT COLUMN */}
              <motion.div
                ref={leftColRef}
                initial="hidden"
                animate={leftInView ? "visible" : "hidden"}
                variants={staggerContainer}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Your Projects */}
                <motion.div variants={slideInLeft} className={`${t.card} border rounded-2xl overflow-hidden transition-colors duration-300`}>
                  <div className="flex items-center justify-between p-5 sm:p-6">
                    <div>
                      <h2 className={`font-bold text-base sm:text-lg ${t.t1}`} style={syne}>Your Projects</h2>
                      <p className={`text-xs sm:text-sm ${t.t2} mt-0.5`}>Manage and showcase your innovative work</p>
                    </div>
                    <Link to="/my-projects" className={`text-xs font-medium transition-colors ${t.link} whitespace-nowrap ml-4`}>
                      View all →
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/[0.05] p-5 sm:p-6">
                    {projectsLoading ? (
                      <div className="flex justify-center py-8">
                        <motion.div
                          className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                      </div>
                    ) : projectsError ? (
                      <p className={`text-sm ${t.t2} text-center`}>Failed to load projects. Try again later.</p>
                    ) : myProjects.length === 0 ? (
                      <motion.div
                        className="flex flex-col items-center text-center py-8"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 ${t.emptyBox} border-2 border-dashed rounded-2xl flex items-center justify-center mb-4`}>
                          <Code2 className={`w-6 h-6 sm:w-7 sm:h-7 ${t.emptyIco}`} />
                        </div>
                        <h3 className={`font-bold text-sm sm:text-base ${t.t1} mb-2`} style={syne}>No projects yet</h3>
                        <p className={`text-xs sm:text-sm ${t.t2} max-w-xs leading-relaxed mb-5`}>
                          Start building your portfolio by showcasing your first project to the NACOS community.
                        </p>
                        <motion.div whileHover="hover" whileTap="tap" variants={buttonPress}>
                          <Link
                            to="/projects/new"
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${t.btnPrimary}`}
                          >
                            <Plus className="w-4 h-4" />
                            Create Your First Project
                          </Link>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {myProjects.slice(0, 3).map((project) => (
                          <ProjectItem
                            key={project.id}
                            id={project.id}
                            title={project.title}
                            description={project.description}
                            tags={project.tags}
                            t={t}
                          />
                        ))}
                        {myProjects.length > 3 && (
                          <Link to="/my-projects" className={`block text-center text-xs font-medium ${t.link} mt-2`}>
                            + {myProjects.length - 3} more project{myProjects.length - 3 !== 1 ? 's' : ''}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={slideInLeft} className={`${t.card} border rounded-2xl p-5 sm:p-6 transition-colors duration-300`}>
                  <h2 className={`font-bold text-base sm:text-lg ${t.t1} mb-0.5`} style={syne}>Quick Actions</h2>
                  <p className={`text-xs ${t.t2} mb-4`}>Jump to what you need</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionCard to="/projects/new" iconBg={isDark ? 'bg-green-500/10' : 'bg-green-100'} label="Add Project" desc="Showcase your work" icon={<Plus className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />} t={t} />
                    <ActionCard to="/events" iconBg={isDark ? 'bg-violet-500/10' : 'bg-violet-100'} label="Browse Events" desc="Workshops & meetups" icon={<CalendarDays className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />} t={t} />
                    <ActionCard to="/resources" iconBg={isDark ? 'bg-blue-500/10' : 'bg-blue-100'} label="Resources" desc="Study materials" icon={<BookOpen className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />} t={t} />
                    <ActionCard to="/profile" iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'} label="Edit Profile" desc="Update your info" icon={<Settings className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />} t={t} />
                  </div>
                </motion.div>

                {/* Community Overview */}
                <motion.div variants={slideInLeft} className={`${t.card} border rounded-2xl p-5 sm:p-6 transition-colors duration-300`}>
                  <h2 className={`font-bold text-base sm:text-lg ${t.t1} mb-0.5`} style={syne}>Community Overview</h2>
                  <p className={`text-xs ${t.t2} mb-5`}>NACOS ABUAD at a glance</p>
                  <div className={`grid grid-cols-2 sm:grid-cols-4 ${t.divider} divide-x`}>
                    {[['250+', 'Active Students'], ['120+', 'Projects'], ['36+', 'Events'], ['2000+', 'Resources']].map(([val, label]) => (
                      <div key={label} className="text-center px-2 sm:px-4 py-2">
                        <motion.div
                          className={`font-extrabold text-xl sm:text-2xl ${t.comVal}`}
                          style={syne}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {val}
                        </motion.div>
                        <div className={`text-[11px] sm:text-xs ${t.comLbl} mt-1`}>{label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT COLUMN */}
              <motion.div
                ref={rightColRef}
                initial="hidden"
                animate={rightInView ? "visible" : "hidden"}
                variants={staggerContainer}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Profile Card */}
                <motion.div variants={slideInRight} className={`${t.card} border rounded-2xl p-5 sm:p-6 transition-colors duration-300`}>
                  <motion.div
                    className={`flex flex-col items-center text-center p-5 ${t.profHero} border rounded-xl mb-4`}
                    whileHover={{ y: -2 }}
                  >
                    <motion.div
                      className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl mb-3"
                      style={{ ...syne, boxShadow: t.ring }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    >
                      {initials}
                    </motion.div>
                    <div className={`font-bold text-base sm:text-lg ${t.t1} leading-tight`} style={syne}>
                      {user?.full_name}
                    </div>
                    <div className={`text-xs ${t.t2} mt-1 mb-3`}>300 Level · Computer Science</div>
                    <div className={`inline-flex items-center gap-1.5 border text-[11px] font-medium px-3 py-1 rounded-full ${t.badgeBg}`}>
                      <span className={`w-1.5 h-1.5 ${t.badgeDot} rounded-full`} />
                      Active Member
                    </div>
                  </motion.div>

                  <div className="flex flex-col gap-2.5 mb-4">
                    {[
                      { icon: <Hash className="w-3 h-3" />, label: 'Matric No.', val: user?.matric_number },
                      { icon: <Mail className="w-3 h-3" />, label: 'Email', val: user?.email },
                      { icon: <BadgeCheck className="w-3 h-3" />, label: 'Member Since', val: memberSince },
                    ].map(({ icon, label, val }) => (
                      <motion.div
                        key={label}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 ${t.field} border rounded-xl`}
                        whileHover={{ x: 4 }}
                      >
                        <span className={`flex items-center gap-1.5 text-[11px] ${t.fLabel} flex-shrink-0`}>
                          {icon} {label}
                        </span>
                        <span className={`text-[12px] font-medium ${t.fVal} truncate text-right max-w-[160px]`}>
                          {val ?? '—'}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div whileHover="hover" whileTap="tap" variants={buttonPress}>
                    <Link
                      to="/profile"
                      className={`flex items-center justify-center gap-2 w-full py-2.5 border rounded-xl text-sm font-medium transition-all duration-200 ${t.btnGhost}`}
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div variants={slideInRight} className={`${t.card} border rounded-2xl p-5 sm:p-6 transition-colors duration-300`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className={`font-bold text-base sm:text-lg ${t.t1}`} style={syne}>Upcoming Events</h2>
                      <p className={`text-xs ${t.t2} mt-0.5`}>Don't miss out</p>
                    </div>
                    <Link to="/events" className={`text-xs font-medium transition-colors ${t.link} whitespace-nowrap ml-4`}>
                      All events →
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {eventsLoading ? (
                      <div className="flex justify-center py-4">
                        <motion.div
                          className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                      </div>
                    ) : upcomingEvents.length === 0 ? (
                      <p className={`text-sm ${t.t2} text-center py-4`}>No upcoming events at the moment.</p>
                    ) : (
                      upcomingEvents.slice(0, 3).map((event: any) => {
                        const { day, month } = formatEventDate(event.start_time);
                        return (
                          <EventItem
                            key={event.id}
                            day={day}
                            month={month}
                            title={event.title}
                            meta={event.is_remote ? 'Remote' : event.location}
                            tag={event.status === 'upcoming' ? 'Upcoming' : event.status}
                            dayClr={isDark ? 'text-green-400' : 'text-green-600'}
                            monthClr={isDark ? 'text-green-300' : 'text-green-500'}
                            boxBg={isDark ? 'bg-green-500/10' : 'bg-green-100'}
                            tagCls={isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'}
                            t={t}
                          />
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};