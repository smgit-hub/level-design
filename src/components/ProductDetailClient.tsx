import { motion, MotionConfig } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Ruler, Truck, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Product } from "../data/signature-products";
import { trackEvent } from "../lib/analytics";
import { EMAIL_PATTERN, toFormUrlEncoded } from "../lib/forms";

interface Props {
  product: Product;
  prev: { id: string; name: string };
  next: { id: string; name: string };
}

type FormData = {
  name: string;
  email: string;
  phone: string;
  dimensions: string;
  projectDetails: string;
  timberPreference: string;
  budgetRange: string;
  timeline: string;
};

export default function ProductDetailClient({ product, prev, next }: Props) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const productImages = [product.images.main, ...product.images.gallery];

  useEffect(() => {
    if (isSubmitted && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      successRef.current.focus({ preventScroll: true });
    }
  }, [isSubmitted]);
  const [selectedImage, setSelectedImage] = useState<string>(product.images.main);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsError(false);
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: toFormUrlEncoded({ "form-name": "table-enquiry", table: product.name, ...data }),
      });
      if (!response.ok) throw new Error("Failed to submit table enquiry");
      trackEvent("generate_lead", {
        form_name: "table_enquiry",
        lead_type: "product_table",
        table_name: product.name,
        page_path: window.location.pathname,
      });
      setIsSubmitted(true);
    } catch {
      setIsError(true);
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
              href="/signature/"
              className="group inline-flex items-center gap-2 min-h-11 text-xs font-medium uppercase tracking-[0.12em] text-[#5a6b64] hover:text-[#3d4f47] transition-colors duration-200"
            >
              <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Signature<span className="hidden sm:inline"> Collection</span></span>
            </a>
            {prev && next && (
              <div className="flex items-center gap-5 sm:gap-7">
                {[
                  { table: prev, label: "Previous table", Icon: ChevronLeft, side: "previous" },
                  { table: next, label: "Next table", Icon: ChevronRight, side: "next" },
                ].map(({ table, label, Icon, side }) => (
                  <a
                    key={label}
                    href={`/signature/${table.id}/`}
                    aria-label={`${label}: ${table.name}`}
                    title={`${label}: ${table.name}`}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                {/* Main image */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                </div>
                {/* Thumbnails — always 3, showing the non-selected images */}
                <div className="grid grid-cols-3 gap-3">
                  {productImages
                    .filter((img) => img !== selectedImage)
                    .slice(0, 3)
                    .map((img, i) => (
                      <button
                        key={img}
                        onClick={() => setSelectedImage(img)}
                        className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-[#c8956a] transition-all duration-200"
                      >
                        <img src={img} alt={`${product.name} view ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </button>
                    ))}
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
                <p className="text-xl text-[#5a6b64] mb-6">{product.tagline}</p>


                <p className="text-[#3d4f47] leading-relaxed mb-8">{product.description}</p>

                {/* Features */}
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
                  <h2 className="font-semibold text-[#3d4f47] mb-4">Key Features</h2>
                  <ul className="space-y-3">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="text-[#c8956a] mt-0.5 flex-shrink-0" size={18} />
                        <span className="text-[#5a6b64]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Ruler, label: "Custom Sizing" },
                    { icon: Truck, label: "Made to Order" },
                    { icon: Shield, label: "Designed in Melbourne" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="text-center p-4 bg-white rounded-xl">
                      <Icon className="text-[#c8956a] mx-auto mb-2" size={24} />
                      <div className="text-xs text-[#5a6b64]">{label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      trackEvent("select_content", {
                        content_type: "cta",
                        item_id: "enquire_about_this_table",
                        table_name: product.name,
                        page_path: window.location.pathname,
                      });
                      document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    Enquire About This Table
                  </button>
                  <a
                    href="/custom/"
                    onClick={() =>
                      trackEvent("select_content", {
                        content_type: "cta",
                        item_id: "customise_design",
                        table_name: product.name,
                        page_path: window.location.pathname,
                      })
                    }
                    className="flex-1 px-8 py-4 bg-transparent border-2 border-[#3d4f47] text-[#3d4f47] rounded-full hover:bg-[#3d4f47] hover:text-white transition-all duration-300 font-medium text-center"
                  >
                    Customise Design
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {/* White, like the enquiry section below it, so only a little bottom padding here: the two used to stack into a 170px gap */}
      <section className="pt-[var(--section-y-sm)] pb-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-serif text-[#3d4f47] mb-8">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specifications).map(([key, value], i) => (
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#3d4f47] rounded-2xl">
                <svg className="w-5 h-5 text-[#c8956a] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <p className="text-[#e8dcc8] text-sm font-medium">
                  Every specification above can be customised — dimensions, timber, and finish are all tailored to your space.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Enquiry form */}
      <section id="enquiry-form" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-[#3d4f47] mb-4">
              Enquire About {product.name}
            </h2>
            <p className="text-[#5a6b64]">
              Tell us your preferred size, finish, and timeframe. We'll confirm and send a tailored quote.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-[#f5f1e8] rounded-3xl p-8 md:p-12"
          >
            {!isSubmitted ? (
              <form name="table-enquiry" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <input type="hidden" name="form-name" value="table-enquiry" />
                <input type="hidden" name="table" value={product.name} />
                <div style={{ display: "none" }} aria-hidden="true"><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-name">Name *</label>
                    <input id="enquiry-name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "enquiry-name-error" : undefined}
                      {...register("name", { required: "Name is required" })}
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors"
                    />
                    {errors.name && <p id="enquiry-name-error" role="alert" className="mt-1 text-sm text-red-700">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-email">Email *</label>
                    <input id="enquiry-email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "enquiry-email-error" : undefined}
                      {...register("email", {
                        required: "Email is required",
                        pattern: { value: EMAIL_PATTERN, message: "Invalid email" },
                      })}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors"
                    />
                    {errors.email && <p id="enquiry-email-error" role="alert" className="mt-1 text-sm text-red-700">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-projectDetails">Your message *</label>
                  <textarea id="enquiry-projectDetails" aria-invalid={!!errors.projectDetails} aria-describedby={errors.projectDetails ? "enquiry-projectDetails-error" : undefined}
                    {...register("projectDetails", { required: "Please tell us about your project" })}
                    rows={4}
                    placeholder="Tell us about your space and what you have in mind..."
                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors resize-none"
                  />
                  {errors.projectDetails && <p id="enquiry-projectDetails-error" role="alert" className="mt-1 text-sm text-red-700">{errors.projectDetails.message}</p>}
                </div>
                {/* The extra detail is optional, so it is tucked away: most people only need to leave their name, email and a message */}
                <details className="group rounded-lg border border-[#e8dcc8] bg-white">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-4 py-3 text-sm font-medium text-[#3d4f47] [&::-webkit-details-marker]:hidden">
                    <span>Add more detail <span className="font-normal text-[#5a6b64]">(optional: phone, size, timber, budget, timing)</span></span>
                    <svg className="w-4 h-4 flex-shrink-0 text-[#c8956a] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
                  </summary>
                  <div className="space-y-6 px-4 pb-5 pt-2">
                          <div>
                            <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-phone">Phone (optional)</label>
                            <input id="enquiry-phone" {...register("phone")} type="tel" placeholder="Your phone number"
                              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-dimensions">Dimensions & Space Details</label>
                            <input id="enquiry-dimensions" {...register("dimensions")} type="text" placeholder="e.g. 2400mm × 1000mm, seats 8"
                              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-timberPreference">Timber Preference</label>
                            <input id="enquiry-timberPreference" {...register("timberPreference")} type="text" placeholder="e.g. American Oak, American Ash"
                              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-budgetRange">Budget Range</label>
                            <input id="enquiry-budgetRange" {...register("budgetRange")} type="text" placeholder="e.g. $5000 – $10000"
                              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="enquiry-timeline">Timeline</label>
                            <select id="enquiry-timeline" {...register("timeline")}
                              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors">
                              <option value="">Select timeframe</option>
                              <option value="urgent">Urgent (within 6 weeks)</option>
                              <option value="standard">Standard (2–3 months)</option>
                              <option value="flexible">Flexible (3+ months)</option>
                              <option value="planning">Just planning</option>
                            </select>
                          </div>
                  </div>
                </details>
                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                    Send Enquiry
                    <ArrowRight size={20} />
                  </button>
                  <p className="text-sm text-[#5a6b64] text-center mt-4">We'll only use this to contact you about your table.</p>
                  {isError && <p className="text-sm text-red-600 text-center mt-2">Something went wrong — please try again in a moment.</p>}
                </div>
              </form>
            ) : (
              <div ref={successRef} role="status" tabIndex={-1} className="text-center py-12 outline-none">
                <div className="w-20 h-20 rounded-full bg-[#c8956a] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-white" size={40} />
                </div>
                <h3 className="text-3xl font-serif text-[#3d4f47] mb-4">Thank You!</h3>
                <p className="text-xl text-[#5a6b64] mb-8">We've received your enquiry and will get back to you within 2 business days.</p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setIsError(false);
                  }}
                  className="text-[#c8956a] hover:underline cursor-pointer"
                >
                  Submit another enquiry
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
    </MotionConfig>
  );
}
