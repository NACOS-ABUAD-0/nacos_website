import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import NacosLogo from "/images/nacos_logo.png";
import AbuadLogo from "../../public/images/abuadLogo.png";

type NavItem = {
  name: string;
  path: string;
};

const navItems: NavItem[] = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/projects" },
  { name: "Events", path: "/events" },
  { name: "Resources", path: "/resources" },
  { name: "Gallery", path: "/gallery" },
  { name: "Executives", path: "/executives" },
];

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`sticky top-0 z-[60] w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-md"
          : "bg-white/10 backdrop-blur-lg"
      }`}
    >
      <div className="flex justify-between items-center px-6 md:px-12 py-4">
        {/* Logo */}
        <div className="flex gap-3 items-center">
          <img src={AbuadLogo} alt="Abuad Logo" className="w-7 md:w-9" />
          <img src={NacosLogo} alt="Nacos Logo" className="w-9 md:w-11" />
          <h1 className={`font-bold text-lg lg:text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            NACOS ABUAD
          </h1>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
            {navItems.map((link) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-lg font-medium transition-colors ${
                    isActive
                      ? "text-[#006E3A]"
                      : `${isDark ? 'text-gray-300 hover:text-[#006E3A]' : 'text-gray-800 hover:text-[#006E3A]'}`
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <NavLink
            to="/login"
            className="px-6 py-2 bg-[#006E3A] hover:bg-[#005a30] rounded-lg text-white font-semibold shadow-md transition"
          >
            Login
          </NavLink>
        </div>

        {/* Mobile Toggle */}
        <button
          aria-label="Toggle menu"
          className="lg:hidden text-gray-900"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute right-4 top-16 w-[65%] bg-white rounded-xl shadow-xl transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          {navItems.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `text-base font-medium ${
                  isActive
                    ? "text-[#006E3A]"
                    : "text-gray-800 hover:text-[#006E3A]"
                }`
              }

            >
              {item.name}
            </NavLink>
          ))}

          <NavLink
            to="/login"
            className="px-8 py-2 bg-[#006E3A] text-white rounded-lg font-semibold"
          >
            Login
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;