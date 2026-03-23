import image from "../../public/images/Bada2.jpg";

export default function About() {
  return (
    <section className="mt-44 lg:mt-72 px-6 md:px-12 lg:px-24 mb-20">
      {/* Header Section */}
      <div className="w-full max-w-[570px] min-h-[145px] flex flex-col gap-3 items-center lg:items-start text-center lg:text-left mx-auto lg:mx-0">
        <h2 className="font-bold text-[20px] md:text-[25px] lg:text-4xl leading-none tracking-normal text-[#006E3A]">
          ABOUT US
        </h2>
        <p className="font-bold text-2xl md:text-3xl lg:text-[32px] leading-tight md:leading-none tracking-normal">
          The Biggest and the Most Organized Student Body in ABUAD
        </p>
        <div className="w-[138px] h-[9px] flex">
          <div className="w-[20%] bg-[#006E3A] rounded-l-xl"></div>
          <div className="w-[10%] bg-white"></div>
          <div className="w-[70%] bg-[#006E3A] rounded-r-xl"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col lg:flex-row mt-16 gap-16 lg:gap-10 justify-between items-center">
        {/* Left Side: Image & Mission Card */}
        <div className="w-full lg:max-w-[600px] relative">
          <img
            src={image}
            alt="About NACOS"
            className="w-full aspect-[6/7] object-cover rounded-[10px]"
          />

          {/* Mission Card - Responsive adjustments */}
          <div
            className="  bg-white 
  absolute
  lg:left-auto lg:translate-x-0 lg:-right-10
  -bottom-28 lg:-bottom-32
  shadow-lg md:shadow-[0px_1px_15px_0px_rgba(0,0,0,0.1)]
  w-[90%] sm:w-[80%] md:w-[407px]
  rounded-[10px] py-6 px-6 md:px-7
  flex flex-col gap-4 z-10 right-0"
          >
            <h1 className="font-medium text-lg md:text-xl leading-none tracking-normal text-[#006E3A]">
              Our Mission
            </h1>
            <p className="font-normal text-xs md:text-[18px] lg:text-[20px] leading-relaxed md:leading-[31px] tracking-normal">
              To equip computing students with the skills, resources and
              community they need to thrive academically and professionally.
            </p>
            <div className="flex items-center gap-1 self-end">
              <div className="bg-[#006E3A] w-[13px] h-[13px] rounded-full"></div>
              <div className="bg-[#D9D9D9] w-[13px] h-[13px] rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-[770px] flex flex-col gap-7 mt-16">
          <p className="font-medium text-lg leading-relaxed md:text-[20px] md:leading-[34px] tracking-normal">
            The Nigerian Association of Computing Students - ABUAD Chapter is
            the official student body representing all students in the
            Department of Computing at Afe Babalola University.
          </p>
          <p className="font-medium text-lg leading-relaxed md:text-[20px] md:leading-[34px] tracking-normal text-gray-700">
            As one of the most active and fast-growing chapters in the
            university, this body is committed to promoting academic excellence,
            technical innovations, and professional development among students.
          </p>

          <h3 className="font-semibold text-xl md:text-[22px] leading-none text-[#006E3A]">
            Our Chapter Strength
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-2">
            {[
              "Active Student Developers",
              "Professional Certificates",
              "Award Winning Workshops",
              "24/7 Academic Support",
            ].map((strength) => (
              <div key={strength} className="flex items-center gap-3">
                <div className="bg-[#006E3A] w-[13px] h-[13px] rounded-full shrink-0"></div>
                <p className="font-medium text-base md:text-[18px] lg:text-[20px] leading-tight">
                  {strength}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
