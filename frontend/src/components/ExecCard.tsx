import { UserStar, Building2, Mail, CalendarRange } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightCard from "./reactbits/SpotlightCard";
import ExpandableCard from "./ExpandableCard";

interface ExecCardProps {
  name: string;
  position: string;
  level: string;
  email: string;
  image: string;
  session:string;
}

export default function ExecCard({ name, position, level, email, image, session }: ExecCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
    <ExpandableCard label={name}>
    <SpotlightCard
      className="rounded-2xl bg-white border shadow-sm hover:shadow-xl transition"
      spotlightColor="rgba(0, 110, 58, 0.14)"
    >
      <div className="relative h-[260px]">
        <img src={image} className="w-full h-full object-cover" alt={name} />
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
          <Mail className="w-4 h-4 text-[#006E3A]" />
          {email}
        </div>
        <div className="flex items-center gap-2 font-medium">
          <CalendarRange className="w-4 h-4 text-[#006E3A]" />
          {session}
        </div>
      </div>
    </SpotlightCard>
    </ExpandableCard>
    </motion.div>
  );
}