import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { siteConfig } from '../data/siteConfig';
import { Share2 } from 'lucide-react';

export default function QRMenu() {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: siteConfig.name,
          text: `Check out ${siteConfig.name} - Authentic Kerala flavours!`,
          url: currentUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="py-24 bg-brand-brown text-brand-light">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-brand-dark/20 p-8 md:p-12 rounded-3xl backdrop-blur-sm border border-brand-light/10 flex flex-col md:flex-row items-center justify-center gap-10"
        >
          <div className="bg-white p-4 rounded-xl shadow-2xl">
            <QRCodeSVG 
              value={currentUrl || "https://ithipooram.com"} 
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#1C1917"}
              level={"Q"}
            />
          </div>
          
          <div className="text-center md:text-left max-w-sm">
            <h4 className="text-brand-accent font-medium tracking-widest text-sm mb-2 uppercase">Digital Menu</h4>
            <h3 className="font-serif text-3xl mb-4">Scan. Explore. Enjoy.</h3>
            <p className="text-brand-light/70 mb-8 text-sm leading-relaxed">
              Scan this QR code to view our complete menu on your phone, or share the link with your friends and family.
            </p>
            
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-brand-light text-brand-dark font-medium rounded-full hover:bg-brand-accent hover:text-white transition-colors"
            >
              <Share2 size={18} />
              {copied ? 'Link Copied!' : `Share ${siteConfig.name}`}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
