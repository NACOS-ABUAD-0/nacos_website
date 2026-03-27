// // src/components/home/Hero.tsx
// import React from "react";
// // import { Link } from "react-router-dom";
// // import { motion } from "framer-motion";
// // import { useAuth } from "../../context/AuthContext";
// // import { Sparkles, Users, Rocket, Code } from "lucide-react";
// import sunset from "../../assets/sunset.jpg";
// import { useState, useEffect, useRef } from "react";

// interface HeroProps {
//   showProfileBanner?: boolean;
// }

// export const Hero: React.FC<HeroProps> = ({ showProfileBanner = false }) => {
//   // const { isAuthenticated } = useAuth();

//   const images = [
//     "/heroImages/hero1.jpeg",
//     "/heroImages/hero2.jpeg",
//     "/heroImages/hero3.jpeg",
//     "/heroImages/hero4.jpeg",
//     "/heroImages/hero5.jpeg",
//     "/heroImages/hero6.jpeg",
//     "/heroImages/hero7.jpeg",
//     "/heroImages/hero8.jpeg",
//     "/heroImages/hero9.jpeg",
//     "/heroImages/hero10.jpeg",
//     "/heroImages/hero11.jpeg",
//     "/heroImages/hero12.jpeg",
//     "/heroImages/hero13.jpeg",
//     "/heroImages/hero14.jpeg",
//     "/heroImages/hero15.jpeg",
//     "/heroImages/hero16.jpeg",
//     "/heroImages/hero17.jpeg",
//     "/heroImages/hero18.jpeg",
//     "/heroImages/hero19.jpeg",
//     "/heroImages/hero20.jpeg",
//     "/heroImages/hero21.jpeg",
//     "/heroImages/hero22.jpeg",
//     "/heroImages/hero23.jpeg",
//     "/heroImages/hero24.jpeg",
//     "/heroImages/hero25.jpeg",
//     "/heroImages/hero26.jpeg",
//   ];

//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//     }, 5000); // change every 5 seconds

//     return () => clearInterval(interval);
//   }, [images.length]);

//   const nextSlide = () => {
//     setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//   };

//   const prevSlide = () => {
//     setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//   };

//   const Counter = ({
//     end,
//     duration = 2000,
//   }: {
//     end: number;
//     duration?: number;
//   }) => {
//     const [count, setCount] = useState(0);
//     const [hasStarted, setHasStarted] = useState(false);
//     const countRef = useRef<HTMLSpanElement>(null);

//     useEffect(() => {
//       // 1. Create an observer to see when the element is visible
//       const observer = new IntersectionObserver(
//         ([entry]) => {
//           if (entry.isIntersecting && !hasStarted) {
//             setHasStarted(true); // Only start the animation once
//           }
//         },
//         { threshold: 0.1 }, // Trigger when 10% of the number is visible
//       );

//       if (countRef.current) {
//         observer.observe(countRef.current);
//       }

//       return () => observer.disconnect();
//     }, [hasStarted]);

//     useEffect(() => {
//       if (!hasStarted) return;

//       let startTimestamp: number | null = null;
//       const step = (timestamp: number) => {
//         if (!startTimestamp) startTimestamp = timestamp;
//         const progress = Math.min((timestamp - startTimestamp) / duration, 1);
//         setCount(Math.floor(progress * end));
//         if (progress < 1) {
//           window.requestAnimationFrame(step);
//         }
//       };
//       window.requestAnimationFrame(step);
//     }, [hasStarted, end, duration]);

//     return <span ref={countRef}>{count}</span>;
//   };

//   return (
//     <>
//       <div className="relative w-full min-h-[70vh] md:min-h-[878px]">
//         <div className="absolute w-full h-full flex flex-col justify-center items-center px-4 py-12 bg-black/60 text-white z-30">
//           {/* Header Text */}
//           <div className="text-center mb-12 max-w-2xl">
//             <h2 className="text-3xl md:text-4xl font-bold mb-4">
//               Our Growing Community
//             </h2>
//             <p className="text-gray-400 text-lg leading-relaxed">
//               Empowering students with real-time tools and resources to navigate
//               campus life more efficiently than ever before.
//             </p>
//           </div>

//           {/* Stats Container */}
//           <div className="flex w-full justify-center items-center flex-wrap gap-8 md:gap-16">
//             {/* Stat Item 1 */}
//             <div className="flex flex-col items-center group">
//               <p className="font-bold text-[clamp(40px,8vw,64px)] text-[#006E3A] leading-none mb-2">
//                 <Counter end={1500} />+
//               </p>
//               <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
//                 Students
//               </p>
//               <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2" />
//             </div>

//             {/* Stat Item 2 */}
//             <div className="flex flex-col items-center group">
//               <p className="font-bold text-[clamp(40px,8vw,64px)] text-white leading-none mb-2">
//                 <Counter end={150} />+
//               </p>
//               <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
//                 Events Hosted
//               </p>
//               <div className="h-1 w-0 group-hover:w-full bg-white transition-all duration-500 mt-2" />
//             </div>

//             {/* Stat Item 3 */}
//             <div className="flex flex-col items-center group">
//               <p className="font-bold text-[clamp(40px,8vw,64px)] text-[#006E3A] leading-none mb-2">
//                 <Counter end={20} />+
//               </p>
//               <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
//                 Projects Built
//               </p>
//               <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2" />
//             </div>
//           </div>
//         </div>
//         {/* Background Slides */}
//         {images.map((img, index) => (
//           <div
//             key={index}
//             className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
//               index === currentIndex ? "opacity-100" : "opacity-0"
//             }`}
//             style={{ backgroundImage: `url(${img})` }}
//           />
//         ))}

//         {/* Arrows */}
//         <button
//           onClick={prevSlide}
//           className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 text-white px-6 py-4 rounded-full z-50 cursor-pointer"
//         >
//           ‹
//         </button>

//         <button
//           onClick={nextSlide}
//           className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 text-white px-6 py-4 rounded-full z-50 cursor-pointer"
//         >
//           ›
//         </button>
//       </div>
//     </>
//   );
// };

"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// --- 1. COUNTER COMPONENT (Defined outside to prevent reset on re-render) ---
const Counter = ({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger if it's in view AND hasn't started before
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 },
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return <span ref={countRef}>{count}</span>;
};

// --- 2. HERO COMPONENT ---
interface HeroProps {
  showProfileBanner?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ showProfileBanner = false }) => {
  const images = [
    "/heroImages/hero1.jpeg",
    "/heroImages/hero2.jpeg",
    "/heroImages/hero3.jpeg",
    "/heroImages/hero4.jpeg",
    "/heroImages/hero5.jpeg",
    "/heroImages/hero6.jpeg",
    "/heroImages/hero7.jpeg",
    "/heroImages/hero8.jpeg",
    "/heroImages/hero9.jpeg",
    "/heroImages/hero10.jpeg",
    "/heroImages/hero11.jpeg",
    "/heroImages/hero12.jpeg",
    "/heroImages/hero13.jpeg",
    "/heroImages/hero14.jpeg",
    "/heroImages/hero15.jpeg",
    "/heroImages/hero16.jpeg",
    "/heroImages/hero17.jpeg",
    "/heroImages/hero18.jpeg",
    "/heroImages/hero19.jpeg",
    "/heroImages/hero20.jpeg",
    "/heroImages/hero21.jpeg",
    "/heroImages/hero22.jpeg",
    "/heroImages/hero23.jpeg",
    "/heroImages/hero24.jpeg",
    "/heroImages/hero25.jpeg",
    "/heroImages/hero26.jpeg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    // <div className="relative w-full min-h-[70vh] md:min-h-[878px] overflow-hidden">
    //   {/* Content Overlay */}
    //   <div className="absolute inset-0 flex flex-col justify-center items-center px-4 py-12 bg-black/60 text-white z-30">
    //     <div className="text-center mb-12 max-w-3xl px-4">
    //       <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
    //         Pioneering the Future of <br />
    //         <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006E3A] to-green-400">
    //           Digital Innovation
    //         </span>
    //       </h2>
    //       <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
    //         The official hub for computing excellence at ABUAD. We empower
    //         students to bridge the gap between classroom theory and
    //         industry-leading technology.
    //       </p>
    //     </div>

    //     {/* Stats Container */}
    //     <div className="flex w-full justify-center items-center flex-wrap gap-8 md:gap-16">
    //       {/* Stat Item 1 */}
    //       <div className="flex flex-col items-center group">
    //         <p className="font-bold text-[clamp(40px,8vw,64px)] text-[#006E3A] leading-none mb-2">
    //           <Counter end={1500} />+
    //         </p>
    //         <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
    //           Students
    //         </p>
    //         <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2" />
    //       </div>

    //       {/* Stat Item 2 */}
    //       <div className="flex flex-col items-center group">
    //         <p className="font-bold text-[clamp(40px,8vw,64px)] text-white leading-none mb-2">
    //           <Counter end={150} />+
    //         </p>
    //         <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
    //           Events Hosted
    //         </p>
    //         <div className="h-1 w-0 group-hover:w-full bg-white transition-all duration-500 mt-2" />
    //       </div>

    //       {/* Stat Item 3 */}
    //       <div className="flex flex-col items-center group">
    //         <p className="font-bold text-[clamp(40px,8vw,64px)] text-[#006E3A] leading-none mb-2">
    //           <Counter end={20} />+
    //         </p>
    //         <p className="font-medium text-gray-300 text-lg uppercase tracking-widest">
    //           Projects Built
    //         </p>
    //         <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2" />
    //       </div>
    //     </div>
    //   </div>

    //   {/* Background Slides */}
    //   {images.map((img, index) => (
    //     <div
    //       key={index}
    //       className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
    //         index === currentIndex ? "opacity-100" : "opacity-0"
    //       }`}
    //       style={{ backgroundImage: `url(${img})` }}
    //     />
    //   ))}

    //   {/* Navigation Controls */}
    //   {/* Previous Button */}
    //   <button
    //     onClick={prevSlide}
    //     className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50
    //          group flex items-center justify-center w-12 h-12 md:w-14 md:h-14
    //          bg-white/10 hover:bg-white/20 border border-white/20
    //          backdrop-blur-md rounded-full text-white transition-all
    //          duration-300 hover:scale-110 active:scale-95 cursor-pointer"
    //     aria-label="Previous slide"
    //   >
    //     <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform" />
    //   </button>

    //   {/* Next Button */}
    //   <button
    //     onClick={nextSlide}
    //     className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50
    //          group flex items-center justify-center w-12 h-12 md:w-14 md:h-14
    //          bg-white/10 hover:bg-white/20 border border-white/20
    //          backdrop-blur-md rounded-full text-white transition-all
    //          duration-300 hover:scale-110 active:scale-95 cursor-pointer"
    //     aria-label="Next slide"
    //   >
    //     <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-0.5 transition-transform" />
    //   </button>
    // </div>

    <div className="relative w-full min-h-[80vh] md:min-h-screen overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center px-4 sm:px-6 py-16 bg-black/60 text-white z-30">
        {/* Hero Text */}
        <div className="text-center mb-10 md:mb-16 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight tracking-tight">
            Pioneering the Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006E3A] to-green-400">
              Digital Innovation
            </span>
          </h2>

          <p className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            The official hub for computing excellence at ABUAD. We empower
            students to bridge the gap between classroom theory and
            industry-leading technology.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-5xl text-center justify-items-center">
          {/* Stat 1 */}
          <div className="group">
            <p className="font-bold text-[clamp(20px,8vw,64px)] text-[#006E3A] leading-none mb-2">
              <Counter end={1500} />+
            </p>
            <p className="text-gray-300 text-xs sm:text-base uppercase tracking-widest">
              Students
            </p>
            <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2 mx-auto" />
          </div>

          {/* Stat 2 */}
          <div className="group">
            <p className="font-bold text-[clamp(20px,8vw,64px)] text-white leading-none mb-2">
              <Counter end={150} />+
            </p>
            <p className="text-gray-300 text-xs sm:text-base uppercase tracking-widest">
              Events Hosted
            </p>
            <div className="h-1 w-0 group-hover:w-full bg-white transition-all duration-500 mt-2 mx-auto" />
          </div>

          {/* Stat 3 */}
          <div className="group">
            <p className="font-bold text-[clamp(20px,8vw,64px)] text-[#006E3A] leading-none mb-2">
              <Counter end={20} />+
            </p>
            <p className="text-gray-300 text-xs sm:text-base uppercase tracking-widest">
              Projects Built
            </p>
            <div className="h-1 w-0 group-hover:w-full bg-[#006E3A] transition-all duration-500 mt-2 mx-auto" />
          </div>
        </div>
      </div>

      {/* Background Slides */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 
  flex items-center justify-center 
  w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14
  bg-black/40 sm:bg-white/10 hover:bg-white/20 
  border border-white/20 backdrop-blur-md 
  rounded-full text-white transition-all duration-300 
  hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 
  flex items-center justify-center 
  w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14
  bg-black/40 sm:bg-white/10 hover:bg-white/20 
  border border-white/20 backdrop-blur-md 
  rounded-full text-white transition-all duration-300 
  hover:scale-110 active:scale-95"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
      </button>
    </div>
  );
};

// {/* Profile Completion Banner - Enhanced with premium styling */}
// {showProfileBanner && (
//   <motion.div
//     initial={{ opacity: 0, y: -20 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.4 }}
//     className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-lg shadow-sm"
//   >
//     <div className="flex items-center space-x-3">
//       <div className="flex-shrink-0">
//         <Sparkles className="text-yellow-500 w-5 h-5" />
//       </div>
//       <div className="flex-1">
//         <p className="text-sm text-yellow-800 font-medium">
//           Complete your profile to join the Student Showcase
//         </p>
//         <Link
//           to="/profile"
//           className="text-sm text-yellow-700 font-medium inline-flex items-center gap-1 hover:text-yellow-600 transition-colors"
//         >
//           Complete Profile
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//           </svg>
//         </Link>
//       </div>
//     </div>
//   </motion.div>
// )}

// {/* Hero Section - Premium visual treatment */}
// <section className="relative py-24 bg-gradient-to-br from-white via-green-50 to-emerald-100 overflow-hidden">
//   {/* Enhanced geometric background pattern */}
//   <div className="absolute inset-0 opacity-[0.03]">
//     <div
//       className="absolute inset-0"
//       style={{
//         backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f766e' fill-opacity='0.1'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3Ccircle cx='20' cy='60' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
//         backgroundSize: "80px 80px",
//       }}
//     ></div>
//   </div>

//   {/* Floating accent elements - refined animation and positioning */}
//   <motion.div
//     className="absolute top-1/4 right-1/5 text-green-200"
//     animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
//     transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
//   >
//     <Rocket className="w-16 h-16 opacity-30" />
//   </motion.div>

//   <motion.div
//     className="absolute bottom-1/4 left-1/6 text-teal-200"
//     animate={{ y: [0, 12, 0], scale: [1, 1.05, 1] }}
//     transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
//   >
//     <Code className="w-14 h-14 opacity-25" />
//   </motion.div>

//   {/* Subtle grid overlay */}
//   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

//   {/* Main hero content */}
//   <div className="relative max-w-6xl mx-auto px-4">
//     <motion.div
//       initial={{ opacity: 0, y: 40 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//       className="text-center"
//     >
//       {/* Premium badge */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.6, delay: 0.2 }}
//         className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-green-200 shadow-sm mb-8"
//       >
//         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//         <span className="text-sm font-medium text-green-700">NACOS ABUAD Community</span>
//       </motion.div>

//       <motion.h1
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 0.3 }}
//         className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight"
//       >
//         Where Computing
//         <span className="block bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
//           Meets Innovation
//         </span>
//       </motion.h1>

//       <motion.p
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 0.5 }}
//         className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
//       >
//         Empowering ABUAD students to build, collaborate, and showcase ideas
//         that shape Africa's technology future.
//       </motion.p>

//       {/* Action buttons - premium styling */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 0.7 }}
//         className="flex flex-col sm:flex-row gap-4 justify-center items-center"
//       >
//         {isAuthenticated ? (
//           <>
//             <Link
//               to="/dashboard"
//               className="group relative bg-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-green-700 transition-all duration-300 overflow-hidden"
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <span className="relative flex items-center gap-2">
//                 Go to Dashboard
//                 <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                 </svg>
//               </span>
//             </Link>
//             <Link
//               to="/projects/new"
//               className="group border-2 border-green-600 text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300 backdrop-blur-sm"
//             >
//               <span className="flex items-center gap-2">
//                 Add Project
//                 <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                 </svg>
//               </span>
//             </Link>
//           </>
//         ) : (
//           <>
//             <Link
//               to="/projects"
//               className="group relative bg-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-green-700 transition-all duration-300 overflow-hidden"
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <span className="relative flex items-center gap-2">
//                 Explore Projects
//                 <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                 </svg>
//               </span>
//             </Link>
//             <Link
//               to="/events"
//               className="group border-2 border-green-600 text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300 backdrop-blur-sm"
//             >
//               <span className="flex items-center gap-2">
//                 Join Events
//                 <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//               </span>
//             </Link>
//           </>
//         )}
//       </motion.div>

//       {/* Auth prompt - refined typography */}
//       {!isAuthenticated && (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.9 }}
//           className="mt-8"
//         >
//           <p className="text-gray-500 text-lg">
//             Ready to join?{" "}
//             <Link
//               to="/register"
//               className="text-green-600 hover:text-green-700 font-semibold transition-colors"
//             >
//               Get started
//             </Link>{" "}
//             or{" "}
//             <Link
//               to="/login"
//               className="text-green-600 hover:text-green-700 font-semibold transition-colors"
//             >
//               sign in
//             </Link>
//           </p>
//         </motion.div>
//       )}
//     </motion.div>
//   </div>

//   {/* Bottom decorative element */}
//   <motion.div
//     className="absolute bottom-8 right-8 text-green-300 opacity-20"
//     animate={{ rotate: [0, 8, -8, 0], y: [0, -5, 0] }}
//     transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
//   >
//     <Users className="w-16 h-16" />
//   </motion.div>

//   {/* Scroll indicator */}
//   <motion.div
//     className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
//     animate={{ y: [0, 10, 0] }}
//     transition={{ duration: 2, repeat: Infinity }}
//   >
//     <div className="w-6 h-10 border-2 border-green-300 rounded-full flex justify-center">
//       <motion.div
//         className="w-1 h-3 bg-green-400 rounded-full mt-2"
//         animate={{ y: [0, 12, 0] }}
//         transition={{ duration: 2, repeat: Infinity }}
//       />
//     </div>
//   </motion.div>
// </section>
