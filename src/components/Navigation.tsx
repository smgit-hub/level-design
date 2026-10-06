import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { trackEvent } from "../lib/analytics";

interface Props {
  currentPath: string;
}

const navLinks = [
  { path: "/signature/", label: "Signature Collection" },
  { path: "/studio/", label: "Studio Collection" },
  { path: "/projects/", label: "Projects" },
  { path: "/custom/", label: "Custom Design" },
  { path: "/about/", label: "About" },
];

export default function Navigation({ currentPath }: Props) {
  const isHomepage = currentPath === "/";
  const [isScrolled, setIsScrolled] = useState(!isHomepage);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState(currentPath);
  // The site's main action is buying a Studio table, so the header button is the same on every page.
  const ctaLabel = "Shop Now";
  const ctaHref = "/studio/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.location.pathname !== "/" || window.scrollY > 20);
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
        isScrolled ? "bg-[#3d4f47]/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center h-16">

          {/* Logo */}
          <a href="/" aria-label="Level Design home" className="flex items-center gap-3 group min-w-0 justify-self-start">
            <div className="w-12 h-12 rounded-full bg-[#e8dcc8] flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
              <img
                src="/images/level-logo.png"
                alt="Level Design"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white text-lg font-semibold truncate">Level Design</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 justify-self-center">
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
            href={ctaHref}
            onClick={() =>
              trackEvent("select_content", {
                content_type: "cta",
                item_id: "shop_now_nav_desktop",
                page_path: window.location.pathname,
              })
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-5 py-2 bg-[#c8956a] text-white rounded-full hover:bg-[#b8856a] transition-all duration-300 text-sm font-medium shadow-sm justify-self-end"
          >
            {ctaLabel}
          </motion.a>

          {/* Mobile CTA + toggle */}
          <div className="md:hidden flex items-center gap-3 justify-self-end">
            <a
              href={ctaHref}
              onClick={() =>
                trackEvent("select_content", {
                  content_type: "cta",
                  item_id: "shop_now_nav_mobile_header",
                  page_path: window.location.pathname,
                })
              }
              className="px-4 py-2 bg-[#c8956a] text-white rounded-full text-sm font-medium shadow-sm whitespace-nowrap active:bg-[#b8856a]"
            >
              {ctaLabel}
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#e8dcc8] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mx-4 mb-4 overflow-hidden rounded-2xl border border-white/15 bg-[#1f2f29]/88 shadow-2xl backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    activePath === link.path
                      ? "bg-white/12 text-white"
                      : "text-[#e8dcc8] hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <a
                href={ctaHref}
                onClick={() =>
                  trackEvent("select_content", {
                    content_type: "cta",
                    item_id: "shop_now_nav_mobile",
                    page_path: window.location.pathname,
                  })
                }
                className="block px-4 py-3 text-center bg-[#c8956a] text-white font-medium rounded-lg hover:bg-[#b8856a] transition-colors"
              >
                {ctaLabel}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
