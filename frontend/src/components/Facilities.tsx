import FaciImage from "../assets/kate-sade-2zZp12ChxhU-unsplash (1).jpg";
import { Building2 } from "lucide-react";

export default function Facilities() {
  return (
    <section className="mt-36 px-5 lg:px-24">
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

      <div className="flex mt-20 justify-between flex-wrap">
        <div className="w-[728px] bg-white relative mb-28">
          <img
            src={FaciImage}
            alt="Song cover"
            className="w-full min-h-full object-cover rounded-[10px]"
          />

          <div className="p-4 mb-20">
            <h3 className="flex font-semibold text-xl md:text-[25px] leading-none tracking-normal items-center gap-2 text-[#006E3A] mb-4">
              <Building2 />
              Hardware Lab
            </h3>
            <p className="font-medium text-lg md:text-xl leading-none tracking-normal ml-5">
              Sciences Building , 3rd Floor.
            </p>
          </div>
        </div>

        <div className="w-[728px] bg-white relative mb-20">
          <img
            src={FaciImage}
            alt="Song cover"
            className="w-full min-h-full object-cover rounded-[10px]"
          />

          <div className="p-4">
            <h3 className="flex font-semibold text-xl md:text-[25px] leading-none tracking-normal items-center gap-2 text-[#006E3A] mb-4">
              <Building2 />
              Hardware Lab
            </h3>
            <p className="font-medium text-lg md:text-xl leading-none tracking-normal ml-5">
              Sciences Building , 3rd Floor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}