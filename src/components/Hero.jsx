import React from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../data/siteConfig';
import { MapPin, Phone } from 'lucide-react';
import storefront from '../assets/storefront.png';

export default function Hero() {
  return (
    <section id="home" className="relative h-[90vh] min-h-[600px] w-full bg-brand-brown flex items-center justify-center overflow-hidden">
      {/* Background Image - Storefront */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${storefront})` }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 via-transparent to-brand-dark/80 z-0"></div>
      
      <div className="relative z-10 container mx-auto px-4 text-center mt-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-brand-light mb-6 tracking-wide drop-shadow-md">
            {siteConfig.name}
          </h1>
          <p className="font-serif text-xl md:text-2xl text-brand-ivory mb-10 max-w-2xl mx-auto italic drop-shadow-sm">
            "Authentic Kerala flavours, beautifully served."
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <a 
            href="#menu" 
            className="w-full sm:w-auto px-8 py-4 bg-brand-light text-brand-dark font-medium tracking-widest uppercase text-sm rounded-full hover:bg-brand-accent hover:text-white transition-all duration-300 shadow-lg"
          >
            View Menu
          </a>
          <a 
            href="#location" 
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-brand-light text-brand-light font-medium tracking-widest uppercase text-sm rounded-full hover:bg-brand-light/10 transition-all duration-300"
          >
            Get Directions
          </a>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 flex items-center justify-center gap-6 text-brand-light/90 text-sm font-medium"
        >
          <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone size={16} />
            CALL NOW
          </a>
          <span className="w-1 h-1 rounded-full bg-brand-light/50"></span>
          <a href="#location" className="flex items-center gap-2 hover:text-white transition-colors">
            <MapPin size={16} />
            VANCHIYOOR
          </a>
        </motion.div>
      </div>
    </section>
  );
}
