import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";

type FormData = {
  name: string;
  email: string;
  phone: string;
  preferredTable: string;
  projectDetails: string;
};

const tableOptions = [
  "Pillar Table", "Luna Table", "Cort Table", "Bruno Table",
  "Yama Table", "Custom Design", "Not sure yet",
];

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    const subject = encodeURIComponent("Table Project Enquiry");
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || "Not provided"}\nPreferred Table: ${data.preferredTable || "Not specified"}\n\nProject Details:\n${data.projectDetails}`
    );
    window.location.href = `mailto:hello@leveldesign.com.au?subject=${subject}&body=${body}`;
    setIsSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl p-8 md:p-12 shadow-xl"
    >
      {!isSubmitted ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Preferred table (optional)</label>
            <select {...register("preferredTable")}
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors">
              <option value="">Select a table...</option>
              {tableOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d4f47] mb-2">Project Details *</label>
            <p className="text-sm text-[#7d8f87] mb-2">Tell us about your space, style preferences, size, finish, seating count, delivery suburb…</p>
            <textarea
              {...register("projectDetails", { required: "Please tell us about your project" })}
              rows={6}
              placeholder="Share your vision, space details, and any inspiration you have..."
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors resize-none"
            />
            {errors.projectDetails && <p className="mt-1 text-sm text-red-600">{errors.projectDetails.message}</p>}
          </div>

          <div className="pt-4">
            <button type="submit"
              className="w-full px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2">
              Send Enquiry
              <ArrowRight size={20} />
            </button>
            <p className="text-sm text-[#7d8f87] text-center mt-4">We'll only use this to contact you about your table.</p>
          </div>
        </form>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#c8956a] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h3 className="text-3xl font-serif text-[#3d4f47] mb-4">Thank You!</h3>
          <p className="text-xl text-[#7d8f87] mb-8">We've received your enquiry and will get back to you within 2 business days.</p>
          <button onClick={() => setIsSubmitted(false)} className="text-[#c8956a] hover:underline">
            Submit another enquiry
          </button>
        </div>
      )}
    </motion.div>
  );
}
