import React, { useState, useEffect } from 'react';
import { Home, Menu, Phone, MessageCircle, MapPin } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';

export default function MobileBottomBar() {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'menu', 'location'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
        }
        return false;
      });
      if (current) setActiveTab(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-light/95 backdrop-blur-md border-t border-brand-beige z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        <a 
          href="#home" 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'home' ? 'text-brand-accent' : 'text-brand-dark/50'}`}
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wider">HOME</span>
        </a>
        
        <a 
          href="#menu" 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'menu' ? 'text-brand-accent' : 'text-brand-dark/50'}`}
        >
          <Menu size={20} strokeWidth={activeTab === 'menu' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wider">MENU</span>
        </a>
        
        <a 
          href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`} 
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-brand-dark/50 hover:text-brand-accent transition-colors"
        >
          <Phone size={20} />
          <span className="text-[10px] font-medium tracking-wider">CALL</span>
        </a>
        
        <a 
          href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, '')}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-brand-dark/50 hover:text-green-600 transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-[10px] font-medium tracking-wider">WHATSAPP</span>
        </a>
        
        <a 
          href="#location" 
          onClick={() => setActiveTab('location')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'location' ? 'text-brand-accent' : 'text-brand-dark/50'}`}
        >
          <MapPin size={20} strokeWidth={activeTab === 'location' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-wider">FIND US</span>
        </a>
      </div>
    </div>
  );
}
