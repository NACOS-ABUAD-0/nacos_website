import { useState, useEffect } from "react";
import ExecCard from "../components/ExecCard";
import SectionHeader from "../components/SectionHeader";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import PageHeader from "../components/PageHeader";

type Executive = {
  id: number;
  name: string;
  position: string;
  level: string;
  bio: string;
  image: string;
};

interface ExecutivesProps {
  isHome: boolean; // The name of the prop and its type
}

export default function Executives({ isHome }: ExecutivesProps) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const executives: Executive[] = [
    {
      id: 1,
      name: "Bada Najeebah Motunrayo",
      position: "President",
      level: "Computer Science 400 Level",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
      image: "/images/Bada.jpg",
    },
    {
      id: 2,
      name: "Amalaha Jeffrey Chigozie",
      position: "Vice President",
      level: "Computer Science 300 Level",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
      image: "/images/jeff2.jpg",
    },
    {
      id: 3,
      name: "Oyekunle Olaoluwa Oluwanifemi",
      position: "Chief Of Staff",
      level: "Computer Science 400 Level",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
      image: "/images/victor.jpg",
    },
    {
      id: 4,
      name: "Hassan Mukthar Feranmi",
      position: "Hardware Director",
      level: "Computer Science 300 Level",
      image: "/images/hassan.jpg",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 5,
      name: "Ifediba Chimdalu",
      position: "Social Director",
      level: "Computer Science 300 Level",
      image: "/images/ifediba.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 6,
      name: "Abdulazeez Jamiu Oladipupo",
      position: "Software Director",
      level: "Computer Science 300 Level",
      image: "/images/jamiu.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 7,
      name: "Nwezi Favour",
      position: "Financial Secretary",
      level: "Computer Science 300 Level",
      image: "/images/nwezi.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 8,
      name: "Akinkunmi Ibitoye",
      position: "Welfare Director",
      level: "Computer Science 300 Level",
      image: "/images/akinkunmi.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 9,
      name: "Mojoyinoluwa Sholotan",
      position: "General Secretary",
      level: "Computer Science 400 Level",
      image: "/images/mj.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 10,
      name: "Julius Toney Chukwuemeka",
      position: "Academic Director",
      level: "Computer Science 400 Level",
      image: "/images/tony.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 11,
      name: "Udotchay Oluchi",
      position: "Assistant General Secretary",
      level: "Computer Science 200 Level",
      image: "/images/oluhci.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 12,
      name: "Ayinde Adedotun",
      position: "Public Relation Officer",
      level: "Computer Science 300 Level",
      image: "/images/dotun.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
    {
      id: 13,
      name: "Iwuanyanwu Godsgift Ebube",
      position: "Sports Director",
      level: "Computer Science 400 Level",
      image: "/images/ebube.png",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae suscipit vel vel facilisis venenatis. Semper risus in hendrerit gravida rutrum quisque non tellus.",
    },
  ];

  // 1. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  let displayData: Executive[] = [];

  if (isHome) {
    displayData = executives.slice(0, 3);
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayData = executives.slice(startIndex, endIndex);
  }

  const totalPages = Math.ceil(executives.length / itemsPerPage);
  return (
    // <section className="flex gap-2 lg:gap-10 w-full flex-wrap justify-center mt-16 p-5">
    //   <SectionHeader
    //     subtitle="Leadership Team"
    //     title="Meet our Executive Team"
    //   />
    //   {displayData.map((exec) => (
    //     <ExecCard key={exec.id} {...exec} />
    //   ))}

    //   <div className="w-full flex flex-col justify-center items-center gap-4">
    //     <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] leading-none tracking-normal text-[#006E3A]">
    //       Get to know our full team
    //     </h1>
    //     <p className="font-semibold text-lg lg:text-[20px] leading-none tracking-[-0.03em] text-center">
    //       Discover more about our executive team
    //     </p>
    //     {isHome ? (
    //       <Link
    //         to="/"
    //         className="px-8 py-2.5 bg-[#006E3A] hover:bg-[#005a30] transition-all rounded-lg text-white font-semibold text-lg"
    //       >
    //         View All Executive
    //       </Link>
    //     ) : null}
    //   </div>
    // </section>
    <>
      {!isHome ? <Navbar /> : null}
      {isHome ? (
        <SectionHeader
          subtitle="Leadership Team"
          title="Meet our Executive Team"
        />
      ) : (
        <PageHeader
          title="NACOS EXECUTIVES"
          subtitle="Our current executive committee is committed to serving the interests of all engineering students at ABUAD..."
        />
      )}

      <section
        className={`${isHome ? "grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto" : "grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto"}`}
        id="top"
      >
        {displayData.map((exec) => (
          <ExecCard key={exec.id} {...exec} />
        ))}
      </section>

      <div className="w-full flex flex-col justify-center items-center gap-4">
        {!isHome ? (
          /* --- STYLED PAGINATION --- */
          <div className="flex justify-center items-center gap-4 mt-8 mb-20 px-4">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="group p-3 rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-green-600 transition-all duration-300"
            >
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-green-600 rotate-180 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            {/* Clickable Page Numbers */}
            <div className="flex items-center gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md scale-110"
                          : "text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="group p-3 rounded-full border border-transparent bg-gradient-to-r from-green-600 to-teal-600 shadow-md disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        ) : (
          /* --- HOME VIEW LINK --- */
          <div className="w-full flex items-center flex-col gap-2 p-3 mb-20">
            <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] leading-none tracking-normal text-[#006E3A] text-center">
              Get to know our full team
            </h1>
            <p className="font-semibold text-lg lg:text-[20px] leading-none tracking-[-0.03em] text-center text-gray-700">
              Discover more about our executive team
            </p>
            <Link
              to="/executives#top"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mt-5"
            >
              View all Executives
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {!isHome ? <Footer /> : null}
    </>
  );
}
