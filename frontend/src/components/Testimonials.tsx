import SectionHeader from "./SectionHeader";
import TestimonialCard from "./TestimonialCard";
import { PartnerCTA } from "./PartnerCta";
import logo1 from '../assets/sponsor1.png';
import logo2 from '../assets/sponsor2.jpg';
import logo3 from '../assets/sponsor3.jpg';
import logo4 from '../assets/sponsor4.jpg';

export default function Testimonials() {
  return (
    <section className="mt-36 px-5 lg:px-24 mb-20">
      <SectionHeader
        subtitle="Testimonials"
        title="What Computing Students say
        about NACOS"
      />

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 mt-10">
        <TestimonialCard
          name="Abdulyeekeen Habeebullah Adebayo"
          level="Computer Science 300 Level"
          text="With NACOS I've made more connection and built more network."
        />
        <TestimonialCard
          name="Abdulyeekeen Habeebullah Adebayo"
          level="Computer Science 300 Level"
          text="With NACOS I've made more connection and built more network."
          isActive={true}
        />
        <TestimonialCard
          name="Abdulyeekeen Habeebullah Adebayo"
          level="Computer Science 300 Level"
          text="With NACOS I've made more connection and built more network."
        />
      </div>

      <PartnerCTA />

      {/* Sponsors Logobar */}
      <div className="flex flex-wrap justify-center items-center gap-10">
        <img src={logo3} alt="Sponsor" className="h-28 w-auto" />
        <img src={logo1} alt="Sponsor" className="h-28 w-auto" />
        <img src={logo4} alt="Sponsor" className="h-28 w-auto" />
        <img src={logo2} alt="Sponsor" className="h-28 w-auto" />
      </div>
    </section>
  );
}