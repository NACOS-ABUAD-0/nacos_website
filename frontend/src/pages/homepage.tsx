// src/pages/homepage.tsx
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Hero } from "../components/home/Hero";
import { StatsStrip } from "../components/home/StatsStrip";
import { Section } from "../components/home/Section";
import About from "../components/AboutUs";
import LearningResourceCta from "../components/LearningResourceCta";
import Testimonials from "../components/Testimonials";
import Events from "./events";
import {
  HeroSkeleton,
  ProjectCardSkeleton,
  EventCardSkeleton,
  ExecutiveCardSkeleton,
  ResourceCardSkeleton,
  GallerySkeleton,
} from "../components/home/Skeletons";
import {
  useFeaturedProjects,
  useUpcomingEvents,
  useExecutives,
  useLatestResources,
  useLatestGallery,
  usePublicStats,
} from "../lib/hooks/useHomepage";

import type {
  ProjectItem,
  EventItem,
  Exec,
  ResourceItem,
  GalleryItem,
} from "../lib/hooks/useHomepage";

import { useSEO } from "../lib/seo";
import { useAuth } from "../context/AuthContext";
import Facilities from "../components/Facilities";
import Executives from "./Executives";
import { Layout } from "../layouts/layout";

/**
 * Premium Enhancements Summary:
 * - All original layout structure preserved exactly
 * - Text content condensed to premium, scannable copy
 * - Added subtle visual enhancements (gradients, icons, animations)
 * - Improved card designs with consistent spacing and hover states
 * - Maintained existing color palette and brand identity
 */

const Homepage: React.FC = () => {
  useSEO();

  const { isAuthenticated, user } = useAuth();
  const showProfileBanner = isAuthenticated && !user?.profile_complete;

  // Data fetching - unchanged
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = usePublicStats();
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useFeaturedProjects();

  const {
    data: executives,
    isLoading: execsLoading,
    error: execsError,
    refetch: refetchExecs,
  } = useExecutives();
  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = useLatestResources();
  const {
    data: gallery,
    isLoading: galleryLoading,
    error: galleryError,
    refetch: refetchGallery,
  } = useLatestGallery();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-grow">
          {/* Hero Section - preserved exactly as provided */}
          <Hero showProfileBanner={showProfileBanner} />
          <About />

          {/* Stats Strip - unchanged */}
          {/* <StatsStrip stats={stats} isLoading={statsLoading} error={statsError} /> */}

          {/* Featured Projects Section */}
          <Section
            title="Featured Projects"
            subtitle="Student-built applications and experiments showcasing innovation"
            ctaText="View all projects"
            ctaLink="/projects"
            id="projects"
          >
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : projectsError ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Failed to load projects</p>
                <button
                  onClick={() => refetchProjects()}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : projects?.results?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No featured projects yet</p>
                {isAuthenticated && (
                  <Link
                    to="/projects/new"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects?.results?.slice(0, 6).map((project: ProjectItem) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Enhanced project cover with gradient overlay */}
                    {project.cover_url ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-300"
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

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        By {project.owner.full_name || "Anonymous"}
                      </p>

                      {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100"
                            >
                              {skill}
                            </span>
                          ))}
                          {project.skills.length > 3 && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                              +{project.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          View Project
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                        <span className="text-xs text-gray-400">
                          {project.updated_at
                            ? new Date(project.updated_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Events/>

          {/* <Section
          title="Our Leadership"
          subtitle="Meet the team driving NACOS ABUAD forward"
          ctaText="View all executives"
          ctaLink="/executives"
          id="executives"
        >
          {execsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <ExecutiveCardSkeleton key={i} />
              ))}
            </div>
          ) : execsError ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Failed to load executives</p>
              <button
                onClick={() => refetchExecs()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {executives?.results?.slice(0, 8).map((exec: Exec) => (
                <div key={exec.id} className="text-center group">
                  <div className="relative inline-block mb-4">
                    <img
                      src={exec.photo_url || '/assets/avatar-placeholder.png'}
                      alt={exec.name}
                      className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-gray-100 group-hover:ring-green-200 transition-all duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-50 to-blue-50 -z-10 transform scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{exec.name}</h3>
                  <p className="text-sm text-gray-600">{exec.role}</p>
                </div>
              ))}
            </div>
          )}
        </Section> */}

          <Executives isHome />
          <Facilities />
          {/* Resources Section */}
          <Section
          title="Learning Resources"
          subtitle="Curated study materials and technical tutorials"
          ctaText="Browse resources"
          ctaLink="/resources"
          id="resources"
        >
          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : resourcesError ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Failed to load resources</p>
              <button
                onClick={() => refetchResources()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources?.results?.slice(0, 6).map((resource: ResourceItem) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg border border-gray-100 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 group-hover:text-green-600 mb-2 line-clamp-2 transition-colors">
                    {resource.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {resource.course_code && `${resource.course_code} • `}
                    {resource.year && `Year ${resource.year}`}
                  </p>
                </a>
              ))}
            </div>
          )}
        </Section>
          <LearningResourceCta />

          <Testimonials />

          {/* Gallery Section */}
          <Section
            title="Community Moments"
            subtitle="Capturing collaboration, innovation, and growth"
            ctaText="View gallery"
            ctaLink="/gallery"
            id="gallery"
          >
            {galleryLoading ? (
              <GallerySkeleton />
            ) : galleryError ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Failed to load gallery</p>
                <button
                  onClick={() => refetchGallery()}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery?.results?.slice(0, 12).map((item: GalleryItem) => (
                  <div
                    key={item.id}
                    className="aspect-square rounded-xl overflow-hidden group"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.title || "Community moment"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </main>
      </div>
    </Layout>
  );
};

export default Homepage;

// {/* Partners & Sponsors CTA */}
// <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50 relative overflow-hidden">
//   {/* Premium background elements */}
//   <div className="absolute top-0 left-0 w-72 h-72 bg-green-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20" />
//   <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-20" />

//   <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
//     <h2 className="text-3xl font-bold text-gray-900 mb-4">Partner With Us</h2>
//     <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
//       Support student innovation, sponsor events, and help shape Nigeria's next generation of tech leaders.
//     </p>

//     <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
//       <Link
//         to="/contact"
//         className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
//       >
//         Get In Touch
//       </Link>
//       <Link
//         to="/sponsorship"
//         className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
//       >
//         Sponsorship Info
//       </Link>
//     </div>

//     {/* Enhanced partner logos section */}
//     <div className="border-t border-gray-200 pt-12">
//       <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-wide">Trusted By</p>
//       <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
//         {/* Premium logo placeholders */}
//         <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded flex items-center justify-center">
//           <span className="text-xs text-gray-500 font-medium">TECH CORP</span>
//         </div>
//         <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded flex items-center justify-center">
//           <span className="text-xs text-gray-500 font-medium">INNOVATE</span>
//         </div>
//         <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded flex items-center justify-center">
//           <span className="text-xs text-gray-500 font-medium">FUTURE LABS</span>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>
