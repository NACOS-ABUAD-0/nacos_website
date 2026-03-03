import SectionHeader from "./SectionHeader";

export default function LearningResourceCta() {
  return (
    <section className="mt-14 px-5 lg:px-24 mb-20">
      <SectionHeader title="Learning Resources" />

      <div className="bg-[#E8F4F8] rounded-[20px] py-16 px-6 text-center my-10">
        <h2 className="text-[#006E3A] font-bold text-3xl mb-4">
          Ready to Boost Your Academic Performance?
        </h2>
        <p className="max-w-xl mx-auto text-gray-600 mb-8 font-medium">
          Join thousands of engineering students who have already transformed
          their study experience. Access premium resources, connect with peers,
          and achieve your academic goals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-[#006E3A] text-white px-8 py-3 rounded-md font-semibold hover:bg-[#005a30] transition-colors">
            Explore Learning Resources
          </button>
        </div>
        <p className="text-center mt-7">Free and accessible to all students</p>
      </div>
    </section>
  );
}
