import { motion, MotionConfig } from "motion/react";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, Truck } from "lucide-react";
import { deliveryForPostcode, isValidPostcode } from "../data/delivery-zones";
import type { StudioProduct } from "../data/studio-products";
import { trackEvent } from "../lib/analytics";
import StudioTableOutline from "./StudioTableOutline";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        "auto-rotate"?: string;
        "interaction-prompt"?: string;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "camera-controls"?: string;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        exposure?: string;
        loading?: string;
        "touch-action"?: string;
        "environment-image"?: string;
        "camera-orbit"?: string;
        alt?: string;
      };
    }
  }
}

interface Props {
  product: StudioProduct;
  /** Every Studio table, in display order, for the switcher above the viewer. */
  tables: { id: string; name: string }[];
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(cents / 100);

const MODEL_VIEWER_SCRIPT_ID = "model-viewer-script";
// Every table settles on this view: turned about 63 degrees left of square-on, a little below the default height.
const START_ORBIT = "-63deg 71deg 90%";
// How long the opening sweep runs before the table glides back to START_ORBIT.
const SWEEP_MS = 5000;

export default function StudioProductDetailClient({ product, tables }: Props) {
  // The tables either side of this one, wrapping round, for the arrows above the viewer
  const position = tables.findIndex((table) => table.id === product.id);
  const previousTable = tables.length > 1 ? tables[(position - 1 + tables.length) % tables.length] : null;
  const nextTable = tables.length > 1 ? tables[(position + 1) % tables.length] : null;
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  // Delivery is priced from the postcode, so the buyer is asked for it before checkout. Remembered for next time.
  const [postcode, setPostcode] = useState("");
  const [postcodeHint, setPostcodeHint] = useState(false);
  const postcodeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ld-delivery-postcode");
      if (saved && isValidPostcode(saved)) setPostcode(saved);
    } catch {
      /* storage unavailable — fine, the field just starts empty */
    }
  }, []);
  const delivery = deliveryForPostcode(postcode);
  const canCheckout = !!delivery && delivery.priceCents !== null;
  const onPostcodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPostcode(digits);
    if (quoteStatus === "sent") setQuoteStatus("idle");
    if (digits.length === 4) setPostcodeHint(false);
    try {
      if (isValidPostcode(digits)) localStorage.setItem("ld-delivery-postcode", digits);
    } catch {
      /* ignore */
    }
  };
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
  // "2350mm × 1150mm" -> "2350 × 1150mm"; "1500mm Diameter" -> "1500mm dia".
  const selectedSize = product.sizes.find((s) => s.id === selectedSizeId) ?? product.sizes[0];
  // Postcodes we quote individually get a short request form here instead of Buy Now. The request is saved, and an email
  // with a link to the private quote page is sent to the order inbox.
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [quoteError, setQuoteError] = useState("");
  const [quoteForm, setQuoteForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const sendQuoteRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (quoteStatus === "sending") return;
    setQuoteStatus("sending");
    setQuoteError("");
    try {
      const response = await fetch("/.netlify/functions/request-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, sizeId: selectedSize.id, postcode, ...quoteForm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setQuoteStatus("sent");
      trackEvent("generate_lead", { lead_type: "studio_delivery_quote", table_name: product.name, page_path: window.location.pathname });
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Something went wrong.");
      setQuoteStatus("error");
    }
  };

  // On touch screens the viewer starts in scroll mode behind a "Tap to explore" cover, so dragging the
  // model doesn't scroll the page. Tapping hands every touch to the model until "Done" is pressed.
  const [isTouch, setIsTouch] = useState(false);
  const [touchUnlocked, setTouchUnlocked] = useState(false);
  const viewerBoxRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLElement>(null);
  // True once the visitor has moved the model, which is when the "Reset view" button appears.
  const [viewMoved, setViewMoved] = useState(false);

  const resetView = () => {
    const model = modelRef.current as (HTMLElement & { cameraOrbit: string; cameraTarget: string; fieldOfView: string }) | null;
    if (!model) return;
    model.removeAttribute("auto-rotate");
    model.cameraOrbit = START_ORBIT;
    model.cameraTarget = "auto auto auto";
    model.fieldOfView = "auto";
    setViewMoved(false);
  };

  // On phones, a slim buy bar stays at the bottom whenever the main Buy Now button is off-screen —
  // except at the end of the page, where the other-tables section takes over.
  const buyRef = useRef<HTMLDivElement>(null);
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

  // A short, slow opening sweep for a bit of life, then the table settles back on START_ORBIT and stays put.
  // Touching the model cancels it so it never fights the viewer, and reduced-motion users skip it entirely.
  useEffect(() => {
    const model = modelRef.current;
    if (selectedView !== "model" || !model) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    const stop = (returnToStart: boolean) => {
      clearTimeout(timer);
      model.removeAttribute("auto-rotate");
      if (returnToStart) (model as HTMLElement & { cameraOrbit: string }).cameraOrbit = START_ORBIT;
    };
    const start = () => {
      if (started) return;
      started = true;
      model.setAttribute("auto-rotate", "");
      timer = setTimeout(() => stop(true), SWEEP_MS);
    };
    const onCameraChange = (event: Event) => {
      if ((event as CustomEvent<{ source?: string }>).detail?.source === "user-interaction") {
        stop(false);
        setViewMoved(true);
      }
    };

    setViewMoved(false);
    model.addEventListener("camera-change", onCameraChange);
    if ((model as HTMLElement & { loaded?: boolean }).loaded) start();
    else model.addEventListener("load", start, { once: true });
    model.addEventListener("dblclick", resetView);
    return () => {
      model.removeEventListener("dblclick", resetView);
      model.removeEventListener("camera-change", onCameraChange);
      model.removeEventListener("load", start);
      clearTimeout(timer);
    };
  }, [selectedView]);

  useEffect(() => {
    if (document.getElementById(MODEL_VIEWER_SCRIPT_ID)) return;
    const inject = () => {
      if (document.getElementById(MODEL_VIEWER_SCRIPT_ID)) return;
      const script = document.createElement("script");
      script.id = MODEL_VIEWER_SCRIPT_ID;
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(script);
    };
    // The viewer script and the 3D model are 1–2 MB together. Wait until the page and its photos have loaded and the
    // browser is idle, so they don't compete with the content people see first (the photo below stands in meanwhile).
    const schedule = () => {
      const idle = (window as unknown as { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle.call(window, inject, { timeout: 2500 });
      else window.setTimeout(inject, 1200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => window.removeEventListener("load", schedule);
  }, []);

  // Set synchronously so a fast double-click can't start two checkouts before `disabled` has rendered.
  const checkingOut = useRef(false);

  // Coming back from Stripe with the Back button restores this page from the browser's cache with the button still
  // stuck on "Redirecting…", so reset it when the page is shown again.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkingOut.current = false;
        setIsCheckingOut(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleBuyNow = async () => {
    if (checkingOut.current) return;
    if (!canCheckout) {
      // No delivery postcode yet (or one we quote individually): take them to the field instead of starting checkout.
      setPostcodeHint(true);
      postcodeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      postcodeRef.current?.focus({ preventScroll: true });
      return;
    }
    checkingOut.current = true;
    setCheckoutError(false);
    setIsCheckingOut(true);
    // Give up after 20 seconds instead of leaving the button stuck if the function hangs.
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, sizeId: selectedSize.id, postcode }),
        signal: controller.signal,
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
      checkingOut.current = false;
      setCheckoutError(true);
      setIsCheckingOut(false);
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="bg-[#faf8f5]">
      {/* Product header */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to the collection, and the tables either side of this one: quiet text links in the header's small capitals.
              A row of its own across both columns, so the image and the title start at the same height. */}
          <div className="flex items-center justify-between gap-4 -mt-2 mb-1">
            <a
              href="/studio/"
              className="group inline-flex items-center gap-2 min-h-11 text-xs font-medium uppercase tracking-[0.12em] text-[#5a6b64] hover:text-[#3d4f47] transition-colors duration-200"
            >
              <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Studio<span className="hidden sm:inline"> Collection</span></span>
            </a>
            {previousTable && nextTable && (
              <div className="flex items-center gap-5 sm:gap-7">
                {[
                  { table: previousTable, label: "Previous table", Icon: ChevronLeft, side: "previous" },
                  { table: nextTable, label: "Next table", Icon: ChevronRight, side: "next" },
                ].map(({ table, label, Icon, side }) => (
                  <a
                    key={label}
                    href={`/studio/${table.id}/`}
                    aria-label={`${label}: ${table.name}`}
                    title={`${label}: ${table.name}`}
                    onClick={() =>
                      trackEvent("select_content", {
                        content_type: "studio_table_arrows",
                        item_id: table.id,
                        page_path: window.location.pathname,
                      })
                    }
                    className="group inline-flex items-center gap-1.5 min-h-11 text-xs font-medium uppercase tracking-[0.12em] text-[#5a6b64] hover:text-[#3d4f47] transition-colors duration-200"
                  >{/* The table's name shows from small tablets up; on phones the arrow stands alone */}
                    {side === "previous" && <Icon size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5" />}
                    <span className="hidden sm:inline">{table.name.replace(/ Table$/, "")}</span>
                    {side === "next" && <Icon size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12">

            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                <div
                  ref={viewerBoxRef}
                  style={touchUnlocked ? { touchAction: "none" } : undefined}
                  className="aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden relative bg-[#3d4f47]"
                >
                  {selectedView === "model" ? (
                    <model-viewer
                      ref={modelRef}
                      src={product.model}
                      alt={`${product.name} in 3D — drag to rotate`}
                      touch-action={touchUnlocked ? "none" : "pan-y"}
                      auto-rotate-delay="0"
                      rotation-per-second="12deg"
                      camera-controls=""
                      camera-orbit={START_ORBIT}
                      interaction-prompt="none"
                      shadow-intensity="1.2"
                      shadow-softness="0.8"
                      exposure="2.4"
                      environment-image="/environments/studio-light.jpg"
                      loading="eager"
                      style={{ width: "100%", height: "100%", background: "transparent" }}
                    >
                      <div slot="poster" style={{ position: "relative", width: "100%", height: "100%", background: "#3d4f47" }}>
                        <img
                          src={product.images.gallery[0] ?? product.images.main}
                          alt=""
                          {...{ fetchpriority: "high" }}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }}
                        />
                        <span style={{ position: "absolute", left: 0, right: 0, bottom: 16, textAlign: "center", color: "#f5f1e8", fontSize: 13, letterSpacing: "0.1em" }}>Loading 3D model…</span>
                      </div>
                    </model-viewer>
                  ) : (
                    <img
                      src={selectedView}
                      alt={product.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  )}
                  {views.length > 1 && (
                    <div role="group" aria-label="Product views" className="absolute bottom-3 left-3 z-10 flex gap-2">
                      {views.map((view) => (
                        <button
                          key={view.id}
                          type="button"
                          aria-pressed={selectedView === view.id}
                          onClick={() => setSelectedView(view.id)}
                          // Same size and shape as the "Drag to rotate" label below; the ::before stretches the tap area to a comfortable size
                          className={`relative px-3 py-[3px] rounded-full text-xs tracking-wide border transition-colors duration-200 cursor-pointer before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] ${
                            selectedView === view.id
                              ? "bg-white/20 border-white/70 text-white backdrop-blur-sm"
                              : "bg-black/50 border-white/25 text-white/70 backdrop-blur-sm hover:bg-black/65 hover:text-white"
                          }`}
                        >
                          {view.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedView === "model" && (
                    <span className="absolute top-3 left-3 bg-black/50 text-white/80 text-xs tracking-wide px-3 py-1 rounded-full pointer-events-none">
                      {isTouch ? (touchUnlocked ? "Drag to rotate · Pinch to zoom" : "Tap to explore in 3D") : "Drag to rotate · Scroll to zoom"}
                    </span>
                  )}
                  {selectedView === "model" && viewMoved && (
                    <button
                      type="button"
                      onClick={resetView}
                      aria-label="Reset view"
                      className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-[3px] rounded-full text-xs tracking-wide border border-white/25 bg-black/50 text-white/70 backdrop-blur-sm hover:bg-black/65 hover:text-white transition-colors cursor-pointer before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']"
                    >
                      <RotateCcw size={12} />
                      <span>Reset view</span>
                    </button>
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
                      className="absolute top-3 right-3 z-10 px-3 py-[3px] rounded-full text-xs tracking-wide border border-white/25 bg-black/50 text-white/70 backdrop-blur-sm hover:bg-black/65 hover:text-white transition-colors cursor-pointer before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-['']"
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
                <p className="text-xl text-[#5a6b64] mb-2">{product.tagline}</p>
                <p className="text-sm font-medium text-[#8a9b94] mb-4">{product.specifications["Timber / Finish"].replace(" / ", " · ")}</p>
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
                  <p className="text-sm text-[#3d4f47] mt-3">{selectedSize.dimensions}</p>
                  <p className="text-xs text-[#8a9b94] mt-1">Sizes in mm, drawn to scale from above. The 3D view and room photo show the largest size ({largestSize.label.replace(/mm/g, "").replace(" Diameter", " dia")}) and are renders — real timber varies in grain and colour.</p>
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

                {/* Delivery postcode: the delivery fee is set from it */}
                <div className="mb-5">
                  <label htmlFor="delivery-postcode" className="block text-xs font-semibold uppercase tracking-wide text-[#66756e] mb-2">
                    Delivery postcode
                  </label>
                  <input
                    id="delivery-postcode"
                    ref={postcodeRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    placeholder="e.g. 3000"
                    value={postcode}
                    onChange={(e) => onPostcodeChange(e.target.value)}
                    aria-describedby="delivery-postcode-note"
                    className="w-36 px-4 py-3 rounded-xl border-2 border-[#e5ddd0] bg-white text-[#3d4f47] focus:outline-none focus:border-[#c8956a] focus:ring-2 focus:ring-[#c8956a]/30"
                  />
                  <p id="delivery-postcode-note" aria-live="polite" className="text-sm mt-2 text-[#5a6b64]">
                    {!delivery && (postcodeHint ? <span className="text-red-700">Enter your delivery postcode to see the delivery fee.</span> : "Enter your postcode to see the delivery fee.")}
                    {delivery && delivery.priceCents !== null && (
                      <>
                        Delivery to {postcode}: <strong className="text-[#3d4f47]">{formatPrice(delivery.priceCents)}</strong> · Total <strong className="text-[#3d4f47]">{formatPrice(selectedSize.price + delivery.priceCents)}</strong>
                      </>
                    )}
                    {delivery && delivery.priceCents === null && (
                      <>
                        We quote delivery to {postcode} individually, usually within one business day. Send us your details and we'll confirm the price before you pay.
                      </>
                    )}
                  </p>
                </div>

                <div ref={buyRef}>
                  {delivery && delivery.priceCents === null ? (
                    quoteStatus === "sent" ? (
                      <div id="delivery-quote-form" role="status" className="rounded-xl border-2 border-[#e5ddd0] bg-white p-5 text-[#3d4f47]">
                        <div className="flex items-center gap-2 font-semibold mb-1"><CheckCircle size={18} className="text-[#c8956a]" /> Thanks, {quoteForm.name.split(" ")[0]}.</div>
                        <p className="text-sm text-[#5a6b64]">
                          We've received your request for the {product.name} ({selectedSize.label}) delivered to {postcode}. We'll reply to {quoteForm.email} within one business day with the delivery price and a secure link to order.
                        </p>
                      </div>
                    ) : (
                      <form id="delivery-quote-form" onSubmit={sendQuoteRequest} className="space-y-3 scroll-mt-28">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input aria-label="Your name" required maxLength={80} autoComplete="name" placeholder="Your name" value={quoteForm.name} onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })} className="w-full px-4 py-3 border-2 border-[#e5ddd0] rounded-xl bg-white text-[#3d4f47] focus:outline-none focus:border-[#c8956a] focus:ring-2 focus:ring-[#c8956a]/30" />
                          <input aria-label="Email address" type="email" required maxLength={200} autoComplete="email" placeholder="Email address" value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })} className="w-full px-4 py-3 border-2 border-[#e5ddd0] rounded-xl bg-white text-[#3d4f47] focus:outline-none focus:border-[#c8956a] focus:ring-2 focus:ring-[#c8956a]/30" />
                        </div>
                        <input aria-label="Phone (optional)" type="tel" maxLength={25} autoComplete="tel" placeholder="Phone (optional)" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-[#e5ddd0] rounded-xl bg-white text-[#3d4f47] focus:outline-none focus:border-[#c8956a] focus:ring-2 focus:ring-[#c8956a]/30" />
                        <textarea aria-label="Message (optional)" rows={3} maxLength={600} placeholder="Anything we should know? Access, stairs, timing (optional)" value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} className="w-full px-4 py-3 border-2 border-[#e5ddd0] rounded-xl bg-white text-[#3d4f47] focus:outline-none focus:border-[#c8956a] focus:ring-2 focus:ring-[#c8956a]/30 resize-none" />
                        {/* A trap for bots: real visitors never see or fill this in. */}
                        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={quoteForm.website} onChange={(e) => setQuoteForm({ ...quoteForm, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                        {quoteStatus === "error" && (
                          <p role="alert" className="text-sm text-red-700">
                            {quoteError} You can also <a href="/contact/?topic=studio" className="underline underline-offset-2">contact us directly</a>.
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={quoteStatus === "sending"}
                          className="w-full px-6 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {quoteStatus === "sending" ? "Sending…" : "Request a delivery quote"}
                        </button>
                      </form>
                    )
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      disabled={isCheckingOut}
                      className="w-full px-6 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCheckingOut ? "Redirecting to checkout…" : `Buy Now — ${formatPrice(selectedSize.price)}`}
                    </button>
                  )}
                </div>
                {checkoutError && (
                  <p role="alert" className="text-sm text-red-700 text-center mt-4">
                    Something went wrong starting checkout — please try again, or{" "}
                    <a href="/contact/?topic=studio" className="underline underline-offset-2">get in touch</a> and we'll help.
                  </p>
                )}

                <div className="flex items-start gap-3 mt-5 text-sm text-[#5a6b64]">
                  <Truck className="text-[#c8956a] flex-shrink-0 mt-0.5" size={18} />
                  <span>
                    Made to order in Melbourne · 6–8 week lead time · Delivered and assembled in your room · Secure checkout ·{" "}
                    <a href="/terms/" className="underline underline-offset-2 hover:text-[#c8956a]">Delivery, returns &amp; care</a>
                  </span>
                </div>
                <a
                  href="/contact/?topic=studio"
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
              <dl className="bg-[#f5f1e8] rounded-2xl divide-y divide-[#e5ddd0] overflow-hidden">
                {product.sizes.map((size) => (
                  <div
                    key={size.id}
                    className={`flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-4 px-5 py-4 ${size.id === selectedSizeId ? "bg-[#ebe3d3]" : ""}`}
                  >
                    <dt className="font-medium text-[#3d4f47]">{size.label}</dt>
                    <dd className="sm:text-right text-[#5a6b64]">
                      <div>{size.dimensions}</div>
                      <div className="text-sm text-[#8a9b94]">Seats {size.seating.replace(" people", "")}</div>
                    </dd>
                  </div>
                ))}
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-4 px-5 py-4">
                    <dt className="font-medium text-[#3d4f47]">{key}</dt>
                    <dd className="sm:text-right text-[#5a6b64]">{value}</dd>
                  </div>
                ))}
              </dl>
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
        {delivery && delivery.priceCents === null ? (
          <a
            href="#delivery-quote-form"
            tabIndex={showBuyBar ? 0 : -1}
            className="ml-auto px-6 py-3 bg-[#3d4f47] text-white rounded-full font-medium cursor-pointer"
          >
            Request a quote
          </a>
        ) : (
          <button
            onClick={handleBuyNow}
            disabled={isCheckingOut}
            tabIndex={showBuyBar ? 0 : -1}
            className="ml-auto px-6 py-3 bg-[#3d4f47] text-white rounded-full font-medium disabled:opacity-60 cursor-pointer"
          >
            {isCheckingOut ? "Redirecting…" : "Buy Now"}
          </button>
        )}
      </div>
    </div>
    </MotionConfig>
  );
}
