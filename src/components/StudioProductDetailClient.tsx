import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, Truck } from "lucide-react";
import type { StudioProduct } from "../data/studio-products";
import { trackEvent } from "../lib/analytics";
import StudioTableOutline from "./StudioTableOutline";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        "auto-rotate"?: string;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "camera-controls"?: string;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        exposure?: string;
        loading?: string;
        "touch-action"?: string;
        "environment-image"?: string;
      };
    }
  }
}

interface Props {
  product: StudioProduct;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(cents / 100);

const MODEL_VIEWER_SCRIPT_ID = "model-viewer-script";

export default function StudioProductDetailClient({ product }: Props) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const views = [
    { id: "model", label: "3D view" },
    ...product.images.gallery.map((src, i) => ({ id: src, label: product.images.gallery.length === 1 ? "Room view" : `Photo ${i + 1}` })),
  ];
  // The 3D model is the lead visual — it's the default view, with renders as alternates.
  const [selectedView, setSelectedView] = useState<"model" | string>("model");
  // Default to the middle size when there are three, or the smallest when there are two.
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[Math.floor((product.sizes.length - 1) / 2)].id);
  // Sizes are listed smallest first, and the 3D model and room photo are made at the largest.
  const largestSize = product.sizes[product.sizes.length - 1];
  const selectedSize = product.sizes.find((s) => s.id === selectedSizeId) ?? product.sizes[0];

  // On touch screens the viewer starts in scroll mode behind a "Tap to explore" cover, so dragging the
  // model doesn't scroll the page. Tapping hands every touch to the model until "Done" is pressed.
  const [isTouch, setIsTouch] = useState(false);
  const [touchUnlocked, setTouchUnlocked] = useState(false);
  const viewerBoxRef = useRef<HTMLDivElement>(null);

  // On phones, a slim buy bar stays at the bottom whenever the main Buy Now button is off-screen —
  // except at the end of the page, where the other-tables section takes over.
  const buyRef = useRef<HTMLButtonElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  const [pageEndVisible, setPageEndVisible] = useState(false);
  const showBuyBar = !buyVisible && !pageEndVisible;

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    if (buyRef.current) {
      const io = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
      io.observe(buyRef.current);
      observers.push(io);
    }
    const end = document.getElementById("studio-other-tables");
    if (end) {
      const io = new IntersectionObserver(([entry]) => setPageEndVisible(entry.isIntersecting));
      io.observe(end);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (selectedView !== "model") setTouchUnlocked(false);
  }, [selectedView]);

  // touch-action alone isn't honoured everywhere, so also cancel scroll gestures directly. The listener must be
  // native and non-passive — React's own touch handlers are passive and can't cancel scrolling.
  useEffect(() => {
    const box = viewerBoxRef.current;
    if (!box || !touchUnlocked) return;
    const block = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    box.addEventListener("touchmove", block, { passive: false });
    return () => box.removeEventListener("touchmove", block);
  }, [touchUnlocked]);

  useEffect(() => {
    if (document.getElementById(MODEL_VIEWER_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = MODEL_VIEWER_SCRIPT_ID;
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    document.head.appendChild(script);
  }, []);

  const handleBuyNow = async () => {
    setCheckoutError(false);
    setIsCheckingOut(true);
    try {
      const response = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, sizeId: selectedSize.id }),
      });
      if (!response.ok) throw new Error("Checkout session creation failed");
      const { url } = await response.json();
      if (!url) throw new Error("No checkout URL returned");
      trackEvent("begin_checkout", {
        currency: "AUD",
        value: selectedSize.price / 100,
        item_id: `${product.id}_${selectedSize.id}`,
        item_name: `${product.name} (${selectedSize.label})`,
      });
      window.location.href = url;
    } catch {
      setCheckoutError(true);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-[#faf8f5]">
      {/* Product header */}
      <section className="pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="text-xs text-[#8a9b94] mb-8 mt-2">
            <a href="/studio/" className="inline-flex items-center gap-1.5 hover:text-[#3d4f47] transition-colors">
              <ArrowLeft size={12} />
              Studio Collection
            </a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12">

            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                {views.length > 1 && (
                  <div className="flex gap-2 mb-3" role="tablist" aria-label="Product views">
                    {views.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedView === view.id}
                        onClick={() => setSelectedView(view.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
                          selectedView === view.id
                            ? "bg-[#3d4f47] text-white"
                            : "bg-white text-[#3d4f47] border border-[#e5ddd0] hover:border-[#c8956a]"
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  ref={viewerBoxRef}
                  style={touchUnlocked ? { touchAction: "none" } : undefined}
                  className="aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden relative bg-[#3d4f47]"
                >
                  {selectedView === "model" ? (
                    <model-viewer
                      src={product.model}
                      touch-action={touchUnlocked ? "none" : "pan-y"}
                      auto-rotate=""
                      auto-rotate-delay="0"
                      rotation-per-second="20deg"
                      camera-controls=""
                      shadow-intensity="1.2"
                      shadow-softness="0.8"
                      exposure="2.4"
                      environment-image="/environments/studio-light.jpg"
                      loading="eager"
                      style={{ width: "100%", height: "100%", background: "transparent" }}
                    >
                      <div slot="poster" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#3d4f47" }}>
                        <span style={{ color: "#e8dcc8", fontSize: 13, letterSpacing: "0.1em", opacity: 0.7 }}>Loading 3D model…</span>
                      </div>
                    </model-viewer>
                  ) : (
                    <img
                      src={selectedView}
                      alt={product.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  )}
                  <span className="absolute top-3 right-3 bg-black/50 text-white/85 text-xs tracking-wide px-3 py-1 rounded-full pointer-events-none">
                    Shown at {largestSize.label.replace(" Diameter", " dia")}
                  </span>
                  {selectedView === "model" && (
                    <span className="absolute bottom-3 left-3 bg-black/50 text-white/80 text-xs tracking-wide px-3 py-1 rounded-full pointer-events-none">
                      {isTouch ? (touchUnlocked ? "Drag to rotate · Pinch to zoom" : "Tap to explore in 3D") : "Drag to rotate · Scroll to zoom"}
                    </span>
                  )}
                  {isTouch && selectedView === "model" && !touchUnlocked && (
                    <div
                      role="button"
                      aria-label="Tap to explore in 3D"
                      onClick={() => setTouchUnlocked(true)}
                      className="absolute inset-0 z-[5] cursor-pointer"
                    />
                  )}
                  {isTouch && selectedView === "model" && touchUnlocked && (
                    <button
                      type="button"
                      onClick={() => setTouchUnlocked(false)}
                      className="absolute top-3 left-3 z-10 bg-black/50 text-white/85 text-xs tracking-wide px-3 py-1 rounded-full cursor-pointer"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-serif text-[#c8956a] mb-4">{product.name}</h1>
                <p className="text-xl text-[#5a6b64] mb-4">{product.tagline}</p>
                {/* Size selector */}
                <div className="mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#8a9b94] mb-3">Size (mm)</h2>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${product.sizes.length}, minmax(0, 1fr))` }}>
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSizeId(size.id)}
                        aria-pressed={size.id === selectedSizeId}
                        className={`px-2 pt-2 pb-3 sm:px-3 rounded-xl border-2 text-center transition-colors duration-200 cursor-pointer ${
                          size.id === selectedSizeId ? "border-[#c8956a] bg-[#f5f1e8]" : "border-[#e5ddd0] bg-white hover:border-[#c8956a]/50"
                        }`}
                      >
                        <div className="w-[75%] mx-auto">
                          <StudioTableOutline product={product} size={size} compact />
                        </div>
                        <div className="text-[13px] sm:text-sm font-medium text-[#3d4f47] mt-1">{size.label.replace(/mm/g, "")}</div>
                        <div className="text-sm font-semibold text-[#c8956a] mt-0.5">{formatPrice(size.price)}</div>
                        <div className="text-xs text-[#8a9b94] mt-0.5">{size.seating}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#8a9b94] mt-2">Sizes in mm, drawn to scale from above. The 3D view and room photo show the largest size ({largestSize.label.replace(/mm/g, "").replace(" Diameter", " dia")}).</p>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-3 mb-4">
                  {selectedSize.compareAtPrice && selectedSize.compareAtPrice > selectedSize.price && (
                    <span className="text-xl text-[#8a9b94] line-through">{formatPrice(selectedSize.compareAtPrice)}</span>
                  )}
                  <p className="text-3xl font-semibold text-[#3d4f47]">{formatPrice(selectedSize.price)}</p>
                  {selectedSize.compareAtPrice && selectedSize.compareAtPrice > selectedSize.price && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-white bg-[#c8956a] px-2 py-1 rounded-full">Sale</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    ref={buyRef}
                    onClick={handleBuyNow}
                    disabled={isCheckingOut}
                    className="flex-1 px-6 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCheckingOut ? "Redirecting to checkout…" : `Buy Now — ${formatPrice(selectedSize.price)}`}
                  </button>
                </div>
                {checkoutError && (
                  <p className="text-sm text-red-600 text-center mt-4">
                    Something went wrong starting checkout — please try again or email us directly at hello@leveldesign.com.au
                  </p>
                )}

                <div className="flex items-start gap-3 mt-5 text-sm text-[#5a6b64]">
                  <Truck className="text-[#c8956a] flex-shrink-0 mt-0.5" size={18} />
                  <span>Delivery from $199 (Melbourne Metro) · 6–8 week lead time · Secure checkout</span>
                </div>
                <a
                  href="/contact/"
                  onClick={() =>
                    trackEvent("select_content", {
                      content_type: "cta",
                      item_id: "studio_questions_before_buying",
                      table_name: product.name,
                      page_path: window.location.pathname,
                    })
                  }
                  className="inline-block mt-3 text-sm text-[#3d4f47] underline underline-offset-4 hover:text-[#c8956a] transition-colors"
                >
                  Questions before buying? Get in touch
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features + specifications */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div>
              <h2 className="text-3xl font-serif text-[#3d4f47] mb-4">Key Features</h2>
              <p className="text-[#5a6b64] leading-relaxed mb-6">{product.description}</p>
              <ul className="space-y-4">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-[#c8956a] mt-0.5 flex-shrink-0" size={20} />
                    <span className="text-[#5a6b64]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-serif text-[#3d4f47] mb-8">Specifications</h2>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries({
                  "Dimensions": selectedSize.dimensions,
                  "Seating Capacity": selectedSize.seating,
                  ...product.specifications,
                }).map(([key, value], i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex justify-between items-start p-4 bg-[#f5f1e8] rounded-xl"
                  >
                    <span className="font-medium text-[#3d4f47]">{key}</span>
                    <span className="text-[#5a6b64] text-right">{value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile buy bar */}
      <div
        aria-hidden={!showBuyBar}
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#e5ddd0] px-4 py-3 flex items-center gap-3 transition-transform duration-300 ${
          showBuyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="min-w-0">
          <div className="text-xs text-[#8a9b94] truncate">{product.name} · {selectedSize.label.replace(/mm/g, "").replace(" Diameter", " dia")}</div>
          <div className="text-lg font-semibold text-[#3d4f47] leading-tight">{formatPrice(selectedSize.price)}</div>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isCheckingOut}
          tabIndex={showBuyBar ? 0 : -1}
          className="ml-auto px-6 py-3 bg-[#3d4f47] text-white rounded-full font-medium disabled:opacity-60 cursor-pointer"
        >
          {isCheckingOut ? "Redirecting…" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}
