import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import api from "../lib/api";
import { resourcesAPI, cloudinaryAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

import {
  Search,
  Download,
  Eye,
  Calendar,
  FileText,
  Upload,
  X,
  Clock,
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

const getLevelFromCourseCode = (courseCode?: string): number | null => {
  if (!courseCode) return null;
  const match = courseCode.match(/\d{3}/);
  if (match) {
    const levelNum = parseInt(match[0][0]) * 100;
    return [100, 200, 300, 400].includes(levelNum) ? levelNum : null;
  }
  return null;
};

// Helper: sort CSC courses first
const sortCSCFirst = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => {
    const aIsCSC = a.course_code?.toUpperCase().startsWith("CSC") ?? false;
    const bIsCSC = b.course_code?.toUpperCase().startsWith("CSC") ?? false;
    if (aIsCSC && !bIsCSC) return -1;
    if (!aIsCSC && bIsCSC) return 1;
    return 0;
  });
};

const ALLOWED_FILE_TYPES =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt";
const MAX_FILE_SIZE_MB = 20;

export const ResourcesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [pageSize] = useState(20);

  // ─── Community submitted resources ────────────────────────────────────────
  const [communityResources, setCommunityResources] = useState<Resource[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  const fetchCommunityResources = async () => {
    setIsLoadingCommunity(true);
    try {
      const response = await resourcesAPI.getResources();
      setCommunityResources(response.data.results ?? response.data ?? []);
    } catch {
      // Silently ignore — the Drive-synced list above still works.
    } finally {
      setIsLoadingCommunity(false);
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
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setResources([]);
    setNextPageUrl(null);
    fetchResources(true);
  }, [debouncedSearch]);

  const fetchResources = async (reset = false) => {
  if (reset) setIsLoading(true);
  else setIsLoadingMore(true);

  try {
    if (reset) {
      const response = await api.get("/resources/drive/");
      let allData: Resource[] = response.data;

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        allData = allData.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            (r.course_code ?? "").toLowerCase().includes(q)
        );
      }

      setResources(sortCSCFirst(allData));
      setNextPageUrl(null);
    }
  } catch (err: any) {
    setError("Failed to load resources");
  } finally {
    setIsLoading(false);
    setIsLoadingMore(false);
  }
};

  const filteredResources = useMemo(() => {
    // Already sorted by fetch, but just in case
    return resources;
  }, [resources]);

  const handleView = (r: Resource) => window.open(r.url, "_blank");

  const handleDownload = async (r: Resource) => {
    try {
      await resourcesAPI.trackDownload(r.id);
    } catch {}
    window.open(r.download_url || r.url, "_blank");
  };

  const renderResourceCard = (r: Resource) => (
    <div
      key={r.id}
      className="group bg-white rounded-2xl border p-6 hover:shadow-xl transition overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#006E3A]/10 text-[#006E3A]">
          <FileText />
        </div>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
          {r.file_size_display}
        </span>
      </div>

      {/* TITLE with overflow handling */}
      <h3 className="font-semibold text-lg mb-2 group-hover:text-[#006E3A] line-clamp-2 break-words overflow-hidden">
        {r.title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 break-words">
        {r.description}
      </p>

      {/* META */}
      <div className="space-y-2 text-sm text-gray-500 mb-4">
        {r.course_code && (
          <div>{r.course_code} • {getLevelFromCourseCode(r.course_code)} Level</div>
        )}
        {r.year && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Year {r.year}
          </div>
        )}
        {r.submitted_by && (
          <div className="text-xs text-gray-400">
            Shared by {r.submitted_by.full_name}
          </div>
        )}
      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-1 mb-4">
        {r.tags.slice(0, 3).map(tag => (
          <span key={tag.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
            {tag.name}
          </span>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={() => handleView(r)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          <Eye className="w-4 h-4" />
          View
        </button>

        <button
          onClick={() => handleDownload(r)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#006E3A] text-white hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
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
                        type="file"
                        required
                        accept={ALLOWED_FILE_TYPES}
                        onChange={(e) =>
                          setSubmitFile(e.target.files?.[0] ?? null)
                        }
                        className="w-full text-sm"
                      />
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

          {/* GRID */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredResources.map(renderResourceCard)}
              </div>

              {/* LOAD MORE */}
              {nextPageUrl && (
                <div className="text-center mt-16 mb-20">
                  <button
                    onClick={() => fetchResources(false)}
                    className="px-8 py-3 border rounded-xl hover:bg-gray-100"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* COMMUNITY SUBMITTED */}
          {(isLoadingCommunity || communityResources.length > 0) && (
            <div className="mt-20">
              <div className="flex items-center gap-2 mb-8">
                <Clock className="w-5 h-5 text-[#006E3A]" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Community Submitted
                </h2>
              </div>

              {isLoadingCommunity ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {communityResources.map(renderResourceCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
