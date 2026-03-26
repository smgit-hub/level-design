import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Filter } from "lucide-react";
import type { Product } from "../data/products";

interface Props {
  products: Product[];
}

const categories = ["All", "Signature", "Contemporary", "Modern"];
const sizes = ["All Sizes", "Small", "Medium", "Large"];

export default function TablesFilter({ products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All Sizes");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSize = selectedSize === "All Sizes" || p.size === selectedSize;
    return matchCat && matchSize;
  });

  return (
    <>
      {/* Filter bar */}
      <section className="bg-[#f5f1e8] border-b border-[#e8dcc8] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
              >
                <Filter size={18} />
                Filters
              </button>

              <div className={`${showFilters ? "flex" : "hidden"} lg:flex flex-col lg:flex-row gap-4 w-full lg:w-auto`}>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full transition-all duration-300 ${
                        selectedCategory === cat
                          ? "bg-[#3d4f47] text-white shadow-lg"
                          : "bg-white text-[#3d4f47] hover:bg-[#e8dcc8]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-full transition-all duration-300 ${
                        selectedSize === size
                          ? "bg-[#c8956a] text-white shadow-lg"
                          : "bg-white text-[#3d4f47] hover:bg-[#e8dcc8]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-sm text-[#7d8f87]">
              Showing {filtered.length} of {products.length} tables
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filtered.map((table, index) => (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <a
                    href={`/tables/${table.id}`}
                    className="group block rounded-2xl overflow-hidden bg-[#f5f1e8] hover:shadow-2xl transition-all duration-500"
                  >
                    {/* Placeholder instead of image */}
                    <div className="aspect-[4/3] overflow-hidden relative bg-gradient-to-br from-[#3d4f47] to-[#2d3f37] flex items-end p-6">
                      <span className="text-white/40 font-serif text-2xl">{table.name}</span>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#3d4f47]">
                        {table.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold text-[#3d4f47] mb-2 group-hover:text-[#c8956a] transition-colors">
                        {table.name}
                      </h3>
                      <p className="text-[#7d8f87] mb-4">{table.tagline}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#7d8f87]">{table.size}</span>
                        <span className="text-[#c8956a] font-medium group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-2xl text-[#7d8f87] mb-4">No tables match your filters</p>
              <button
                onClick={() => { setSelectedCategory("All"); setSelectedSize("All Sizes"); }}
                className="text-[#c8956a] hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
