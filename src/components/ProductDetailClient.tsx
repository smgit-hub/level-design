import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, CheckCircle, Ruler, Truck, Shield, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Product } from "../data/products";

interface Props {
  product: Product;
}

type FormData = {
  name: string;
  email: string;
  phone: string;
  projectDetails: string;
};

const reviews = [
  {
    name: "Sarah Mitchell",
    rating: 5,
    date: "2 months ago",
    content: "The craftsmanship is incredible and it's become the heart of our home.",
  },
  {
    name: "David Chen",
    rating: 5,
    date: "3 months ago",
    content: "Beautiful piece of furniture. The team was amazing to work with and the delivery was seamless.",
  },
  {
    name: "Emma Thompson",
    rating: 5,
    date: "5 months ago",
    content: "Worth every penny. This table will be in our family for generations.",
  },
];

export default function ProductDetailClient({ product }: Props) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    const subject = encodeURIComponent(`Enquiry: ${product.name}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\nMessage:\n${data.projectDetails}\n\n---\nProduct: ${product.name}`
    );
    window.location.href = `mailto:hello@leveldesign.com.au?subject=${subject}&body=${body}`;
    setIsSubmitted(true);
  };

  return (
    <div className="bg-[#faf8f5]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e8dcc8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <a href="/tables" className="inline-flex items-center gap-2 text-[#7d8f87] hover:text-[#3d4f47] transition-colors">
            <ArrowLeft size={20} />
            Back to Collection
          </a>
        </div>
      </div>

      {/* Product header */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Visual placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#3d4f47] to-[#2d3f37] flex items-center justify-center shadow-lg">
                  <span className="text-white/30 font-serif text-4xl text-center px-8">{product.name}</span>
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
                <p className="text-[#c8956a] font-medium mb-2 tracking-wider uppercase text-sm">
                  {product.category} Collection
                </p>
                <h1 className="text-4xl md:text-5xl font-serif text-[#3d4f47] mb-4">{product.name}</h1>
                <p className="text-xl text-[#7d8f87] mb-6">{product.tagline}</p>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-[#c8956a] text-[#c8956a]" />
                    ))}
                  </div>
                  <span className="text-sm text-[#7d8f87]">(12 reviews)</span>
                </div>

                <p className="text-[#3d4f47] leading-relaxed mb-8">{product.description}</p>

                {/* Features */}
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
                  <h3 className="font-semibold text-[#3d4f47] mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="text-[#c8956a] mt-0.5 flex-shrink-0" size={18} />
                        <span className="text-[#7d8f87]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Ruler, label: "Custom Sizing" },
                    { icon: Truck, label: "Free Delivery" },
                    { icon: Shield, label: "Quality Guaranteed" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="text-center p-4 bg-white rounded-xl">
                      <Icon className="text-[#c8956a] mx-auto mb-2" size={24} />
                      <div className="text-xs text-[#7d8f87]">{label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex-1 px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    Enquire About This Table
                  </button>
                  <a
                    href="/custom"
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
      <section className="py-16 bg-white">
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
                  <span className="text-[#7d8f87] text-right">{value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-[#f5f1e8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-serif text-[#3d4f47] mb-8">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} size={16} className="fill-[#c8956a] text-[#c8956a]" />
                    ))}
                  </div>
                  <p className="text-[#3d4f47] mb-4 italic">"{review.content}"</p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#3d4f47]">{review.name}</span>
                    <span className="text-xs text-[#7d8f87]">{review.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
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
            <p className="text-[#7d8f87]">
              Tell us your preferred size, finish, and timeframe. We'll confirm availability and send a tailored quote.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-[#f5f1e8] rounded-3xl p-8"
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
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="Your phone number"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d4f47] mb-2">Project Details *</label>
                  <textarea
                    {...register("projectDetails", { required: "Please provide details" })}
                    rows={5}
                    placeholder="Size, finish, seating count, delivery suburb..."
                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#e8dcc8] text-[#3d4f47] focus:border-[#c8956a] focus:outline-none transition-colors resize-none"
                  />
                  {errors.projectDetails && <p className="mt-1 text-sm text-red-600">{errors.projectDetails.message}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  Send Enquiry
                </button>
                <p className="text-sm text-[#7d8f87] text-center">We'll only use this to contact you about your table.</p>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#c8956a] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-serif text-[#3d4f47] mb-3">Thank You!</h3>
                <p className="text-[#7d8f87] mb-6">We've received your enquiry and will be in touch within 48 hours.</p>
                <a href="/tables" className="text-[#c8956a] hover:underline">Continue browsing</a>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
