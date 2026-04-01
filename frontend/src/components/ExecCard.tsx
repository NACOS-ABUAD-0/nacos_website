import { UserStar, Building2, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function ExecCard({ name, position, level, bio, image }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="rounded-2xl overflow-hidden bg-white border shadow-sm hover:shadow-xl transition"
    >
      <div className="relative h-[260px]">
        <img src={image} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="font-bold text-lg">{name}</h2>
          <p className="text-sm text-white/80">{position}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <UserStar className="w-4 h-4 text-[#006E3A]" />
          {position}
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#006E3A]" />
          {level}
        </div>

        <div className="flex items-center gap-2 font-medium">
          <Phone className="w-4 h-4 text-[#006E3A]" />
          {bio}
        </div>
      </div>
    </motion.div>
  );
}