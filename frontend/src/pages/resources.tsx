import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { resourcesAPI } from "../lib/api";
import {
  Search,
  Download,
  Eye,
  Calendar,
  FileText,
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

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [pageSize] = useState(20);

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
      const params: any = { page_size: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;

      let response;
      if (!reset && nextPageUrl) {
        response = await resourcesAPI.getResourcesByUrl(nextPageUrl);
      } else {
        response = await resourcesAPI.getResources(params);
      }

      const newData = response.data.results;
      setNextPageUrl(response.data.next);

      // Sort newData so CSC courses come first
      const sortedNewData = sortCSCFirst(newData);

      if (reset) setResources(sortedNewData);
      else setResources(prev => [...prev, ...sortedNewData]);
    } catch (err: any) {
      setError(err.message || "Failed to load resources");
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* HERO */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Learning Resources
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Discover curated academic materials, tutorials, and study resources
            </p>
          </div>

          {/* SEARCH ONLY */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006E3A] transition"
              />
            </div>
          </div>

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
                {filteredResources.map((r) => (
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
                ))}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};