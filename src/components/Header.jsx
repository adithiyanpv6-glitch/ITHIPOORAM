import React, { useState, useEffect } from 'react';
import { siteConfig } from '../data/siteConfig';
import logo from '../assets/logo.jpg';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-light/95 backdrop-blur-sm shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center max-w-6xl">
        <a href="#" className="flex items-center">
          <img src={logo} alt={siteConfig.name} className="h-12 w-auto object-contain rounded-full shadow-sm" />
        </a>
        
        <nav className="hidden md:flex space-x-8 items-center">
          <a href="#about" className="text-sm font-medium tracking-wide hover:text-brand-accent transition-colors">ABOUT</a>
          <a href="#menu" className="text-sm font-medium tracking-wide hover:text-brand-accent transition-colors">MENU</a>
          <a href="#location" className="text-sm font-medium tracking-wide hover:text-brand-accent transition-colors">LOCATION</a>
          <a 
            href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`} 
            className="px-5 py-2 bg-brand-dark text-white text-sm font-medium rounded-full hover:bg-brand-accent transition-colors"
          >
            Call Now
          </a>
        </nav>
      </div>
    </header>
  );
}
