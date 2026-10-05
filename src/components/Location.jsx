import React from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '../data/siteConfig';
import { MapPin, Clock, Phone } from 'lucide-react';

export default function Location() {
  return (
    <section id="location" className="py-24 bg-brand-ivory">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-16">
          <motion.div 
            className="w-full md:w-1/2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-3 uppercase">Visit Us</h4>
            <h2 className="font-serif text-4xl text-brand-dark mb-10">Find {siteConfig.name}</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin className="text-brand-accent mt-1" size={24} />
                <div>
                  <h5 className="font-serif text-xl text-brand-dark mb-2">Location</h5>
                  <p className="text-brand-dark/70 leading-relaxed max-w-xs">
                    {siteConfig.address}
                  </p>
                  {siteConfig.googleMaps ? (
                    <a 
                      href={siteConfig.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-brand-accent font-medium text-sm tracking-wide uppercase hover:text-brand-dark transition-colors"
                    >
                      Get Directions &rarr;
                    </a>
                  ) : (
                    <span className="inline-block mt-3 text-brand-dark/40 text-sm italic">
                      Google Maps location coming soon
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Clock className="text-brand-accent mt-1" size={24} />
                <div className="w-full">
                  <h5 className="font-serif text-xl text-brand-dark mb-3">Opening Hours</h5>
                  <ul className="space-y-2 text-brand-dark/70 text-sm w-full max-w-xs">
                    <li className="flex justify-between"><span>Monday</span> <span>{siteConfig.openingHours.monday}</span></li>
                    <li className="flex justify-between"><span>Tuesday</span> <span>{siteConfig.openingHours.tuesday}</span></li>
                    <li className="flex justify-between"><span>Wednesday</span> <span>{siteConfig.openingHours.wednesday}</span></li>
                    <li className="flex justify-between"><span>Thursday</span> <span>{siteConfig.openingHours.thursday}</span></li>
                    <li className="flex justify-between"><span>Friday</span> <span>{siteConfig.openingHours.friday}</span></li>
                    <li className="flex justify-between"><span>Saturday</span> <span>{siteConfig.openingHours.saturday}</span></li>
                    <li className="flex justify-between"><span>Sunday</span> <span>{siteConfig.openingHours.sunday}</span></li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Phone className="text-brand-accent mt-1" size={24} />
                <div>
                  <h5 className="font-serif text-xl text-brand-dark mb-2">Contact</h5>
                  <p className="text-brand-dark/70">
                    <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-brand-accent transition-colors">
                      {siteConfig.phone}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="w-full md:w-1/2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-brand-light p-8 md:p-12 rounded-2xl shadow-sm h-full flex flex-col justify-center items-center text-center border border-brand-beige">
              <h3 className="font-serif text-3xl text-brand-dark mb-4">Loved your experience?</h3>
              <p className="text-brand-dark/70 mb-8 max-w-sm">
                Share your experience with {siteConfig.name}. Your feedback helps us serve you better.
              </p>
              {siteConfig.googleReview ? (
                <a 
                  href={siteConfig.googleReview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-brand-dark text-white font-medium rounded-full hover:bg-brand-accent transition-colors w-full sm:w-auto"
                >
                  Leave a Review
                </a>
              ) : (
                <button 
                  disabled
                  className="px-8 py-3 bg-brand-dark/10 text-brand-dark/40 font-medium rounded-full cursor-not-allowed w-full sm:w-auto"
                >
                  Review link coming soon
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
