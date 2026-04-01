import FaciImage1 from "../assets/hardware lab.jpg";
import FaciImage2 from "../assets/software lab.jpg"
import { Building2 } from "lucide-react";

export default function Facilities() {
  return (
    <section className="mt-36 px-5 lg:px-24 mb-16">
      <h1 className="text-center font-bold text-xl md:text-[25px] leading-none tracking-normal text-[#006E3A] mb-5">
        NACOS ABUAD
      </h1>
      <h1 className="font-bold text-2xl md:text-3xl leading-none text-center mb-5">
        Our Facilities
      </h1>
      <div className="w-full flex justify-center mb-7">
        <div className="w-[267px] h-[9px] flex gap-1.5">
          <div className="w-[45%] bg-[#006E3A] rounded-l-xl"></div>
          <div className="w-[9px] bg-[#006E3A] rounded-full"></div>
          <div className=" w-[45%] bg-[#006E3A] rounded-r-xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20 justify-items-center">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-[700px]">
          <img
            src={FaciImage1}
            alt="Hardware Lab"
            className="w-full h-64 md:h-125 object-cover"
          />

          <div className="p-6">
            <h3 className="flex items-center gap-2 text-[#006E3A] font-semibold text-xl md:text-2xl mb-2">
              <Building2 />
              Hardware Lab
            </h3>
            <p className="ml-6 text-gray-700 font-medium text-lg md:text-xl">
              Sciences Building, 2nd Floor
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-[700px]">
          <img
            src={FaciImage2}
            alt="Software Lab"
            className="w-full h-64 md:h-[500px] object-cover"
          />

          <div className="p-6">
            <h3 className="flex items-center gap-2 text-[#006E3A] font-semibold text-xl md:text-2xl mb-2">
              <Building2 />
              Software Lab
            </h3>
            <p className="ml-6 text-gray-700 font-medium text-lg md:text-xl">
              Sciences Building, 2nd Floor
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
