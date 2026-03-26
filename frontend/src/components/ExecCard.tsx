import { UserStar } from "lucide-react";
import { Building2 } from "lucide-react";
type ExecCardProps = {
  name: string;
  position: string;
  level: string;
  bio: string;
  image: string;
};

export default function ExecCard({
  name,
  position,
  level,
  bio,
  image,
}: ExecCardProps) {
  return (
    <div className="w-full max-w-125 aspect-426/463 mb-3">
      <img src={image} alt={name} className="w-full h-full object-cover rounded-t-[10px]" />
      <div className="p-6 mb-5 bg-[#E8F4F8] flex flex-col gap-3 shadow-[0px_4px_15px_2px_rgba(0,0,0,0.08)] rounded-b-[10px]">
        <h1 className="font-semibold text-xl leading-none tracking-normal text-[#006E3A]">
          {name}
        </h1>
        <p className="flex items-center text-[#000000BF] font-medium text-base leading-none tracking-normal gap-2">
          <UserStar /> {position}
        </p>
        <p className="flex items-center gap-2 text-[#000000BF] font-medium text-base leading-none tracking-normal">
          <Building2 /> {level}
        </p>
        <p className="text-[#000000BF] font-medium text-base leading-none tracking-normal">
          {bio}
        </p>
      </div>
    </div>
  );
}
