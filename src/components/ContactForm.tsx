import { motion, MotionConfig } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { trackEvent } from "../lib/analytics";
import { EMAIL_PATTERN, toFormUrlEncoded } from "../lib/forms";

type Topic = "studio" | "project" | "trade" | "other";

type FormData = {
  name: string;
  email: string;
  phone: string;
  preferredTable: string;
  orderReference: string;
  practice: string;
  deliveryPostcode: string;
  message: string;
  dimensions: string;
  projectDetails: string;
  timberPreference: string;
  budgetRange: string;
  timeline: string;
};

const topics: { value: Topic; label: string; hint: string }[] = [
  { value: "studio", label: "A Studio table, delivery or my order", hint: "Questions before or after buying, or a delivery quote" },
  { value: "project", label: "A custom or Signature project", hint: "Tell us about your space and brief" },
  { value: "trade", label: "Interior designer or architect", hint: "Working on a client's project" },
  { value: "other", label: "Something else", hint: "Anything we haven't covered" },
];

const studioTableOptions = ["Line Table", "Pill Table", "Round Table", "Curve Table", "Not sure yet"];

const projectTableOptions = [
  "Pillar Table", "Luna Table", "Yama Table", "Venn Table",
  "Cort Table", "Morgan Table", "Bruno Table", "Helm Table", "Nina Table",
  "Line Table (Studio)", "Pill Table (Studio)", "Round Table (Studio)", "Curve Table (Studio)",
  "Custom Design", "Not sure yet",
];

const inputClass =
  "w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/30 transition-colors";
const labelClass = "block text-sm font-medium text-[#3d4f47] mb-2";

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [topicMissing, setTopicMissing] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  // Fields that aren't on screen for the chosen topic are dropped, so they're neither validated nor sent.
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ shouldUnregister: true });

  // Links elsewhere on the site can open this page with a topic already chosen, e.g. /contact/?topic=studio.
  // "delivery" was its own topic once; older links and bookmarks still land on the Studio form.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("topic");
    const requested = raw === "delivery" ? "studio" : raw;
    if (topics.some((t) => t.value === requested)) setTopic(requested as Topic);
  }, []);

  useEffect(() => {
    if (isSubmitted && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      successRef.current.focus({ preventScroll: true });
    }
  }, [isSubmitted]);

  const onSubmit = async (data: FormData) => {
    if (!topic) {
      setTopicMissing(true);
      return;
    }
    setIsError(false);
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: toFormUrlEncoded({ "form-name": "contact-enquiry", topic, ...data }),
      });
      if (!response.ok) throw new Error("Failed to submit contact enquiry");
      trackEvent("generate_lead", {
        form_name: "contact_enquiry",
        lead_type: topic === "project" ? "contact" : `contact_${topic}`,
        page_path: window.location.pathname,
      });
      setIsSubmitted(true);
    } catch {
      setIsError(true);
    }
  };

  const err = (name: keyof FormData) =>
    errors[name] && (
      <p id={`contact-${name}-error`} role="alert" className="mt-1 text-sm text-red-700">{errors[name]?.message}</p>
    );
  const invalid = (name: keyof FormData) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="bg-[#f5f1e8] rounded-3xl p-8 md:p-12"
    >
      {!isSubmitted ? (
        <form name="contact-enquiry" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" name="form-name" value="contact-enquiry" />
          <div style={{ display: "none" }} aria-hidden="true"><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>

          <fieldset>
            <legend className={labelClass}>What's it about? *</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topics.map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="topic-choice"
                    value={t.value}
                    checked={topic === t.value}
                    onChange={() => {
                      setTopic(t.value);
                      setTopicMissing(false);
                    }}
                    className="peer sr-only"
                  />
                  <span className="block h-full rounded-xl border-2 border-[#e8dcc8] bg-white px-4 py-3 transition-colors hover:border-[#c8956a]/60 peer-checked:border-[#c8956a] peer-checked:bg-[#faf3ea] peer-focus-visible:ring-2 peer-focus-visible:ring-[#c8956a]/40">
                    <span className="block font-medium text-[#3d4f47]">{t.label}</span>
                    <span className="block text-sm text-[#5a6b64] mt-0.5">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {topicMissing && <p role="alert" className="mt-2 text-sm text-red-700">Please choose what your message is about.</p>}
          </fieldset>

          {topic && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass} htmlFor="contact-name">Name *</label>
                  <input
                    id="contact-name"
                    {...invalid("name")}
                    {...register("name", { required: "Name is required" })}
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    className={inputClass}
                  />
                  {err("name")}
                </div>
                <div>
                  <label className={labelClass} htmlFor="contact-email">Email *</label>
                  <input
                    id="contact-email"
                    {...invalid("email")}
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: EMAIL_PATTERN, message: "Invalid email" },
                    })}
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    className={inputClass}
                  />
                  {err("email")}
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-phone">Phone (optional)</label>
                <input id="contact-phone" {...register("phone")} type="tel" autoComplete="tel" placeholder="Your phone number" className={inputClass} />
              </div>

              {topic === "studio" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass} htmlFor="contact-preferredTable">Which table? (optional)</label>
                    <select id="contact-preferredTable" {...register("preferredTable")} className={inputClass}>
                      <option value="">Select a table...</option>
                      {studioTableOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-deliveryPostcode">Delivery postcode (optional)</label>
                    <input
                      id="contact-deliveryPostcode"
                      {...invalid("deliveryPostcode")}
                      {...register("deliveryPostcode", { pattern: { value: /^\d{4}$/, message: "Enter a 4-digit postcode" } })}
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={4}
                      placeholder="e.g. 6000"
                      className={inputClass}
                    />
                    {err("deliveryPostcode")}
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass} htmlFor="contact-orderReference">Order reference (optional)</label>
                    <input id="contact-orderReference" {...register("orderReference")} type="text" placeholder="e.g. LD-1A2B3C4D" className={inputClass} />
                  </div>
                </div>
              )}

              {topic === "trade" && (
                <div>
                  <label className={labelClass} htmlFor="contact-practice">Practice or studio (optional)</label>
                  <input id="contact-practice" {...register("practice")} type="text" autoComplete="organization" placeholder="Your practice or studio name" className={inputClass} />
                </div>
              )}

              {topic === "project" && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="contact-preferredTable">Preferred Table (optional)</label>
                    <select id="contact-preferredTable" {...register("preferredTable")} className={inputClass}>
                      <option value="">Select a table...</option>
                      {projectTableOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-dimensions">Dimensions & Space Details</label>
                    <input id="contact-dimensions" {...register("dimensions")} type="text" placeholder="e.g. 2400mm × 1000mm, seats 8" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-projectDetails">Project Details *</label>
                    <textarea
                      id="contact-projectDetails"
                      {...invalid("projectDetails")}
                      {...register("projectDetails", { required: "Please tell us about your project" })}
                      rows={6}
                      placeholder="Tell us about your space, style preferences, timber choices, and any inspiration..."
                      className={`${inputClass} resize-none`}
                    />
                    {err("projectDetails")}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-timberPreference">Timber Preference</label>
                    <input id="contact-timberPreference" {...register("timberPreference")} type="text" placeholder="e.g. American Oak, American Ash" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-budgetRange">Budget Range</label>
                    <input id="contact-budgetRange" {...register("budgetRange")} type="text" placeholder="e.g. $5000 – $10000" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="contact-timeline">Timeline</label>
                    <select id="contact-timeline" {...register("timeline")} className={inputClass}>
                      <option value="">Select timeframe</option>
                      <option value="urgent">Urgent (within 6 weeks)</option>
                      <option value="standard">Standard (2–3 months)</option>
                      <option value="flexible">Flexible (3+ months)</option>
                      <option value="planning">Just planning</option>
                    </select>
                  </div>
                </>
              )}

              {topic !== "project" && (
                <div>
                  <label className={labelClass} htmlFor="contact-message">Your message *</label>
                  <textarea
                    id="contact-message"
                    {...invalid("message")}
                    {...register("message", { required: "Please add a message" })}
                    rows={6}
                    placeholder={
                      topic === "studio"
                        ? "Ask us anything about a table, sizes, timing, delivery to your area or your order..."
                        : topic === "trade"
                          ? "Tell us about the project: the room, your client's brief and palette, timing, and anything you need from us."
                          : "How can we help?"
                    }
                    className={`${inputClass} resize-none`}
                  />
                  {err("message")}
                </div>
              )}
            </>
          )}

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting}
              className="w-full px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {topic === "project" ? "Send Enquiry" : "Send Message"}
              <ArrowRight size={20} />
            </button>
            <p className="text-sm text-[#5a6b64] text-center mt-4">We'll only use this to reply to you.</p>
            {isError && <p role="alert" className="text-sm text-red-700 text-center mt-2">Something went wrong — please try again in a moment.</p>}
          </div>
        </form>
      ) : (
        <div ref={successRef} role="status" tabIndex={-1} className="text-center py-12 outline-none">
          <div className="w-20 h-20 rounded-full bg-[#c8956a] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h3 className="text-3xl font-serif text-[#3d4f47] mb-4">Thank You!</h3>
          <p className="text-xl text-[#5a6b64] mb-8">
            We've received your {topic === "project" ? "enquiry" : "message"} and will get back to you within 2 business days.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setIsError(false);
            }}
            className="text-[#c8956a] hover:underline cursor-pointer"
          >
            Send another message
          </button>
        </div>
      )}
    </motion.div>
    </MotionConfig>
  );
}
