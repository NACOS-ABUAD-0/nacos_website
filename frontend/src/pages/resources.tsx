import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import api from "../lib/api";
import { resourcesAPI, cloudinaryAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useScrollLock } from "../lib/hooks/useScrollLock";

import {
  Search,
  Download,
  Eye,
  FileText,
  Upload,
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";

interface Resource {
  id: number | string;
  title: string;
  description: string;
  url: string;
  download_url?: string;
  course_code?: string;
  year?: string;
  file_type: string;
  file_size?: number;
  file_size_display: string;
  file_icon: string;
  download_count: number;
  category?: { id: number; name: string };
  tags: Array<{ id: number; name: string }>;
  created_at: string;
  submitted_by?: { id: number; full_name: string } | null;
}

interface ResourceCategory {
  id: number;
  name: string;
}

// ─── Level / folder classification ──────────────────────────────────────────
// The first digit of a course code is its level: CSC 309 → 300 level,
// CSC 101 → 100 level. Drive-synced files often have no course_code, so
// fall back to finding one in the title ("phy 101exam.pdf", "CSC_102 Note"),
// then to an explicit level in the title ("200lvl 1st Semester.pdf").

const LEVELS = [100, 200, 300, 400] as const;
// "images" holds every photo/scan regardless of course code — it has no
// Notes/PDFs split and opens straight onto its file list.
type LevelKey = (typeof LEVELS)[number] | "other" | "images";
type FolderKey = "notes" | "pdfs";

const isLevel = (n: number): n is (typeof LEVELS)[number] =>
  (LEVELS as readonly number[]).includes(n);

const COURSE_CODE_RE = /(?<![A-Za-z])([A-Za-z]{3})\s*[_-]?\s*(\d{3})(?!\d)/;
const LEVEL_IN_TITLE_RE = /(?<!\d)([1-4])00\s*(?:l|lvl|level)(?![a-z])/i;
const NOTE_RE = /(?<![a-z])notes?(?![a-z])/i;

const getCourseCode = (r: Resource): string | null => {
  if (r.course_code) return r.course_code.toUpperCase().replace(/\s+/g, "");
  const m = r.title.match(COURSE_CODE_RE);
  return m ? `${m[1]}${m[2]}`.toUpperCase() : null;
};

const isImage = (r: Resource) => r.file_type.startsWith("image/");

const getLevel = (r: Resource): LevelKey => {
  if (isImage(r)) return "images";
  const code = getCourseCode(r);
  const digit = code?.match(/\d/)?.[0] ?? r.title.match(LEVEL_IN_TITLE_RE)?.[1];
  const level = digit ? parseInt(digit) * 100 : NaN;
  return isLevel(level) ? level : "other";
};

const getFolder = (r: Resource): FolderKey =>
  NOTE_RE.test(r.title) ? "notes" : "pdfs";

const FOLDERS: Record<FolderKey, { label: string; hint: string }> = {
  notes: { label: "Notes", hint: "Lecture & class notes" },
  pdfs: { label: "PDFs", hint: "Past questions, tests & other files" },
};

const levelLabel = (l: LevelKey) =>
  l === "other" ? "Other" : l === "images" ? "Images" : `${l} Level`;

// CSC courses first, then by course code, then title.
const compareResources = (a: Resource, b: Resource) => {
  const ac = getCourseCode(a) ?? "~";
  const bc = getCourseCode(b) ?? "~";
  const aCsc = ac.startsWith("CSC") ? 0 : 1;
  const bCsc = bc.startsWith("CSC") ? 0 : 1;
  return aCsc - bCsc || ac.localeCompare(bc) || a.title.localeCompare(b.title);
};

const MAX_SEARCH_RESULTS = 100;

const ALLOWED_FILE_TYPES =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt";
const MAX_FILE_SIZE_MB = 20;

export const ResourcesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Current folder lives in the URL (?level=300&folder=notes) so the
  // browser back button walks back up the folder tree.
  const [searchParams, setSearchParams] = useSearchParams();
  const levelParam = searchParams.get("level");
  const currentLevel: LevelKey | null =
    levelParam === "other" || levelParam === "images"
      ? levelParam
      : isLevel(Number(levelParam))
      ? (Number(levelParam) as LevelKey)
      : null;
  const folderParam = searchParams.get("folder");
  const currentFolder: FolderKey | null =
    currentLevel && currentLevel !== "images" && (folderParam === "notes" || folderParam === "pdfs")
      ? folderParam
      : null;

  const openFolder = (level: LevelKey | null, folder: FolderKey | null = null) => {
    const next: Record<string, string> = {};
    if (level) next.level = String(level);
    if (level && folder) next.folder = folder;
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Community submitted resources ────────────────────────────────────────
  // Approved student submissions are filed into the same level folders as
  // the Drive-synced files.
  const [communityResources, setCommunityResources] = useState<Resource[]>([]);

  const fetchCommunityResources = async () => {
    try {
      const response = await resourcesAPI.getResources();
      setCommunityResources(response.data.results ?? response.data ?? []);
    } catch {
      // Silently ignore — the Drive-synced list still works.
    }
  };

  useEffect(() => {
    fetchCommunityResources();
  }, []);

  // ─── Submit a Resource form ────────────────────────────────────────────────
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitCourseCode, setSubmitCourseCode] = useState("");
  const [submitYear, setSubmitYear] = useState("");
  const [submitCategoryId, setSubmitCategoryId] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lock background scroll while the modal is open — otherwise on mobile
  // the page scrolls instead of the modal's own scrollable content, making
  // the lower part of the form (file picker, submit button) unreachable.
  useScrollLock(showSubmitForm);

  useEffect(() => {
    if (showSubmitForm && categories.length === 0) {
      resourcesAPI
        .getResourceCategories()
        .then((res) => setCategories(res.data))
        .catch(() => {});
    }
  }, [showSubmitForm]);

  const resetSubmitForm = () => {
    setSubmitTitle("");
    setSubmitDescription("");
    setSubmitCourseCode("");
    setSubmitYear("");
    setSubmitCategoryId("");
    setSubmitFile(null);
    setSubmitError(null);
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitFile) {
      setSubmitError("Please choose a file to upload.");
      return;
    }
    if (submitFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSubmitError(`File is too large (max ${MAX_FILE_SIZE_MB}MB).`);
      return;
    }

    setSubmitError(null);
    setIsUploading(true);
    try {
      const uploadResult = await cloudinaryAPI.uploadResourceFile(submitFile);
      setIsUploading(false);

      setIsSubmitting(true);
      await resourcesAPI.submit({
        title: submitTitle,
        description: submitDescription,
        course_code: submitCourseCode,
        year: submitYear,
        category_id: submitCategoryId || undefined,
        url: uploadResult.secure_url,
        file_type: submitFile.type || "application/octet-stream",
        file_size: submitFile.size,
      });

      setSubmitSuccess(true);
      resetSubmitForm();
      fetchCommunityResources();
    } catch (err: any) {
      setSubmitError(
        err?.response?.data
          ? Object.values(err.response.data).flat().join(" ")
          : "Failed to submit resource. Please try again."
      );
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // The Drive list is one static JSON blob — fetch it once, search locally.
  useEffect(() => {
    api
      .get("/resources/drive/")
      .then((response) => setResources(response.data))
      .catch(() => setError("Failed to load resources"))
      .finally(() => setIsLoading(false));
  }, []);

  const allResources = useMemo(
    () => [...communityResources, ...resources].sort(compareResources),
    [resources, communityResources]
  );

  // level → folder → files
  const tree = useMemo(() => {
    const t = {} as Record<LevelKey, Record<FolderKey, Resource[]>>;
    for (const l of [...LEVELS, "other" as const, "images" as const]) t[l] = { notes: [], pdfs: [] };
    for (const r of allResources) t[getLevel(r)][getFolder(r)].push(r);
    return t;
  }, [allResources]);

  const searchResults = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return null;
    const compactQ = q.replace(/\s+/g, "");
    return allResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (getCourseCode(r) ?? "").toLowerCase().includes(compactQ)
    );
  }, [allResources, debouncedSearch]);

  const handleView = (r: Resource) => window.open(r.url, "_blank");

  const handleDownload = async (r: Resource) => {
    try {
      await resourcesAPI.trackDownload(r.id);
    } catch {}
    window.open(r.download_url || r.url, "_blank");
  };

  const renderResourceRow = (r: Resource, showLocation = false) => {
    const code = getCourseCode(r);
    const level = getLevel(r);
    return (
      <li
        key={r.id}
        className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-[#006E3A]/10 text-[#006E3A]">
          {isImage(r) ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate" title={r.title}>
            {r.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
            {code && <span className="font-semibold text-[#006E3A]">{code}</span>}
            {showLocation && (
              <span>
                {levelLabel(level)}
                {level !== "images" && ` › ${FOLDERS[getFolder(r)].label}`}
              </span>
            )}
            <span>{r.file_size_display}</span>
            {r.year && <span>Year {r.year}</span>}
            {r.submitted_by && <span>Shared by {r.submitted_by.full_name}</span>}
          </div>
        </div>

        <div className="flex shrink-0 gap-1 sm:gap-2">
          <button
            onClick={() => handleView(r)}
            aria-label={`View ${r.title}`}
            className="flex items-center gap-1.5 p-2 sm:px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={() => handleDownload(r)}
            aria-label={`Download ${r.title}`}
            className="flex items-center gap-1.5 p-2 sm:px-3 rounded-lg bg-[#006E3A] text-white hover:bg-green-700 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </li>
    );
  };

  // Files inside a folder, grouped under course-code headings.
  const renderFileList = (files: Resource[]) => {
    if (files.length === 0) {
      return (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl border">
          This folder is empty for now.
        </div>
      );
    }
    const groups: Array<[string, Resource[]]> = [];
    for (const r of files) {
      const key = getCourseCode(r) ?? "General";
      const last = groups[groups.length - 1];
      if (last && last[0] === key) last[1].push(r);
      else groups.push([key, [r]]);
    }
    return (
      <div className="space-y-6">
        {groups.map(([code, items]) => (
          <section key={code} className="bg-white rounded-2xl border overflow-hidden">
            <h3 className="px-4 py-2.5 bg-gray-50 border-b text-sm font-semibold text-gray-700">
              {code} <span className="font-normal text-gray-400">· {items.length}</span>
            </h3>
            <ul className="divide-y">{items.map((r) => renderResourceRow(r))}</ul>
          </section>
        ))}
      </div>
    );
  };

  const renderFolderCard = (
    key: string,
    title: string,
    subtitle: string,
    count: number,
    onClick: () => void,
    Icon: React.ElementType
  ) => (
    <button
      key={key}
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border p-6 hover:shadow-lg hover:border-[#006E3A]/40 transition flex items-center gap-4"
    >
      <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-xl bg-[#006E3A]/10 text-[#006E3A] group-hover:bg-[#006E3A] group-hover:text-white transition">
        <Icon className="w-7 h-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-lg text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-400">
        {count}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* HERO */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Learning Resources
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Discover curated academic materials, tutorials, and study resources
            </p>
          </div>

          {/* SEARCH + SUBMIT */}
          <div className="max-w-2xl mx-auto mb-12 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006E3A] transition"
              />
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setShowSubmitForm(true);
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#006E3A] text-white font-medium hover:bg-green-700 transition whitespace-nowrap"
              >
                <Upload className="w-5 h-5" />
                Submit a Resource
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-[#006E3A] text-[#006E3A] font-medium hover:bg-[#006E3A]/5 transition whitespace-nowrap"
              >
                Log in to submit
              </Link>
            )}
          </div>

          {/* SUBMIT FORM MODAL */}
          {showSubmitForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Submit a Resource</h2>
                  <button
                    onClick={() => setShowSubmitForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <p className="text-[#006E3A] font-medium mb-4">
                      Thanks! Your resource has been submitted and is pending
                      admin approval before it appears publicly.
                    </p>
                    <button
                      onClick={() => setShowSubmitForm(false)}
                      className="px-6 py-2 rounded-lg bg-[#006E3A] text-white hover:bg-green-700"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitResource} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        value={submitTitle}
                        onChange={(e) => setSubmitTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006E3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={submitDescription}
                        onChange={(e) => setSubmitDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006E3A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Course Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CSC301"
                          value={submitCourseCode}
                          onChange={(e) => setSubmitCourseCode(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006E3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2025"
                          value={submitYear}
                          onChange={(e) => setSubmitYear(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006E3A]"
                        />
                      </div>
                    </div>

                    {categories.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={submitCategoryId}
                          onChange={(e) => setSubmitCategoryId(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006E3A]"
                        >
                          <option value="">None</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File (PDF, Word, PowerPoint, Excel, ZIP, or text — max{" "}
                        {MAX_FILE_SIZE_MB}MB)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        required
                        accept={ALLOWED_FILE_TYPES}
                        onChange={(e) =>
                          setSubmitFile(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#006E3A] hover:bg-green-50/50 transition-colors text-center"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                        {submitFile ? (
                          <span className="text-sm font-medium text-gray-800 break-all px-2">
                            {submitFile.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Tap to choose a file
                          </span>
                        )}
                      </button>
                    </div>

                    {submitError && (
                      <p className="text-sm text-red-600">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading || isSubmitting}
                      className="w-full py-3 rounded-lg bg-[#006E3A] text-white font-medium hover:bg-green-700 disabled:opacity-60"
                    >
                      {isUploading
                        ? "Uploading file..."
                        : isSubmitting
                        ? "Submitting..."
                        : "Submit for Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* BROWSER */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : searchResults ? (
            /* SEARCH RESULTS — flat, across every level */
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {searchResults.length === 0
                  ? `No resources match "${debouncedSearch}".`
                  : searchResults.length > MAX_SEARCH_RESULTS
                  ? `Showing the first ${MAX_SEARCH_RESULTS} of ${searchResults.length} matches — try a more specific search.`
                  : `${searchResults.length} match${searchResults.length === 1 ? "" : "es"}`}
              </p>
              {searchResults.length > 0 && (
                <ul className="bg-white rounded-2xl border overflow-hidden divide-y">
                  {searchResults
                    .slice(0, MAX_SEARCH_RESULTS)
                    .map((r) => renderResourceRow(r, true))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {/* BREADCRUMB */}
              <nav className="flex flex-wrap items-center gap-1 text-sm mb-6">
                <button
                  onClick={() => openFolder(null)}
                  className={currentLevel ? "text-[#006E3A] hover:underline" : "font-semibold text-gray-900"}
                >
                  All Levels
                </button>
                {currentLevel && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => openFolder(currentLevel)}
                      className={currentFolder ? "text-[#006E3A] hover:underline" : "font-semibold text-gray-900"}
                    >
                      {levelLabel(currentLevel)}
                    </button>
                  </>
                )}
                {currentLevel && currentFolder && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {FOLDERS[currentFolder].label}
                    </span>
                  </>
                )}
              </nav>

              {!currentLevel ? (
                /* LEVEL FOLDERS */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {LEVELS.map((l) =>
                    renderFolderCard(
                      String(l),
                      `${l} Level`,
                      `${tree[l].notes.length} notes · ${tree[l].pdfs.length} PDFs`,
                      tree[l].notes.length + tree[l].pdfs.length,
                      () => openFolder(l),
                      GraduationCap
                    )
                  )}
                  {tree.other.notes.length + tree.other.pdfs.length > 0 &&
                    renderFolderCard(
                      "other",
                      "Other",
                      "General files & ones without a course code",
                      tree.other.notes.length + tree.other.pdfs.length,
                      () => openFolder("other"),
                      Folder
                    )}
                  {tree.images.pdfs.length > 0 &&
                    renderFolderCard(
                      "images",
                      "Images",
                      "Photos & scanned pages",
                      tree.images.pdfs.length,
                      () => openFolder("images"),
                      ImageIcon
                    )}
                </div>
              ) : currentLevel === "images" ? (
                /* IMAGES — no Notes/PDFs split */
                renderFileList(tree.images.pdfs)
              ) : !currentFolder ? (
                /* NOTES / PDFS FOLDERS */
                <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
                  {(Object.keys(FOLDERS) as FolderKey[]).map((f) =>
                    renderFolderCard(
                      f,
                      FOLDERS[f].label,
                      FOLDERS[f].hint,
                      tree[currentLevel][f].length,
                      () => openFolder(currentLevel, f),
                      f === "notes" ? BookOpen : FolderOpen
                    )
                  )}
                </div>
              ) : (
                /* FILES */
                renderFileList(tree[currentLevel][currentFolder])
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
