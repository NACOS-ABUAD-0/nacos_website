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
    // Calculate start and end index for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayData = executives.slice(startIndex, endIndex);
  }

  // 3. Calculate total pages
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
          subtitle="Our current executive committee is committed to serving the
interests of all engineering students at ABUAD and creating 
opportunities for academic and professional growth."
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
        {/* <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] leading-none tracking-normal text-[#006E3A]">
          Get to know our full team
        </h1>
        <p className="font-semibold text-lg lg:text-[20px] leading-none tracking-[-0.03em] text-center">
          Discover more about our executive team
        </p> */}

        {!isHome ? (
          <div className="flex items-center gap-3 mt-4 mb-10">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 rounded-lg font-bold border border-gray-300 disabled:opacity-30"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-[59px] h-[59px] rounded-full font-bold border transition-all ${
                    currentPage === pageNum
                      ? "bg-[#006E3A] text-white border-[#006E3A]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#006E3A]"
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}

            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
              }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#006E3A] text-white rounded-lg font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center flex-col gap-2 p-3">
            {/* Your original text stays here */}
            <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] leading-none tracking-normal text-[#006E3A]">
              Get to know our full team
            </h1>
            <p className="font-semibold text-lg lg:text-[20px] leading-none tracking-[-0.03em] text-center">
              Discover more about our executive team
            </p>
            <Link
              to="/executives#top"
              className="px-6 py-3 bg-[#006E3A] text-white rounded-lg mt-2 text-xl"
            >
              View all Excecutives
            </Link>
          </div>
        )}
      </div>

      {!isHome ? <Footer /> : null}
    </>
  );
}
