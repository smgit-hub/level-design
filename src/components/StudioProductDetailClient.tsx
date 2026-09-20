import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Ruler, Truck, ShieldCheck } from "lucide-react";
import type { StudioProduct } from "../data/studio-products";
import { trackEvent } from "../lib/analytics";

interface Props {
  product: StudioProduct;
  prev: { id: string; name: string };
  next: { id: string; name: string };
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(cents / 100);

export default function StudioProductDetailClient({ product, prev, next }: Props) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const productImages = [product.images.main, ...product.images.gallery];
  const [selectedImage, setSelectedImage] = useState<string>(product.images.main);

  const handleBuyNow = async () => {
    setCheckoutError(false);
    setIsCheckingOut(true);
    try {
      const response = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) throw new Error("Checkout session creation failed");
      const { url } = await response.json();
      if (!url) throw new Error("No checkout URL returned");
      trackEvent("begin_checkout", {
        currency: "AUD",
        value: product.price / 100,
        item_id: product.id,
        item_name: product.name,
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
          {/* Table nav */}
          <div className="flex items-center justify-between text-xs text-[#8a9b94] mb-8 mt-2">
            <a href={`/studio/${prev.id}/`} className="inline-flex items-center gap-1.5 hover:text-[#3d4f47] transition-colors">
              <ArrowLeft size={12} />
              {prev.name}
            </a>
            <a href={`/studio/${next.id}/`} className="inline-flex items-center gap-1.5 hover:text-[#3d4f47] transition-colors">
              {next.name}
              <ArrowRight size={12} />
            </a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="sticky top-24">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 relative">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <span className="absolute bottom-3 left-3 bg-black/50 text-white/80 text-xs tracking-wide px-3 py-1 rounded-full">
                    3D render — handcrafted to match
                  </span>
                </div>
                {/* Thumbnails — always shows the non-selected images */}
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                <p className="text-xl text-[#5a6b64] mb-4">{product.tagline}</p>
                <div className="flex items-center gap-3 mb-6">
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xl text-[#8a9b94] line-through">{formatPrice(product.compareAtPrice)}</span>
                  )}
                  <p className="text-3xl font-semibold text-[#3d4f47]">{formatPrice(product.price)}</p>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-white bg-[#c8956a] px-2 py-1 rounded-full">Sale</span>
                  )}
                </div>

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
                    { icon: Ruler, label: "Fixed Dimensions" },
                    { icon: Truck, label: "Shorter Lead Time" },
                    { icon: ShieldCheck, label: "Secure Checkout" },
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
                    onClick={handleBuyNow}
                    disabled={isCheckingOut}
                    className="flex-1 px-8 py-4 bg-[#3d4f47] text-white rounded-full hover:bg-[#2d3f37] transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCheckingOut ? "Redirecting to checkout…" : `Buy Now — ${formatPrice(product.price)}`}
                  </button>
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
                    className="flex-1 px-8 py-4 bg-transparent border-2 border-[#3d4f47] text-[#3d4f47] rounded-full hover:bg-[#3d4f47] hover:text-white transition-all duration-300 font-medium text-center"
                  >
                    Questions Before Buying?
                  </a>
                </div>
                {checkoutError && (
                  <p className="text-sm text-red-600 text-center mt-4">
                    Something went wrong starting checkout — please try again or email us directly at hello@leveldesign.com.au
                  </p>
                )}
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
                  <span className="text-[#5a6b64] text-right">{value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
