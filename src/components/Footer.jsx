import React from 'react';
import { siteConfig } from '../data/siteConfig';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-brand-light pt-20 pb-24 md:pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 border-b border-brand-light/10 pb-12">
          <div className="text-center md:text-left mb-10 md:mb-0">
            <h2 className="font-serif text-3xl font-bold tracking-widest mb-3">
              {siteConfig.name}
            </h2>
            <p className="text-brand-light/60 text-sm tracking-wide">
              Kerala cuisine • Vanchiyoor • Thiruvananthapuram
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <h4 className="text-brand-accent font-medium tracking-widest text-xs mb-4 uppercase">Follow The Journey</h4>
            <a 
              href={siteConfig.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-brand-light/20 rounded-full hover:bg-brand-light/10 transition-colors text-sm"
            >
              <InstagramIcon />
              @ithipooram
            </a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center text-brand-light/40 text-xs gap-4">
          <p>&copy; {currentYear} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#menu" className="hover:text-brand-light transition-colors">Menu</a>
            <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-brand-light transition-colors">Call</a>
            <a href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-light transition-colors">WhatsApp</a>
            <a href="#location" className="hover:text-brand-light transition-colors">Directions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
