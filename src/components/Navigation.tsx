import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface Props {
  currentPath: string;
}

const navLinks = [
  { path: "/tables/", label: "Tables" },
  { path: "/custom/", label: "Custom" },
  { path: "/about/", label: "About" },
];

export default function Navigation({ currentPath }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState(currentPath);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // Keep active path in sync with Astro View Transitions
    const handlePageLoad = () => {
      setActivePath(window.location.pathname);
      setIsMobileMenuOpen(false);
    };
    document.addEventListener("astro:page-load", handlePageLoad);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("astro:page-load", handlePageLoad);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#3d4f47]/95 backdrop-blur-md shadow-lg" : "bg-[#3d4f47]"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" aria-label="Level Design home" className="flex items-center gap-3 group min-w-0 flex-shrink">
            <div className="w-10 h-10 rounded-full bg-[#e8dcc8] flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
              <img
                src="/images/level-logo.png"
                alt="Level Design"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[#e8dcc8] text-base font-semibold truncate">Level Design</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className="relative text-[#e8dcc8] hover:text-white transition-colors duration-200 py-2"
              >
                {link.label}
                {activePath === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8956a]"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </a>
            ))}
          </div>

          {/* CTA */}
          <motion.a
            href="/contact/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-5 py-2 bg-[#c8956a] text-white rounded-full hover:bg-[#b8856a] transition-all duration-300 text-sm font-medium shadow-sm"
          >
            Start a Project
          </motion.a>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-[#e8dcc8] hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#2d3f37] border-t border-[#4d5f57]"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    activePath === link.path
                      ? "bg-[#3d4f47] text-white"
                      : "text-[#e8dcc8] hover:bg-[#3d4f47]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/contact/"
                className="block px-4 py-2 text-center bg-[#e8dcc8] text-[#3d4f47] rounded-lg hover:bg-[#c8956a] transition-colors"
              >
                Start a Project
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
