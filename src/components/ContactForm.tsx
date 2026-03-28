import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";

type FormData = {
  name: string;
  email: string;
  phone: string;
  preferredTable: string;
  dimensions: string;
  projectDetails: string;
  timberPreference: string;
  budgetRange: string;
  timeline: string;
};

const tableOptions = [
  "Pillar Table", "Luna Table", "Yama Table", "Venn Table",
  "Cort Table", "Morgan Table", "Bruno Table", "Helm Table", "Nina Table",
  "Custom Design", "Not sure yet",
];

const encode = (data: Record<string, string>) =>
  Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key] || ""))
    .join("&");

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (isSubmitted && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isSubmitted]);

  const onSubmit = async (data: FormData) => {
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "contact-enquiry", ...data }),
      });
      setIsSubmitted(true);
    } catch {
      setIsError(true);
    }
  };

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#3d4f47] mb-2">Name *</label>
              <input
                {...register("name", { required: "Name is required" })}
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3d4f47] mb-2">Email *</label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" },
                })}
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Phone (optional)</label>
            <input {...register("phone")} type="tel" placeholder="Your phone number"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Preferred Table (optional)</label>
            <select {...register("preferredTable")}
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors">
              <option value="">Select a table...</option>
              {tableOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Dimensions & Space Details</label>
            <input {...register("dimensions")} type="text" placeholder="e.g. 2400mm × 1000mm, seats 8"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Project Details *</label>
            <textarea
              {...register("projectDetails", { required: "Please tell us about your project" })}
              rows={6}
              placeholder="Tell us about your space, style preferences, timber choices, and any inspiration..."
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors resize-none"
            />
            {errors.projectDetails && <p className="mt-1 text-sm text-red-600">{errors.projectDetails.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Timber Preference</label>
            <input {...register("timberPreference")} type="text" placeholder="e.g. American Oak, American Ash"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Budget Range</label>
            <input {...register("budgetRange")} type="text" placeholder="e.g. $5000 – $10000"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Timeline</label>
            <select {...register("timeline")}
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors">
              <option value="">Select timeframe</option>
              <option value="urgent">Urgent (within 6 weeks)</option>
              <option value="standard">Standard (2–3 months)</option>
              <option value="flexible">Flexible (3+ months)</option>
              <option value="planning">Just planning</option>
            </select>
          </div>

          <div className="pt-4">
            <button type="submit"
              className="w-full px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2">
              Send Enquiry
              <ArrowRight size={20} />
            </button>
            <p className="text-sm text-[#5a6b64] text-center mt-4">We'll only use this to contact you about your table.</p>
          {isError && <p className="text-sm text-red-600 text-center mt-2">Something went wrong — please try again or email us directly at hello@leveldesign.com.au</p>}
          </div>
        </form>
      ) : (
        <div ref={successRef} className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#c8956a] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h3 className="text-3xl font-serif text-[#3d4f47] mb-4">Thank You!</h3>
          <p className="text-xl text-[#5a6b64] mb-8">We've received your enquiry and will get back to you within 2 business days.</p>
          <button onClick={() => setIsSubmitted(false)} className="text-[#c8956a] hover:underline">
            Submit another enquiry
          </button>
        </div>
      )}
    </motion.div>
  );
}
