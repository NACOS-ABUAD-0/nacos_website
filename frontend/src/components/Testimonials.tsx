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

      <div className="flex flex-col md:flex-row items-center justify-center mt-10">
        <TestimonialCard
          name="Abdulazeez Jamiu Oladipupo"
          level="Computer Science 300 Level"
          text="With NACOS I've been able to build more projects, and think in systems."
        />
        <TestimonialCard
          name="Abdulyeekeen Habeebullah Adebayo"
          level="Computer Science 300 Level"
          text="With NACOS I've made more connection and built more network."
          isActive={true}
        />
        <TestimonialCard
          name="Adeyanju Temisola"
          level="Computer Science 200 Level"
          text="NACOS has really helped me become a better Computer Science Student."
        />
      </div>

      <PartnerCTA />

      {/* Sponsors Logobar */}
      <div className="flex flex-wrap justify-center items-center gap-10">
        <img src='/images/asva.jpg' alt="Sponsor" className="h-28 w-auto" />
        <img src='/images/iee abuad.jpg' alt="Sponsor" className="h-28 w-auto" />
        <img src="/images/ASA.jpg" className="h-28 w-auto" />
        <img src="/images/apwen abuad.jpg" className="h-28 w-auto" />
        <img src="/images/nacos unilag.jpg" className="h-28 w-auto" />
      </div>
    </section>
  );
}