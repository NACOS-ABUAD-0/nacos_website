import React from 'react';

interface SectionHeaderProps {
  subtitle?: string; // The "?" makes it optional
  title?: string;    // The "?" makes it optional
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ subtitle, title }) => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Subtitle - Only renders if subtitle exists */}
      {subtitle && (
        <h2 className="text-center font-bold text-xl md:text-[25px] leading-none tracking-normal text-[#006E3A] mb-5 uppercase">
          {subtitle}
        </h2>
      )}

      {/* Main Title - Only renders if title exists */}
      {title && (
        <h1 className="font-bold text-2xl md:text-3xl leading-none text-center mb-5">
          {title}
        </h1>
      )}

      {/* Decorative Bar - Always stays at the bottom */}
      <div className="w-full flex justify-center mb-7">
        <div className="w-[267px] h-[9px] flex gap-1.5 items-center">
          <div className="w-[45%] h-full bg-[#006E3A] rounded-l-xl"></div>
          <div className="w-[9px] h-[9px] bg-[#006E3A] rounded-full flex-shrink-0"></div>
          <div className="w-[45%] h-full bg-[#006E3A] rounded-r-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;