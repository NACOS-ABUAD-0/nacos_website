// src/pages/homepage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Hero } from "../components/home/Hero";
import { Section } from "../components/home/Section";
import About from "../components/AboutUs";
import Testimonials from "../components/Testimonials";
<<<<<<< HEAD
import {
  HeroSkeleton,
  ProjectCardSkeleton,
  EventCardSkeleton,
  ExecutiveCardSkeleton,
  ResourceCardSkeleton,
  GallerySkeleton,
} from "../components/home/Skeletons";
=======
import Events from "./events";
import { ProjectCardSkeleton } from "../components/home/Skeletons";
>>>>>>> 4651335 (Ready for deployment)
import {
  useFeaturedProjects,
  usePublicStats,
} from "../lib/hooks/useHomepage";
import type { ProjectItem } from "../lib/hooks/useHomepage";
import { useSEO } from "../lib/seo";
import { useAuth } from "../context/AuthContext";
import Facilities from "../components/Facilities";
import Executives from "../components/Executives";
import { Layout } from "../layouts/layout";

// ─── Shared motion variants ───────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (d: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.55, ease: "easeOut", delay: d },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (d: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

// ─── AnimatedSection wrapper — fires once on scroll entry ─────────────────────

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      custom={0}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Homepage ─────────────────────────────────────────────────────────────────

const Homepage: React.FC = () => {
  useSEO();

  const { isAuthenticated, user } = useAuth();
  const showProfileBanner = isAuthenticated && !user?.profile_complete;

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useFeaturedProjects();
<<<<<<< HEAD
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useUpcomingEvents();
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

 interface Event {
  id: string;
  title: string;
  theme: string;
  organizer: string;
  eventType: string;
  tagline: string;
  limits: number;
  status: "Open" | "Closed" | "Upcoming"; // better than plain string
  registration: {
    startDate: string; // ISO format: YYYY-MM-DD
    endDate: string;
    isOpenToEveryone: boolean;
    registrationLink: string;
    qrCode: string;
  };
  contact: {
    inquiries: string[];
  };
  media: {
    poster: string;
  };
}

 const event : Event[] = [
  {
    id: "devcon-2026",
    title: "DEVCON 2026 Hackathon – Beyond the Boundaries",
    theme: "Beyond the Boundaries",
    organizer: "ACM ABUAD Chapter",
    eventType: "Hackathon",
    tagline: "Build, break barriers, and innovate beyond the conventional.",
    limits: 404,
    status: "Open",
    registration: {
      startDate: "2026-02-14",
      endDate: "2026-02-28",
      isOpenToEveryone: true,
      registrationLink: "https://devcon2026.netlify.app/",
      qrCode: "/images/devcon-qr.png",
    },
    contact: {
      inquiries: ["09068640110", "09038231348"],
    },
    media: {
      poster: "/events/dev.jpeg",
    },
  },
];
=======
>>>>>>> 4651335 (Ready for deployment)

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-grow">
          {/* Hero — has its own entrance animations */}
          <Hero showProfileBanner={showProfileBanner} />

          {/* About */}
          <AnimatedSection>
            <About />
          </AnimatedSection>

          {/* Featured Projects */}
          <AnimatedSection>
            <Section
              title="Featured Projects"
              subtitle="Student-built applications and experiments showcasing innovation"
              ctaText="View all projects"
              ctaLink="/projects"
              id="projects"
            >
              <AnimatePresence mode="wait">
                {projectsLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
                      >
                        <ProjectCardSkeleton />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : projectsError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                  >
<<<<<<< HEAD
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

          {/* Upcoming Events Section */}
          <Section
            title="Upcoming Events"
            subtitle="Workshops, hackathons, and networking opportunities"
            ctaText="See all events"
            ctaLink="/events"
            id="events"
          >
            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            // ) : eventsError ? (
            //   <div className="text-center py-12">
            //     <p className="text-gray-500 mb-4">Failed to load events</p>
            //     <button
            //       onClick={() => refetchEvents()}
            //       className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            //     >
            //       Try Again
            //     </button>
            //   </div>
            // ) : events?.results?.length === 0 ? (
            //   <div className="text-center py-12">
            //     <p className="text-gray-500">No upcoming events scheduled</p>
            //   </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {event?.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {event.media.poster ? (
                      <div className="relative overflow-hidden w-full max-w-[500px] aspect-[426/463]">
                        <img
                          src={event.media.poster}
                          alt={event.title}
                          className="w-full h-full rounded-t-[10px] object-cover"
                          loading="lazy"
                        />
                        {/* <div className="absolute top-4 right-4">
                          {event.is_remote ? (
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Remote
                            </span>
                          ) : (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              In-person
                            </span>
                          )}
                        </div> */}
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="p-6 bg-[#E8F4F8]">
                      <h3 className="font-semibold text-xl md:text-2xl lg:text-[25px] leading-none tracking-normal text-black mb-4">
                        Title: {event.title}
                      </h3>
                      <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">Theme: {event.theme}</p>
                      <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">Status: {event.status}</p>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        {/* <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg> */}
                        {/* {new Date(event.start).toLocaleDateString()} */}
                        {/* {event.title && (
                          <>
                            <svg
                              className="w-4 h-4 mx-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {event.}
                          </>
                        )} */}
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Learn More
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

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
=======
                    <p className="text-gray-500 mb-4">Failed to load projects</p>
                    <motion.button
                      onClick={() => refetchProjects()}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Try Again
                    </motion.button>
                  </motion.div>
                ) : projects?.results?.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                  >
                    <p className="text-gray-500 mb-4">No featured projects yet</p>
                    {isAuthenticated && (
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Link
                          to="/projects/new"
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Create First Project
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProjectCarousel projects={projects.results} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          </AnimatedSection>

          {/* Events */}
          <AnimatedSection>
            <Events isHome={true} />
          </AnimatedSection>

          {/* Executives */}
          <AnimatedSection>
            <Executives isHome />
          </AnimatedSection>

          {/* Facilities */}
          <AnimatedSection>
            <Facilities />
          </AnimatedSection>

          {/* Resources Section */}
          <AnimatedSection>
            <Section
              title="Student Resources"
              subtitle="Access learning materials, past questions, and tutorials"
            >
              <ResourcesCTA />
            </Section>
          </AnimatedSection>

          {/* Testimonials */}
          <AnimatedSection>
            <Testimonials />
          </AnimatedSection>

          {/* Gallery */}
          <AnimatedSection>
            <Gallery isHome={true} />
          </AnimatedSection>
>>>>>>> 4651335 (Ready for deployment)
        </main>

        <Footer />
      </div>
    </Layout>
  );
};

// ─── Resources CTA (extracted for clean animation scope) ─────────────────────

<<<<<<< HEAD
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
=======
const ResourcesCTA: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <div ref={ref} className="max-w-4xl mx-auto text-center py-12">
      {/* Icon */}
      <motion.div
        variants={scaleIn}
        custom={0}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
      >
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </motion.div>

      {/* Heading */}
      <motion.h3
        variants={fadeUp}
        custom={0.1}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
      >
        Unlock Your Academic Potential
      </motion.h3>

      {/* Body */}
      <motion.p
        variants={fadeUp}
        custom={0.2}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto"
      >
        Access a curated library of Computer Science resources, including lecture notes,
        past questions, programming tutorials, and more. All materials are created and
        shared by students, for students.
      </motion.p>

      {/* CTA button */}
      <motion.div
        variants={scaleIn}
        custom={0.3}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="inline-block"
      >
        <Link
          to="/resources"
          className="group inline-flex items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all shadow-md hover:shadow-[0_8px_30px_rgba(5,150,105,0.3)] relative overflow-hidden"
        >
          {/* Sheen sweep */}
          <motion.span
            className="absolute inset-0 -skew-x-12 bg-white/10 pointer-events-none"
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.6 }}
          />
          <span className="relative z-10">Explore Resources</span>
          <motion.svg
            className="w-5 h-5 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </motion.svg>
        </Link>
      </motion.div>
    </div>
  );
};

// ─── ProjectCarousel ──────────────────────────────────────────────────────────

interface ProjectCarouselProps {
  projects: ProjectItem[];
}

const ProjectCarousel: React.FC<ProjectCarouselProps> = ({ projects }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerSlide = 3;

  const slides: ProjectItem[][] = [];
  for (let i = 0; i < projects.length; i += itemsPerSlide) {
    slides.push(projects.slice(i, i + itemsPerSlide));
  }

  const totalSlides = slides.length;

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, totalSlides]);

  const goToNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  if (totalSlides === 0) return null;

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const cardStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide area */}
      <div className="overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              variants={cardStagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {slides[currentSlide].map((project) => (
                <motion.div
                  key={project.id}
                  variants={cardVariant}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
                >
                  {project.cover_url ? (
                    <div className="relative overflow-hidden">
                      <motion.img
                        src={project.cover_url}
                        alt={project.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
                        {project.skills.slice(0, 3).map((skill, idx) => (
                          <motion.span
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 cursor-default"
                          >
                            {skill}
                          </motion.span>
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
                        <motion.svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </motion.svg>
                      </Link>
                      <span className="text-xs text-gray-400">
                        {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next buttons */}
      {totalSlides > 1 && (
        <>
          <motion.button
            onClick={goToPrev}
            whileHover={{ scale: 1.1, backgroundColor: "#f9fafb" }}
            whileTap={{ scale: 0.93 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 lg:-ml-6 bg-white rounded-full p-2 shadow-md focus:outline-none z-10"
            aria-label="Previous projects"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            onClick={goToNext}
            whileHover={{ scale: 1.1, backgroundColor: "#f9fafb" }}
            whileTap={{ scale: 0.93 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 lg:-mr-6 bg-white rounded-full p-2 shadow-md focus:outline-none z-10"
            aria-label="Next projects"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </>
      )}

      {/* Dots */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => goToSlide(idx)}
              animate={{
                width: idx === currentSlide ? 24 : 10,
                backgroundColor: idx === currentSlide ? "#16a34a" : "#d1d5db",
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.2 }}
              className="h-2.5 rounded-full focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Homepage;
>>>>>>> 4651335 (Ready for deployment)
