interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="w-full flex justify-center">
      <div className="flex justify-center flex-col mt-28 max-w-[718px] items-center gap-5">
        <h1 className="font-bold text-3xl md:text-4xl lg:text-[45px] leading-none tracking-normal text-[#006E3A]">
          {title}
        </h1>
        <p className="font-normal text-xl lg:text-[25px] leading-none tracking-normal text-center text-[#00000080] mb-5">
          {subtitle}
        </p>
        <div className="w-full flex justify-center mb-7">
          <div className="w-[267px] h-[9px] flex gap-1.5 items-center">
            <div className="w-[45%] h-full bg-[#006E3A] rounded-l-xl"></div>
            <div className="w-[9px] h-[9px] bg-[#006E3A] rounded-full flex-shrink-0"></div>
            <div className="w-[45%] h-full bg-[#006E3A] rounded-r-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
