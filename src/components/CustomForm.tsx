import { motion, MotionConfig } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { trackEvent } from "../lib/analytics";
import { EMAIL_PATTERN, toFormUrlEncoded } from "../lib/forms";

type FormData = {
  name: string;
  email: string;
  phone: string;
  suburb: string;
  seatsDaily: string;
  seatsMax: string;
  /** Ticked boxes: an array of the chosen uses. */
  useCases: string[] | string | false;
  projectDetails: string;
  dimensions: string;
  timeline: string;
  budgetRange: string;
  timberPreference: string;
  designerInvolved: string;
  heardAbout: string;
};

const fieldClass =
  "w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors";
const labelClass = "block text-sm font-medium text-[#3d4f47] mb-2";

const seatOptions = ["2–4", "5–6", "7–8", "9–10", "11 or more"];
const useOptions = [
  "Everyday family dining",
  "Entertaining and dinner parties",
  "Working or homework",
  "Kids and pets",
  "A showpiece in the room",
];
const budgetOptions = ["Under $5,000", "$5,000–$7,500", "$7,500–$10,000", "$10,000–$15,000", "$15,000 or more", "Not sure yet"];
const designerOptions = ["No, it's for my own home", "Yes, an interior designer", "Yes, an architect", "Someone else (builder, stylist…)"];
const heardOptions = ["Instagram", "Google search", "A designer or architect recommended us", "Friend or family", "A magazine (Belle, Houzz…)", "Somewhere else"];

export default function CustomForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    if (isSubmitted && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      successRef.current.focus({ preventScroll: true });
    }
  }, [isSubmitted]);

  const onSubmit = async (data: FormData) => {
    setIsError(false);
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // The ticked uses arrive as a list; the form posts one text value for them.
        body: toFormUrlEncoded({
          "form-name": "custom-brief",
          ...data,
          useCases: Array.isArray(data.useCases) ? data.useCases.join(", ") : typeof data.useCases === "string" ? data.useCases : "",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit custom brief");
      trackEvent("generate_lead", {
        form_name: "custom_brief",
        lead_type: "custom_table",
        page_path: window.location.pathname,
      });
      setIsSubmitted(true);
    } catch {
      setIsError(true);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <>
      {/* Enquiry Form */}
      <section id="brief" className="scroll-mt-24 py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[#c8956a] font-medium mb-4 tracking-wider uppercase text-sm">Get Started</p>
            <h2 className="text-4xl md:text-5xl font-serif text-[#3d4f47] mb-6">Start Your Custom Brief</h2>
            <p className="text-xl text-[#5a6b64]">
              Tell us about your space and vision. We'll respond within 2 business days with initial thoughts and next steps.
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
              <form name="custom-brief" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <input type="hidden" name="form-name" value="custom-brief" />
                <div style={{ display: "none" }} aria-hidden="true"><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="custom-name">Name *</label>
                    <input id="custom-name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "custom-name-error" : undefined}
                      {...register("name", { required: "Name is required" })}
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors"
                    />
                    {errors.name && <p id="custom-name-error" role="alert" className="mt-1 text-sm text-red-700">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3d4f47] mb-2" htmlFor="custom-email">Email *</label>
                    <input id="custom-email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "custom-email-error" : undefined}
                      {...register("email", {
                        required: "Email is required",
                        pattern: { value: EMAIL_PATTERN, message: "Invalid email" },
                      })}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors"
                    />
                    {errors.email && <p id="custom-email-error" role="alert" className="mt-1 text-sm text-red-700">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass} htmlFor="custom-phone">Phone (optional)</label>
                    <input id="custom-phone" {...register("phone")} type="tel" autoComplete="tel" placeholder="Your phone number" className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="custom-suburb">Suburb or postcode (optional)</label>
                    <input id="custom-suburb" {...register("suburb")} type="text" autoComplete="address-level2" placeholder="e.g. Toorak or 3142" className={fieldClass} />
                  </div>
                </div>

                <fieldset>
                  <legend className={labelClass}>How many do you want to seat?</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-[#5a6b64] mb-1" htmlFor="custom-seatsDaily">Day to day</label>
                      <select id="custom-seatsDaily" {...register("seatsDaily")} className={fieldClass}>
                        <option value="">Select</option>
                        {seatOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#5a6b64] mb-1" htmlFor="custom-seatsMax">When entertaining</label>
                      <select id="custom-seatsMax" {...register("seatsMax")} className={fieldClass}>
                        <option value="">Select</option>
                        <option value="Same as day to day">Same as day to day</option>
                        {seatOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className={labelClass}>How will you use the table? (tick any)</legend>
                  <div className="flex flex-wrap gap-2">
                    {useOptions.map((o) => (
                      <label key={o} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e8dcc8] bg-white text-sm text-[#3d4f47] cursor-pointer transition-colors has-[:checked]:bg-[#3d4f47] has-[:checked]:text-white has-[:checked]:border-[#3d4f47] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#c8956a]/50">
                        <input type="checkbox" value={o} {...register("useCases")} className="sr-only" />
                        {o}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className={labelClass} htmlFor="custom-projectDetails">Project Details *</label>
                  <textarea id="custom-projectDetails" aria-invalid={!!errors.projectDetails} aria-describedby={errors.projectDetails ? "custom-projectDetails-error" : undefined}
                    {...register("projectDetails", { required: "Please tell us about your project" })}
                    rows={5}
                    placeholder="Tell us about your space and the way you live in it, your style, and any inspiration..."
                    className={`${fieldClass} resize-none`}
                  />
                  {errors.projectDetails && <p id="custom-projectDetails-error" role="alert" className="mt-1 text-sm text-red-700">{errors.projectDetails.message}</p>}
                </div>

                <details className="group rounded-lg border border-[#e8dcc8] bg-white/60 px-5 py-4">
                  <summary className="cursor-pointer select-none text-sm font-medium text-[#3d4f47] marker:text-[#c8956a]">
                    Add more detail (optional): size, timing, budget and timber
                  </summary>
                  <div className="space-y-6 pt-5">
                    <div>
                      <label className={labelClass} htmlFor="custom-dimensions">Dimensions & space details</label>
                      <input id="custom-dimensions" {...register("dimensions")} type="text" placeholder="e.g. room 4m × 5m, or a table around 2400mm × 1000mm" className={fieldClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass} htmlFor="custom-timeline">Timeline</label>
                        <select id="custom-timeline" {...register("timeline")} className={fieldClass}>
                          <option value="">Select timeframe</option>
                          <option value="Urgent (within 6 weeks)">Urgent (within 6 weeks)</option>
                          <option value="Standard (2–3 months)">Standard (2–3 months)</option>
                          <option value="Flexible (3+ months)">Flexible (3+ months)</option>
                          <option value="Just planning">Just planning</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="custom-budgetRange">Budget</label>
                        <select id="custom-budgetRange" {...register("budgetRange")} className={fieldClass}>
                          <option value="">Select a range</option>
                          {budgetOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    {watch("budgetRange") === "Under $5,000" && (
                      <p className="text-sm text-[#5a6b64] -mt-2">
                        Custom tables typically start from $5,000. If that's more than you planned, our <a href="/studio/" className="text-[#c8956a] font-medium underline underline-offset-2">Studio Collection</a> is ready to order and starts lower. You're welcome to send your enquiry either way.
                      </p>
                    )}
                    <div>
                      <label className={labelClass} htmlFor="custom-timberPreference">Timber preference</label>
                      <input id="custom-timberPreference" {...register("timberPreference")} type="text" placeholder="e.g. American Oak, American Ash" className={fieldClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass} htmlFor="custom-designerInvolved">Are you working with a designer or architect?</label>
                        <select id="custom-designerInvolved" {...register("designerInvolved")} className={fieldClass}>
                          <option value="">Select</option>
                          {designerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="custom-heardAbout">How did you hear about us?</label>
                        <select id="custom-heardAbout" {...register("heardAbout")} className={fieldClass}>
                          <option value="">Select</option>
                          {heardOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
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
    </>
    </MotionConfig>
  );
}
