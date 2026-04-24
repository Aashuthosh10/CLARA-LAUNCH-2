import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useAnimationFrame } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { AuroraText } from '@/components/ui/aurora-text';
import { X, ChevronRight } from 'lucide-react';
import svitLogo from '../assets/logo/svit_logo_transparent.png';

const CAMPUS_IMAGES = [
  '/assets/campus_hd_1.jpg',
  '/assets/campus_hd_2.jpg',
  '/assets/campus_hd_3.jpg',
  '/assets/campus_hd_4.jpg',
  '/assets/campus_hd_5.jpg',
  '/assets/campus_hd_6.jpg',
  '/assets/campus_hd_7.jpg',
  '/assets/campus_hd_8.jpg',
];

const NEWS_ITEMS = [
  {
    id: 1,
    tag: "CAMPUS",
    title: "Annual Tech Symposium 2026",
    description: "Join us for a three-day celebration of innovation and technology featuring keynote speakers from industry leaders.",
    date: "APR 15, 2026"
  },
  {
    id: 2,
    tag: "ACADEMICS",
    title: "Semester Results Announced",
    description: "The results for the Odd Semester 2025-26 have been published. Students can check their portals for details.",
    date: "APR 10, 2026"
  },
  {
    id: 3,
    tag: "RESEARCH",
    title: "New AI Lab Inauguration",
    description: "SVIT inaugurates a state-of-the-art Artificial Intelligence and Machine Learning Research Laboratory.",
    date: "APR 05, 2026"
  },
  {
    id: 4,
    tag: "PLACEMENTS",
    title: "Record Placement Drive",
    description: "Over 200 students placed in top-tier companies during the recent spring placement drive.",
    date: "MAR 28, 2026"
  },
  {
    id: 5,
    tag: "SPORTS",
    title: "Inter-College Cricket Finals",
    description: "The college cricket team qualifies for the regional finals after a spectacular victory today.",
    date: "MAR 25, 2026"
  }
];

export default function SleepScreen({ onWake }: { onWake: () => void }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllNews, setShowAllNews] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Ticker Logic
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAMPUS_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Continuous auto-scroll animation
  useAnimationFrame((t, delta) => {
    if (isPaused || showAllNews) return;
    const speed = 0.05; // Base speed
    const currentX = x.get();
    const itemWidth = containerWidth / 3;
    const totalWidth = NEWS_ITEMS.length * itemWidth;
    
    let nextX = currentX - delta * speed;
    if (nextX <= -totalWidth) {
      nextX += totalWidth;
    }
    x.set(nextX);
  });

  const NewsCard = ({ item, index, isOverlay = false }: { item: typeof NEWS_ITEMS[0], index: number, isOverlay?: boolean }) => {
    // Dynamic styles based on position
    const itemWidth = containerWidth / 3;
    const offset = index * itemWidth;
    
    // Calculate distance from center for scaling effect
    const centerPoint = containerWidth / 2;
    // We use a custom transform that handles the wrapping
    const scale = useTransform(x, (val) => {
      if (isOverlay) return 1;
      let pos = (val + offset + itemWidth / 2);
      // Normalized wrap logic to keep distance calculations stable
      const totalWidth = NEWS_ITEMS.length * itemWidth;
      pos = ((pos % totalWidth) + totalWidth) % totalWidth;
      const dist = Math.abs(pos - centerPoint);
      // Focus range is ~itemWidth
      if (dist > itemWidth) return 0.85;
      const t = 1 - dist / itemWidth; // 1 at center, 0 at edges of focus
      return 0.85 + (0.35 * Math.pow(t, 2)); // Curved scaling for "snapping" feel
    });

    const opacity = useTransform(x, (val) => {
      if (isOverlay) return 1;
      let pos = (val + offset + itemWidth / 2);
      const totalWidth = NEWS_ITEMS.length * itemWidth;
      pos = ((pos % totalWidth) + totalWidth) % totalWidth;
      const dist = Math.abs(pos - centerPoint);
      if (dist > itemWidth) return 0.6;
      const t = 1 - dist / itemWidth;
      return 0.6 + 0.4 * t;
    });

    const brightness = useTransform(x, (val) => {
      if (isOverlay) return "brightness(100%)";
      let pos = (val + offset + itemWidth / 2);
      const totalWidth = NEWS_ITEMS.length * itemWidth;
      pos = ((pos % totalWidth) + totalWidth) % totalWidth;
      const dist = Math.abs(pos - centerPoint);
      if (dist > itemWidth) return "brightness(70%) blur(1px)";
      const t = 1 - dist / itemWidth;
      return `brightness(${70 + 40 * t}%) blur(${Math.max(0, 1 - t*3)}px)`;
    });

    return (
      <motion.div
        style={{ 
          x: isOverlay ? 0 : x, 
          scale, 
          opacity, 
          filter: brightness,
          width: isOverlay ? '100%' : `${itemWidth}px`,
          zIndex: isOverlay ? 1 : 10
        }}
        className={`flex-shrink-0 h-full p-4 md:p-8 transition-none group cursor-pointer ${isOverlay ? 'mb-8' : ''}`}
      >
        <div className={`h-full w-full bg-white/[0.08] backdrop-blur-[20px] border border-white/20 rounded-[2.5rem] p-10 flex flex-col justify-between 
                        shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 
                        group-hover:bg-white/[0.12] group-hover:border-white/30 group-hover:shadow-[0_30px_90px_rgba(0,0,0,0.5)]`}>
          <div>
            <div className="flex justify-between items-start mb-8">
              <span className="text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                {item.tag}
              </span>
              <span className="text-white/30 text-[9px] font-medium tracking-[0.4em] uppercase">
                {item.date}
              </span>
            </div>
            <h3 className="text-white text-2xl md:text-3xl font-bold mb-6 leading-tight group-hover:text-blue-300 transition-colors">
              {item.title}
            </h3>
            <p className="text-white/50 text-base md:text-lg line-clamp-2 font-light leading-relaxed mb-8">
              {item.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-blue-400/40 group-hover:text-blue-400 transition-all duration-500 overflow-hidden">
             <div className="h-[1px] w-0 group-hover:w-12 bg-blue-400/40 transition-all duration-700" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500">Discover</span>
             <ChevronRight size={16} className="transform group-hover:translate-x-2 transition-transform duration-500" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full overflow-hidden bg-black"
      onClick={() => onWake()}
      data-testid="sleep-screen"
    >
      {/* Background Slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 bg-black"
        >
          <img
            src={CAMPUS_IMAGES[currentIndex]}
            alt="Campus"
            className="w-full h-full object-cover scale-100 transition-transform duration-[5s] ease-linear brightness-50"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Vignetee Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-radial-gradient from-transparent via-black/20 to-black/90" />

      {/* Bottom Readability Gradient (Integrated) */}
      <div className="absolute inset-x-0 bottom-0 h-[50%] z-20 pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Global Dark Contrast Overlay for Visual Balance */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-black/20" />

      {/* Top Left: Premium Institutional Branding */}
      <div className="absolute top-12 left-16 z-30">
         <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="flex items-center gap-4 lg:gap-5"
        >
          <img
            src={svitLogo}
            alt="Sai Vidya Logo"
            className="h-[135px] w-[135px] lg:h-[160px] lg:w-[160px] object-contain opacity-95"
          />
          
          {/* Vertical Divider */}
          <div className="h-[135px] lg:h-[160px] w-[4px] bg-[#E85D04] rounded-sm"></div>

          <div className="flex flex-col justify-center pt-1">
            <h1 className="text-5xl lg:text-[64px] font-black tracking-[0.12em] text-[#F26522] uppercase leading-none drop-shadow-md" style={{ fontFamily: "Inter, sans-serif" }}>
              SAI VIDYA
            </h1>
            <p className="text-xs lg:text-[14px] font-bold tracking-[0.45em] text-white/90 uppercase mt-2 drop-shadow-sm pr-1">
              Institute of Technology
            </p>
            
            {/* Horizontal Divider */}
            <div className="h-[3px] w-full bg-[#555555] mt-3 mb-2 rounded-sm"></div>
            
            <p className="text-sm lg:text-[17px] font-medium text-white/60 italic drop-shadow-sm" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.03em" }}>
              Learn to lead
            </p>
          </div>
        </motion.div>
      </div>

      {/* Center: Quote & Interaction (Experience Core) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 top-[42%] -translate-y-1/2 z-30 flex flex-col items-center text-center pointer-events-none"
      >
        <p 
          className="text-4xl md:text-5xl font-normal text-white max-w-[55%]" 
          style={{ 
            fontFamily: "'Playfair Display', serif",
            lineHeight: 1.55,
            letterSpacing: "0.85px",
            textShadow: "0 4px 24px rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.6)"
          }}
        >
          "Tomorrow&apos;s intelligence, engineered by today&apos;s minds."
        </p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ delay: 1.5, duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <span className="text-xs md:text-sm tracking-[0.6em] uppercase text-white/50 font-light drop-shadow-md">
            TAP ANYWHERE TO START
          </span>
          <div className="h-[1px] w-8 bg-white/20 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Seamless News System (No container box) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 h-[40%] z-30 flex flex-col pointer-events-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Focused Ticker System (Overflow visible for floating effect) */}
        <div 
          className="flex-1 relative overflow-visible pointer-events-auto"
          ref={containerRef}
        >
          {containerWidth > 0 && (
            <div className="flex h-full items-center">
              {[...NEWS_ITEMS, ...NEWS_ITEMS, ...NEWS_ITEMS].map((item, idx) => (
                <NewsCard key={`${item.id}-${idx}`} item={item} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* Global wake hint - integrated softly */}
        <div className="mb-10 flex justify-center opacity-10">
           <span className="text-[9px] text-white tracking-[0.5em] font-light uppercase">Touch to activate</span>
        </div>
      </motion.div>

      {/* Floating View All Button (Bottom Right) */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        onClick={(e) => { e.stopPropagation(); setShowAllNews(true); }}
        className="absolute bottom-12 right-12 z-40 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/40 text-[9px] font-bold tracking-[0.3em] uppercase 
                   hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-500 shadow-2xl"
      >
        View All
      </motion.button>

      {/* Full Screen News Overlay */}
      <AnimatePresence>
        {showAllNews && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(100px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 bg-black/80 overflow-y-auto p-16 md:p-32"
          >
            <div className="max-w-6xl mx-auto relative">
              <button
                onClick={() => setShowAllNews(false)}
                className="fixed top-12 right-12 p-5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-50"
              >
                <X size={24} />
              </button>
              
              <div className="mb-24">
                <h2 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Campus News.
                </h2>
                <div className="h-1 w-24 bg-blue-500 mb-10" />
                <p className="text-white/40 text-xl max-w-2xl font-light leading-relaxed">
                  Deep insights into the pulse of Sai Vidya Institute of Technology.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-32">
                {NEWS_ITEMS.map((item, idx) => (
                  <NewsCard key={item.id} item={item} index={idx} isOverlay={true} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-purple-500/5 blur-[150px] rounded-full translate-x-1/2 pointer-events-none" />
    </motion.div>
  );
}
