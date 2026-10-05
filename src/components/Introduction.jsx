import React from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../data/siteConfig';
import signboard2 from '../assets/signboard2.png';

export default function Introduction() {
  return (
    <section id="about" className="py-24 bg-brand-light">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <motion.div 
            className="w-full md:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-xl">
              <img 
                src={signboard2} 
                alt="Ithipooram Signboard" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-brand-brown/10"></div>
            </div>
          </motion.div>
          
          <motion.div 
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-4 uppercase">The Experience</h4>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-dark mb-6 leading-tight">
              A Taste of <br className="hidden md:block" />Authentic Kerala
            </h2>
            <p className="text-brand-dark/80 text-lg leading-relaxed mb-8">
              {siteConfig.story}
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-brand-dark/10">
              <div>
                <h5 className="font-serif text-xl text-brand-dark mb-2">Location</h5>
                <p className="text-brand-dark/70 text-sm">Vanchiyoor,<br/>Thiruvananthapuram</p>
              </div>
              <div>
                <h5 className="font-serif text-xl text-brand-dark mb-2">Dining</h5>
                <p className="text-brand-dark/70 text-sm">Lunch & Dinner<br/>Dine-in, Takeaway</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
