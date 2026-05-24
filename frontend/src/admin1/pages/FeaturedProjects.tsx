// src/admin1/pages/FeaturedProjects.tsx
// Admin page: browse all projects and toggle which ones appear on the homepage.

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import api from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectOwner {
  id: number;
  full_name: string;
  email?: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Project {
  id: number;
  title: string;
  description?: string;
  is_featured: boolean;
  owner?: ProjectOwner;
  tags?: Tag[];
  skills?: string[];
  images?: string[];
  thumbnail?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  views_count?: number;
  likes_count?: number;
}

interface PaginatedProjects {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEDIA_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  return raw;
})();

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  )
    return url;
  if (url.startsWith("/media/") || url.startsWith("media/"))
    return `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  return url;
}

function getProjectThumbnail(project: Project): string | null {
  if (Array.isArray(project.images) && project.images.length > 0)
    return resolveImageUrl(project.images[0]);
  return resolveImageUrl(project.thumbnail ?? project.image_url ?? null);
}

function getTagNames(project: Project): string[] {
  if (Array.isArray(project.tags) && project.tags.length > 0)
    return project.tags.map((t) => t.name);
  return project.skills ?? [];
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchAllProjects(params: {
  page: number;
  search: string;
  filter: "all" | "featured" | "unfeatured";
}): Promise<PaginatedProjects> {
  const query: Record<string, unknown> = {
    page: params.page,
    page_size: 12,
  };
  if (params.search) query.search = params.search;
  if (params.filter === "featured") query.is_featured = true;
  if (params.filter === "unfeatured") query.is_featured = false;

  const res = await api.get("/projects/", { params: query });
  const d = res.data;
  if (Array.isArray(d)) return { count: d.length, next: null, previous: null, results: d };
  return d as PaginatedProjects;
}

// ─── Toggle featured ──────────────────────────────────────────────────────────
// Returns the new is_featured state, normalised from whatever the backend sends.
//
// The backend may respond with:
//   A) { is_featured: true }           — ideal
//   B) { status: "featured" }          — some DRF action patterns
//   C) The full updated project object — common when using UpdateModelMixin
//   D) 204 No Content                  — nothing returned
//
// We handle all four so the UI stays consistent regardless of backend shape.
// ─────────────────────────────────────────────────────────────────────────────
async function toggleFeatured(
  projectId: number,
  currentFeatured: boolean
): Promise<boolean> {
  const res = await api.post(`/projects/${projectId}/toggle_featured/`);
  const d = res.data;

  // A) Explicit boolean field
  if (d && typeof d.is_featured === "boolean") return d.is_featured;

  // B) Status string  e.g. { status: "featured" } / { status: "unfeatured" }
  if (d && typeof d.status === "string") {
    if (d.status === "featured") return true;
    if (d.status === "unfeatured" || d.status === "removed") return false;
  }

  // C) Full project object containing is_featured
  if (d && typeof d.id === "number" && typeof d.is_featured === "boolean")
    return d.is_featured;

  // D) 204 / empty — optimistically assume the toggle flipped
  return !currentFeatured;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE_EXPO, delay: i * 0.05 },
  }),
};

interface ProjectCardProps {
  project: Project;
  onToggle: (id: number) => void;
  isToggling: boolean;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onToggle,
  isToggling,
  index,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const thumb = getProjectThumbnail(project);
  const tags = getTagNames(project);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
      className={`relative bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-300
        ${project.is_featured
          ? "border-emerald-300 ring-2 ring-emerald-100 shadow-emerald-50/60"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md"
        }`}
    >
      {/* Featured badge */}
      {project.is_featured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide uppercase">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Featured
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {thumb && !imgFailed ? (
          <img
            src={thumb}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-3">
          by {project.owner?.full_name ?? "Anonymous"}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 3).map((name, j) => (
              <span
                key={j}
                className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-medium rounded-full border border-gray-100"
              >
                {name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-medium rounded-full border border-gray-100">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[10px] text-gray-300 font-mono">
            {project.views_count !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {project.views_count}
              </span>
            )}
            {project.likes_count !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {project.likes_count}
              </span>
            )}
          </div>

          {/* Toggle button */}
          <motion.button
            onClick={() => onToggle(project.id)}
            disabled={isToggling}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${project.is_featured
                ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
          >
            {isToggling ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : project.is_featured ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Feature
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-44 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-1.5">
        <div className="h-5 bg-gray-100 rounded-full w-14" />
        <div className="h-5 bg-gray-100 rounded-full w-14" />
      </div>
      <div className="flex justify-end">
        <div className="h-7 bg-gray-100 rounded-lg w-20" />
      </div>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterType = "all" | "featured" | "unfeatured";

const FeaturedProjects: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const queryKey = ["admin-projects", page, search, filter] as const;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchAllProjects({ page, search, filter }),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, currentFeatured }: { id: number; currentFeatured: boolean }) =>
      toggleFeatured(id, currentFeatured),

    onMutate: async ({ id, currentFeatured }) => {
      setTogglingId(id);

      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: ["featured-projects"] });

      // Snapshot previous state for rollback
      const previousAdminData = queryClient.getQueryData<PaginatedProjects>(queryKey);

      // Optimistic update — flip the bit immediately
      queryClient.setQueryData<PaginatedProjects>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map((p) =>
            p.id === id ? { ...p, is_featured: !currentFeatured } : p
          ),
        };
      });

      return { previousAdminData };
    },

    onSuccess: (newIsFeatured, { id }) => {
      // Sync admin grid with the authoritative value from the server
      queryClient.setQueryData<PaginatedProjects>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map((p) =>
            p.id === id ? { ...p, is_featured: newIsFeatured } : p
          ),
        };
      });

      // ── This is the key line ──────────────────────────────────────────────
      // Mark the homepage featured-projects query stale so the next time
      // the homepage is viewed (or if it's currently mounted) it refetches.
      // The queryKey here MUST match the one in useHomepage.ts:
      //   queryKey: ['featured-projects']
      // ─────────────────────────────────────────────────────────────────────
      queryClient.invalidateQueries({ queryKey: ["featured-projects"] });

      toast.success(
        newIsFeatured
          ? "Project added to homepage ✨"
          : "Project removed from homepage"
      );
    },

    onError: (_err, _vars, context) => {
      // Roll back the optimistic update
      if (context?.previousAdminData) {
        queryClient.setQueryData(queryKey, context.previousAdminData);
      }
      toast.error("Failed to update. Please try again.");
    },

    onSettled: () => {
      setTogglingId(null);
      // Always refetch the admin grid after mutation settles to stay in sync
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleToggle = useCallback(
    (id: number) => {
      if (togglingId !== null) return;
      const project = data?.results.find((p) => p.id === id);
      if (!project) return;
      mutation.mutate({ id, currentFeatured: project.is_featured });
    },
    [mutation, togglingId, data]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const projects = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.count / 12) : 0;

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Projects" },
    { value: "featured", label: "Featured" },
    { value: "unfeatured", label: "Not Featured" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-semibold tracking-[0.18em] uppercase text-emerald-500 mb-1">
                ◈ Admin · Homepage
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Featured Projects
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Select which projects appear in the homepage carousel. Up to 6 are shown.
              </p>
            </div>

            {/* Live featured count pill */}
            <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm self-start">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">
                {projects.filter((p) => p.is_featured).length}
              </span>
              <span className="text-xs text-gray-400">on homepage</span>
            </div>
          </div>
        </motion.div>

        {/* ── Info banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 flex items-start gap-3"
        >
          <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Click <strong>Feature</strong> to add a project to the homepage carousel, or <strong>Remove</strong> to take it off.
            The homepage displays up to <strong>6 featured projects</strong> at a time.
            Changes take effect immediately — the homepage refetches automatically.
          </p>
        </motion.div>

        {/* ── Controls ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search projects…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </form>

          {/* Filter tabs */}
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1 self-start">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
                  ${filter === opt.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Results count ── */}
        {!isLoading && data && (
          <p className="text-xs text-gray-400 font-mono mb-5">
            {isFetching ? "Refreshing…" : `${data.count} project${data.count !== 1 ? "s" : ""} found`}
            {search && ` for "${search}"`}
          </p>
        )}

        {/* ── Grid ── */}
        {isError ? (
          <div className="text-center py-24">
            <p className="text-gray-400 font-mono text-sm mb-4">// failed to load projects</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey })}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p className="text-gray-400 font-mono text-sm">// no projects found</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${search}-${filter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggle={handleToggle}
                  isToggling={togglingId === project.id}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-10"
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) return <span key={p} className="text-gray-300 text-sm px-1">…</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={isFetching}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-all
                    ${p === page
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isFetching}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProjects;