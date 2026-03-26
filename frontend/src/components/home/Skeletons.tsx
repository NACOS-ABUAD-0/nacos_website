// src/components/home/Skeletons.tsx
import React from "react";

export const HeroSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {/* Premium badge skeleton */}
    <div className="flex justify-center mb-8">
      <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-48"></div>
    </div>

    {/* Main headline with gradient effect */}
    <div className="space-y-4 mb-8">
      <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl w-3/4 mx-auto"></div>
      <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-2/3 mx-auto"></div>
    </div>

    {/* Subtitle */}
    <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-1/2 mx-auto mb-12"></div>

    {/* Action buttons */}
    <div className="flex justify-center gap-6">
      <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-40"></div>
      <div className="h-14 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl w-40"></div>
    </div>
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="animate-pulse grid grid-cols-2 md:grid-cols-5 gap-8">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="text-center">
        {/* Stat number with shimmer effect */}
        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-3 mx-auto w-20"></div>
        {/* Stat label */}
        <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16 mx-auto"></div>
        {/* Subtle accent line */}
        <div className="h-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-8 mx-auto mt-3"></div>
      </div>
    ))}
  </div>
);

export const ProjectCardSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
    {/* Image placeholder with gradient */}
    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
    </div>

    <div className="p-6 space-y-4">
      {/* Title */}
      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>

      {/* Author */}
      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2"></div>

      {/* Skills chips */}
      <div className="flex flex-wrap gap-2">
        <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16"></div>
        <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-12"></div>
      </div>

      {/* Action area */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
        <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export const EventCardSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group w-[450px]">
    {/* Event image with status badge area */}
    <div className="bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden aspect-[4/5]">
      <div className="absolute top-4 right-4">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"></div>
      </div>
    </div>

    <div className="p-6 space-y-4">
      {/* Event title */}
      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>

      {/* Date and venue info */}
      <div className="flex items-center space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-32"></div>
      </div>

      {/* Action area */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
      </div>
    </div>
  </div>
);

export const ExecutiveCardSkeleton: React.FC = () => (
  <div className="animate-pulse text-center group">
    {/* Profile image with subtle ring */}
    <div className="relative inline-block mb-4">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto ring-2 ring-gray-100"></div>
      {/* Subtle background decoration */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 -z-10 transform scale-110"></div>
    </div>

    {/* Name and role */}
    <div className="space-y-2">
      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 mx-auto"></div>
      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-24 mx-auto"></div>
    </div>
  </div>
);

export const ResourceCardSkeleton: React.FC = () => (
  <div className="animate-pulse p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
    <div className="flex items-start justify-between mb-4">
      {/* Icon placeholder */}
      <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
      {/* External link icon */}
      <div className="w-5 h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded"></div>
    </div>

    {/* Content */}
    <div className="space-y-3">
      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Additional premium skeleton components
export const SectionSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-8">
    {/* Section header */}
    <div className="text-center space-y-4">
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mx-auto"></div>
      <div className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-96 mx-auto"></div>
      <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-32 mx-auto"></div>
    </div>

    {/* Content grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"></div>
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  </div>
);

export const NavigationSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="flex items-center justify-between p-4">
      {/* Logo */}
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32"></div>

      {/* Navigation items */}
      <div className="hidden md:flex items-center gap-8">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16"
          ></div>
        ))}
      </div>

      {/* Auth buttons */}
      <div className="flex items-center gap-4">
        <div className="h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-24"></div>
        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24"></div>
      </div>
    </div>
  </div>
);

export const EventDetailSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Half Skeleton */}
        <div className="w-full lg:w-1/2 p-8 lg:p-20 bg-[#f4fbfc] flex flex-col justify-center space-y-6">
          <div className="h-6 w-20 bg-gray-300 rounded" />
          <div className="h-16 w-3/4 bg-gray-300 rounded" />
          <div className="space-y-4 pt-6">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
          <div className="h-14 w-48 bg-gray-300 rounded-xl mt-10" />
        </div>

        {/* Right Half Skeleton */}
        <div className="w-full lg:w-1/2 bg-gray-300 min-h-[400px]" />
      </div>
    </div>
  );
};

export const GallerySkeleton = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-12 flex flex-col items-center">
        <div className="h-8 w-64 bg-gray-200 rounded-md mb-4" />
        <div className="h-4 w-96 bg-gray-100 rounded-md" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex justify-center gap-3 mb-12 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-10 py-5 bg-gray-200 rounded-full" />
        ))}
      </div>

      {/* Masonry Grid Skeleton */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {/* Item 1 - Large */}
        <div className="h-96 bg-gray-200 rounded-2xl w-full" />

        {/* Item 2 - Small */}
        <div className="h-64 bg-gray-100 rounded-2xl w-full" />

        {/* Item 3 - Medium */}
        <div className="h-80 bg-gray-200 rounded-2xl w-full" />

        {/* Item 4 - Medium */}
        <div className="h-72 bg-gray-100 rounded-2xl w-full" />

        {/* Item 5 - Large */}
        <div className="h-96 bg-gray-200 rounded-2xl w-full" />

        {/* Item 6 - Small */}
        <div className="h-60 bg-gray-100 rounded-2xl w-full" />
      </div>

      {/* Button Skeleton */}
      <div className="w-full flex justify-center mt-16">
        <div className="h-12 w-48 bg-gray-200 rounded-xl" />
      </div>
    </section>
  );
};
