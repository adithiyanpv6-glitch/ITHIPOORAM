import React from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../data/siteConfig';

export default function Special() {
  if (!siteConfig.dailySpecial || !siteConfig.dailySpecial.enabled) return null;

  return (
    <section className="py-24 bg-brand-ivory border-y border-brand-beige">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-3 uppercase">Recommended</h4>
          <h2 className="font-serif text-4xl text-brand-dark">Today's Special</h2>
        </motion.div>

        <div className="max-w-4xl mx-auto bg-brand-light rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-64 md:h-auto relative">
            <img 
              src={siteConfig.dailySpecial.image || "https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800&auto=format&fit=crop"} 
              alt={siteConfig.dailySpecial.name || "Special Dish"} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h3 className="font-serif text-3xl text-brand-dark mb-4">
              {siteConfig.dailySpecial.name || "Chef's Special"}
            </h3>
            <p className="text-brand-dark/70 text-base leading-relaxed mb-6">
              {siteConfig.dailySpecial.description || "Ask our staff about today's special offering."}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className="font-serif text-2xl text-brand-accent">
                {siteConfig.dailySpecial.price || ""}
              </span>
              <a 
                href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20ITHIPOORAM,%20I%20would%20like%20to%20know%20more%20about%20today's%20special.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 border border-brand-dark text-brand-dark text-sm font-medium rounded-full hover:bg-brand-dark hover:text-white transition-colors"
              >
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
