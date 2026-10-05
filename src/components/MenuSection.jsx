import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuCategories } from '../data/menu';

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]?.name || '');

  return (
    <section id="menu" className="py-24 bg-brand-light">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-3 uppercase">Discover</h4>
          <h2 className="font-serif text-4xl text-brand-dark">Our Menu</h2>
        </div>

        {/* Category Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide mb-12 border-b border-brand-beige pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:justify-center">
          <div className="flex space-x-8 min-w-max">
            {menuCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`pb-4 text-sm font-medium tracking-wider uppercase transition-colors relative ${
                  activeCategory === category.name 
                    ? 'text-brand-dark' 
                    : 'text-brand-dark/40 hover:text-brand-dark/70'
                }`}
              >
                {category.name}
                {activeCategory === category.name && (
                  <motion.div 
                    layoutId="activeCategory"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10"
            >
              {menuCategories
                .find(c => c.name === activeCategory)
                ?.items.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="font-serif text-xl text-brand-dark">{item.name}</h3>
                      <div className="flex-1 mx-4 border-b border-dotted border-brand-dark/20 relative top-[-6px]"></div>
                      <span className="font-medium text-brand-accent">{item.price}</span>
                    </div>
                    {item.description && (
                      <p className="text-brand-dark/60 text-sm leading-relaxed pr-12">
                        {item.description}
                      </p>
                    )}
                  </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
