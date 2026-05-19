// frontend/src/pages/LecturersPage.tsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, BookOpen, Mail, Phone, ChevronRight, GraduationCap, Briefcase } from "lucide-react";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import PageHeader from "../components/PageHeader";

type Lecturer = {
  id: number;
  name: string;
  position: string;
  office: string;
  department: string;
  email: string;
  phone?: string;
  courses: string[];
  image: string;
  specialization: string;
};

const lecturers: Lecturer[] = [
  {
    id: 1,
    name: "Dr. Awoyemi Oloruntoba",
    position: "Senior Lecturer",
    office: "Room 204, Faculty of Computing Block A",
    department: "Computer Science",
    email: "awoyemi.oloruntoba@abuad.edu.ng",
    phone: "+234 803 XXX XXXX",
    courses: ["Data Structures & Algorithms", "Discrete Mathematics"],
    image: "/images/lecturers/Dr Awoyemi Oloruntoba.jpg",
    specialization: "Algorithms & Computational Theory",
  },
  {
    id: 2,
    name: "Mr. Awopetu Felix",
    position: "Lecturer I",
    office: "Room 110, Faculty of Computing Block B",
    department: "Computer Science",
    email: "awopetu.felix@abuad.edu.ng",
    phone: "+234 806 XXX XXXX",
    courses: ["Web Programming", "Software Engineering"],
    image: "/images/lecturers/Mr Awopetu Felix.jpg",
    specialization: "Software Development & Web Technologies",
  },
  {
    id: 3,
    name: "Mr. Sayan Oluwafemi",
    position: "Lecturer II",
    office: "Room 315, Faculty of Computing Block A",
    department: "Computer Science",
    email: "sayan.oluwafemi@abuad.edu.ng",
    phone: "+234 809 XXX XXXX",
    courses: ["Database Management Systems", "Systems Analysis"],
    image: "/images/lecturers/Mr Sayan Oluwafemi.HEIC",
    specialization: "Database Systems & Information Management",
  },
  // Placeholder entries to showcase the design with more cards
  {
    id: 4,
    name: "Dr. Adeyemi Blessing",
    position: "Associate Professor",
    office: "Room 401, Faculty of Computing Block C",
    department: "Computer Science",
    email: "adeyemi.blessing@abuad.edu.ng",
    courses: ["Artificial Intelligence", "Machine Learning"],
    image: "",
    specialization: "AI & Machine Learning",
  },
  {
    id: 5,
    name: "Mrs. Okonkwo Chidinma",
    position: "Lecturer I",
    office: "Room 208, Faculty of Computing Block B",
    department: "Computer Science",
    email: "okonkwo.chidinma@abuad.edu.ng",
    courses: ["Computer Networks", "Cybersecurity"],
    image: "",
    specialization: "Network Security & Distributed Systems",
  },
  {
    id: 6,
    name: "Prof. Babatunde Rasheed",
    position: "Professor & HOD",
    office: "Room 100, HOD Office Block A",
    department: "Computer Science",
    email: "babatunde.rasheed@abuad.edu.ng",
    courses: ["Research Methods", "Advanced OS"],
    image: "",
    specialization: "Operating Systems & HPC",
  },
];

const positionColors: Record<string, { bg: string; text: string; border: string }> = {
  "Professor & HOD":   { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  "Associate Professor": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Senior Lecturer":   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Lecturer I":        { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Lecturer II":       { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
};

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
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
  ];
  return gradients[(id - 1) % gradients.length];
}

const LecturerCard = ({ lecturer, index }: { lecturer: Lecturer; index: number }) => {
  const [flipped, setFlipped] = useState(false);
  const posStyle = positionColors[lecturer.position] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };
  const gradient = getGradient(lecturer.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group h-[420px] cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Top gradient banner */}
          <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-end px-6 pb-4`}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
            />
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${posStyle.bg} ${posStyle.text} ${posStyle.border} bg-white/90`}>
              {lecturer.position}
            </span>
          </div>

          {/* Avatar */}
          <div className="relative px-6">
            <div className="absolute -top-10 left-6 w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-md">
              {lecturer.image ? (
                <img
                  src={lecturer.image}
                  alt={lecturer.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`${lecturer.image ? "hidden" : ""} w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                <span className="text-white font-bold text-xl">{getInitials(lecturer.name)}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pt-12 px-6 pb-6">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{lecturer.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{lecturer.specialization}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#006E3A] mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600 leading-relaxed">{lecturer.office}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#006E3A] shrink-0" />
                <span className="text-xs text-gray-600 truncate">{lecturer.email}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {lecturer.courses.slice(0, 1).map((c) => (
                  <span key={c} className="text-[10px] bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5">
                    {c}
                  </span>
                ))}
                {lecturer.courses.length > 1 && (
                  <span className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 rounded-full px-2 py-0.5">
                    +{lecturer.courses.length - 1} more
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                Tap for details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className={`absolute inset-0 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br ${gradient} text-white`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
          <div className="relative h-full flex flex-col justify-between p-6">
            <div>
              <p className="text-white/60 text-xs mb-1 uppercase tracking-widest font-semibold">Full Details</p>
              <h3 className="font-bold text-xl leading-tight">{lecturer.name}</h3>
              <p className="text-white/80 text-sm mt-1">{lecturer.position}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide">Office</p>
                    <p className="text-sm font-medium">{lecturer.office}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-white/70" />
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium break-all">{lecturer.email}</p>
                  </div>
                </div>
                {lecturer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0 text-white/70" />
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium">{lecturer.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-white/70" />
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Courses Taught</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {lecturer.courses.map((c) => (
                    <span key={c} className="text-[10px] bg-white/20 text-white rounded-full px-2 py-0.5 border border-white/20">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-center text-white/40 text-xs">Tap to flip back</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LecturersPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const positions = [...new Set(lecturers.map((l) => l.position))];

  const filtered = useMemo(() => {
    return lecturers.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        l.name.toLowerCase().includes(q) ||
        l.position.toLowerCase().includes(q) ||
        l.office.toLowerCase().includes(q) ||
        l.specialization.toLowerCase().includes(q) ||
        l.courses.some((c) => c.toLowerCase().includes(q));
      const matchPos = positionFilter ? l.position === positionFilter : true;
      return matchSearch && matchPos;
    });
  }, [search, positionFilter]);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003d20] via-[#006E3A] to-[#00a558]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <GraduationCap className="w-4 h-4" />
              Department of Computer Science · ABUAD
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Our Faculty <span className="text-green-300">&</span> Lecturers
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
              Brilliant minds shaping the next generation of tech leaders. Tap any card to reveal full contact details.
            </p>
            <div className="mt-6 flex justify-center gap-6 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {lecturers.length} Lecturers</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {[...new Set(lecturers.flatMap(l => l.courses))].length} Courses</span>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="relative">
          <svg className="w-full h-12 text-gray-50" viewBox="0 0 1440 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,48 L0,24 Q360,0 720,24 Q1080,48 1440,24 L1440,48 Z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 sticky top-[68px] z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              placeholder="Search by name, course, office..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          >
            <option value="">All Positions</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-2">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of {lecturers.length} lecturers
          {positionFilter && <> · <span className="text-[#006E3A] font-medium">{positionFilter}</span></>}
        </p>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 pt-4 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No lecturers found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((lecturer, i) => (
              <LecturerCard key={lecturer.id} lecturer={lecturer} index={i} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}