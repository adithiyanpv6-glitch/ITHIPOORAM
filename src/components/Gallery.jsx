import React from 'react';
import { motion } from 'framer-motion';

import signboard1 from '../assets/signboard1.png';

const images = [
  "https://images.unsplash.com/photo-1589301760014-d929f39ce9de?q=80&w=800&auto=format&fit=crop", // Biriyani
  "https://images.unsplash.com/photo-1613478881439-53702efcdcf6?q=80&w=800&auto=format&fit=crop", // Appam/Stew
  signboard1, // Signboard
];

export default function Gallery() {
  return (
    <section className="py-24 bg-brand-light overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-3 uppercase">Gallery</h4>
          <h2 className="font-serif text-4xl text-brand-dark">Culinary Art</h2>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[500px]">
          <motion.div 
            className="w-full md:w-1/2 h-[300px] md:h-full rounded-2xl overflow-hidden group"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src={images[0]} 
              alt="Signature dish" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </motion.div>
          
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <motion.div 
              className="h-[300px] md:h-[calc(50%-12px)] rounded-2xl overflow-hidden group"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src={images[1]} 
                alt="Kerala delicacy" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </motion.div>
            <motion.div 
              className="h-[300px] md:h-[calc(50%-12px)] rounded-2xl overflow-hidden group"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <img 
                src={images[2]} 
                alt="Traditional preparation" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
