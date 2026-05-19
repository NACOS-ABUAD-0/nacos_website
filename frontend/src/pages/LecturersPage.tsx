// frontend/src/pages/LecturersPage.tsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";

// ── Types ──────────────────────────────────────────────
type Lecturer = {
  id: number;
  name: string;
  position: string;
  office: string;
  image: string;
};

// ── Data ───────────────────────────────────────────────
const lecturers: Lecturer[] = [
  {
    id: 1,
    name: "Professor Bunmi Abiola",
    position: "Head of Department",
    office: "D54 college of Science",
    image: "/images/lecturers/Hod.png",
  },

  {
    id: 2,
    name: "Dr. Awoyemi Oloruntoba",
    position: "300 level advisor",
    office: "D 04 College of Science",
    image: "/images/lecturers/Dr Awoyemi Oloruntoba.jpg",
  },
  {
    id: 3,
    name: "Mr. Awopetu Felix",
    position: "Lecturer",
    office: "Coming soon",
    image: "/images/lecturers/Mr Awopetu Felix.jpg",
  },
  {
    id: 4,
    name: "Mr. Sayan Oluwafemi",
    position: "Lecturer",
    office: "D24 College of Science",
    image: "/images/lecturers/Mr Sayan Oluwafemi.jpg", // ⚠️ Convert to .jpg/.png for browser support
  },

];

// ── Helpers ────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .filter((n) => n.length > 1)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getGradient(id: number) {
  const gradients = [
    "from-emerald-500 to-teal-700",
    "from-blue-500 to-indigo-700",
    "from-violet-500 to-purple-700",
    "from-rose-500 to-pink-700",
    "from-amber-500 to-orange-700",
    "from-cyan-500 to-sky-700",
  ];
  return gradients[(id - 1) % gradients.length];
}

// ── Animation Config ───────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ── Components ───────────────────────────────────────
const LecturerCard = ({ lecturer }: { lecturer: Lecturer }) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = lecturer.image && !imgError;
  const gradient = getGradient(lecturer.id);

  return (
    <motion.article
      variants={itemVariants}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-500 ease-out hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:border-gray-200/80 hover:-translate-y-1"
    >
      {/* Large Image Area */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-50">
        {hasImage ? (
          <img
            src={lecturer.image}
            alt={lecturer.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="text-white font-semibold text-3xl tracking-tight">
              {getInitials(lecturer.name)}
            </span>
            <span className="text-white/60 text-xs mt-2 font-medium tracking-wider uppercase">
              {lecturer.position}
            </span>
          </div>
        )}

        {/* Subtle bottom gradient fade into card */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-7 md:p-8">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#006E3A]">
            {lecturer.position}
          </p>

          <h3 className="text-xl font-semibold text-gray-900 tracking-tight leading-snug">
            {lecturer.name}
          </h3>

          <div className="w-8 h-px bg-gray-200 group-hover:w-12 group-hover:bg-[#006E3A]/20 transition-all duration-300" />

          <p className="text-sm text-gray-500 leading-relaxed">
            {lecturer.office}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

export default function LecturersPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return lecturers;
    const q = search.toLowerCase();
    return lecturers.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.position.toLowerCase().includes(q) ||
        l.office.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-[#FAFBFC] antialiased selection:bg-green-50 selection:text-[#006E3A]">
      <Navbar />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-2xl"
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#006E3A] mb-5">
              Department of Computing · ABUAD
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-gray-900 tracking-tight leading-[1.1]">
              Our Faculty
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
              Meet the dedicated educators and researchers guiding the next
              generation of computing professionals.
            </p>
          </motion.div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-14"
        >
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <input
              type="text"
              aria-label="Search lecturers"
              placeholder="Search by name, position, or office..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-green-200 focus:ring-[3px] focus:ring-green-50/60 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Results Summary */}
        <div className="mb-10 flex items-baseline justify-between">
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
            lecturer{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Lecturer Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="text-gray-400 text-lg font-light">
              No lecturers found matching "{search}"
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map((lecturer) => (
              <LecturerCard key={lecturer.id} lecturer={lecturer} />
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}