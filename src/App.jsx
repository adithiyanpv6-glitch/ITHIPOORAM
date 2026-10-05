import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Introduction from './components/Introduction';
import Special from './components/Special';
import MenuSection from './components/MenuSection';
import Gallery from './components/Gallery';
import Location from './components/Location';
import QRMenu from './components/QRMenu';
import Footer from './components/Footer';
import MobileBottomBar from './components/MobileBottomBar';

function App() {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Introduction />
        <Special />
        <MenuSection />
        <Gallery />
        <Location />
        <QRMenu />
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
}

export default App;
