// frontend/src/pages/resources.tsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { resourcesAPI } from '../lib/api';

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

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchResources();
  }, [searchTerm, selectedCategory, selectedYear, sortBy]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedYear) params.year = selectedYear;

      if (sortBy === 'popular') params.ordering = '-download_count';
      else if (sortBy === 'name') params.ordering = 'title';
      else params.ordering = '-created_at';

      console.log('🔍 Fetching resources with params:', params);

      const response = await resourcesAPI.getResources(params);
      console.log('✅ Successfully loaded resources:', response.data.results.length);
      setResources(response.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load resources';
      console.error('❌ Error fetching resources:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (resource: Resource) => {
    window.open(resource.url, '_blank');
  };

  const handleDownload = async (resource: Resource) => {
    try {
      await resourcesAPI.trackDownload(resource.id);
      window.open(resource.download_url || resource.url, '_blank');
      setResources(prevResources =>
        prevResources.map(r =>
          r.id === resource.id
            ? { ...r, download_count: r.download_count + 1 }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to track download:', err);
      window.open(resource.download_url || resource.url, '_blank');
    }
  };

  // Extract unique years and categories for filters
  const years = [...new Set(resources.map(r => r.year).filter((year): year is string => Boolean(year)))].sort();
  const categories = [...new Set(resources.map(r => r.category?.name).filter((category): category is string => Boolean(category)))].sort();

  const ResourceCardSkeleton: React.FC = () => (
    <div className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h1 className="text-4xl font-bold text-gray-900">
                Learning Resources
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Curated academic materials, tutorials, and study resources for ABUAD computing students
            </p>
          </div>

          {/* GitHub-inspired Filters Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Filter Resources</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search - GitHub style */}
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Year Filter - GitHub topics style */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Year:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear('')}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    selectedYear === ''
                      ? 'bg-green-500 text-white border-green-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  All Years
                </button>
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      selectedYear === year
                        ? 'bg-green-500 text-white border-green-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resources Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg max-w-md mx-auto">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Unable to load resources</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchResources}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || selectedCategory || selectedYear
                  ? "Try adjusting your search criteria or filters to find what you're looking for."
                  : "No resources available yet. Check back soon for new materials."
                }
              </p>
              {(searchTerm || selectedCategory || selectedYear) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedYear('');
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results Header - GitHub style */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {resources.length}
                    <span className="text-gray-600 font-normal"> resource{resources.length !== 1 ? 's' : ''} found</span>
                  </h3>
                  {searchTerm && (
                    <p className="text-sm text-gray-500 mt-1">
                      Matching "{searchTerm}"
                    </p>
                  )}
                </div>
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-300 p-6 group">
                    {/* File Icon and Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl text-white">
                        {resource.file_icon}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                        {resource.file_size_display}
                      </div>
                    </div>

                    {/* Title and Description */}
                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors duration-200">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {resource.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="space-y-3 mb-4">
                      {resource.course_code && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 font-medium mr-2">Course:</span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                            {resource.course_code}
                          </span>
                        </div>
                      )}

                      {resource.year && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Year {resource.year}</span>
                        </div>
                      )}

                      {resource.download_count > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>{resource.download_count} download{resource.download_count !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags - Green theme style */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                            +{resource.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex gap-2">
                        {/* View Button */}
                        {resource.url && (
                          <button
                            onClick={() => handleView(resource)}
                            className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        )}

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(resource)}
                          className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>

                      {/* Date */}
                      <div className="text-center">
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Added {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
