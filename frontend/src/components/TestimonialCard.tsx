import React from "react";
interface TestimonialProps {
  name: string;
  level: string;
  text: string;
  isActive?: boolean;
}

const TestimonialCard: React.FC<TestimonialProps> = ({
  name,
  level,
  text,
  isActive,
}) => (
  <div
    className={`p-6 rounded-[10px] flex flex-col gap-4 w-full md:w-[380px] transition-all duration-300 ${
      isActive
        ? "bg-white shadow-[0px_1px_15px_0px_rgba(0,0,0,0.1)] scale-105 z-10"
        : "bg-[#E8F4F8]"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-300 rounded-md overflow-hidden shrink-0">
        {/* User Image Here */}
      </div>
      <div>
        <h4 className="font-semibold text-[#006E3A] text-sm">{name}</h4>
        <p className="text-gray-500 text-xs">{level}</p>
      </div>
    </div>
    <hr className="w-full h-[2px] bg-[#00000033] mt-3 mb-3" />
    <p className="text-gray-600 text-sm leading-relaxed italic">"{text}"</p>
  </div>
);

export default TestimonialCard;