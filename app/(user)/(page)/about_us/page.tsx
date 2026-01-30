"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";

// Zoomable Team Group Photo Component
function ZoomableTeamPhoto() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);

  const minScale = 1;
  const maxScale = 4;

  // Reset position when scale returns to 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Mouse wheel zoom - only when Ctrl is pressed or already zoomed in
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Only zoom if Ctrl key is pressed or image is already zoomed
    if (e.ctrlKey || scale > 1) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((prev) => Math.min(Math.max(prev + delta, minScale), maxScale));
    }
    // Otherwise, let the page scroll normally
  }, [scale]);

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const maxOffsetX = (rect.width * (scale - 1)) / 2;
      const maxOffsetY = (rect.height * (scale - 1)) / 2;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(newY, -maxOffsetY), maxOffsetY),
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // Single touch drag
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (distance - lastTouchDistance.current) * 0.01;
      lastTouchDistance.current = distance;
      setScale((prev) => Math.min(Math.max(prev + delta, minScale), maxScale));
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch drag
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const maxOffsetX = (rect.width * (scale - 1)) / 2;
      const maxOffsetY = (rect.height * (scale - 1)) / 2;
      
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(newY, -maxOffsetY), maxOffsetY),
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = null;
  }, []);

  // Double tap/click to reset
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  return (
    <div className="relative max-w-xl mx-auto group">
      {/* Main container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Metallic border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-2xl" />
        
        <div className="relative m-[2px] rounded-[14px] overflow-hidden bg-zinc-900">
          {/* Zoomable image container */}
          <div
            ref={containerRef}
            className="relative overflow-hidden touch-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/team_group.png"
              alt="Serba Matcha Team"
              className="w-full h-auto object-cover transition-transform duration-150 ease-out select-none"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />
          </div>
          
          {/* Cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
          
          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
            <p className="text-white font-bold text-lg">Serba Matcha Team</p>
            <p className="text-white/60 text-sm">Est. 2026 • Indonesia</p>
          </div>
          
          {/* Zoom indicator - only show when zoomed */}
          {scale > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full pointer-events-none">
              {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-green-50 font-['Blue-Winter']">
      {/* Our mission statement */}
      <section className="flex w-full flex-col items-center justify-center bg-green-100 px-5 py-16 sm:py-24 pt-28">
        <div className="w-full max-w-7xl">
          <h2 className="text-3xl sm:text-5xl font-bold text-green-900">Our Mission Statement</h2>
          <hr className="mt-6 h-1 w-full bg-[#296e29] border-0" />

          <p className="mt-6 sm:mt-8 max-w-6xl px-0 text-xl sm:text-3xl md:text-4xl leading-snug text-green-800">
            "We challenge the way matcha is experienced and make Serba Matcha an
            inseparable part of everyday life—creating moments that inspire calm,
            creativity, and joy beyond the cup."
          </p>
        </div>
      </section>

      <div className="h-10" />

      {/* Our Story section */}
      <section className="flex w-full flex-col items-center justify-center bg-[#22201b] px-5 py-16">
        {/* Hero image with zoom */}
        <ZoomableTeamPhoto />

        <div className="mt-14 w-full max-w-7xl">
          <h2 className="text-left text-4xl font-bold text-[#F5F5F5]">Our Story</h2>
        </div>

        <div className="mt-6 w-full max-w-7xl">
          <div className="space-y-6 text-xl sm:text-2xl leading-relaxed text-[#dbd1d1] text-justify">
            <p>
              Serba Matcha is a contemporary beverage brand born from a shared
              passion for creativity, culture, and quality. Built on the belief
              that matcha can be both meaningful and modern, Serba Matcha exists
              to reimagine traditional flavors for a new generation.
            </p>

            <p>
              Founded by a small team of creatives with backgrounds in design,
              hospitality, and digital culture, Serba Matcha began as an idea to
              bring matcha beyond its conventional boundaries. What started as
              simple experimentation—blending premium matcha with coffee, milk,
              and innovative flavor profiles—slowly evolved into a clear vision:
              to create a space where tradition meets expression, and every cup
              tells a story.
            </p>

            <p>
              In its early stages, Serba Matcha focused on refining its craft—sourcing
              quality ingredients, developing signature recipes, and shaping a visual
              identity that felt calm, modern, and approachable. Through continuous
              exploration and attention to detail, the brand began forming a loyal
              community drawn to its distinctive taste and atmosphere.
            </p>

            <p>
              As Serba Matcha grew, so did its ambition. The brand expanded its
              creative direction, strengthened its internal team, and laid the
              foundation for long-term growth. With a focus on experience as much
              as flavor, Serba Matcha continues to evolve as a lifestyle brand—one
              that blends beverage innovation, thoughtful design, and emotional
              connection.
            </p>

            <p>
              Today, Serba Matcha stands as more than just a drink. It is a creative
              expression, a daily ritual, and a reflection of the belief that even the
              simplest moments—like enjoying a cup of matcha—can feel intentional,
              comforting, and inspiring.
            </p>
          </div>
        </div>

        <hr className="mb-16 mt-16 h-1 w-full max-w-7xl bg-[#296e29] border-0" />

        {/* Our Founder */}
        <section className="flex w-full max-w-7xl flex-col items-center py-16">
          <h2 className="mb-10 w-full text-center text-4xl font-bold text-[#F5F5F5]">
            Our Founder
          </h2>

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">
            {/* Founder Image */}
            <div className="relative w-full max-w-sm mx-auto lg:mx-0 group">
              {/* Main container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Metallic border effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-2xl" />
                
                <div className="relative m-[2px] rounded-[14px] overflow-hidden bg-zinc-900">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src="/people/irsyad.png"
                      alt="Irsyad"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                    {/* Cinematic overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                  </div>
                  
                  {/* Name overlay - appears on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-bold text-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300">Irsyad</p>
                    <p className="text-green-400 text-sm font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">Founder & CEO</p>
                  </div>
                </div>
              </div>
              
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
            </div>

            {/* Founder Info */}
            <div className="flex-1 text-center lg:text-left">
              <blockquote className="relative">
                <svg className="absolute -top-4 -left-2 lg:-left-6 w-10 h-10 text-green-500/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-xl sm:text-2xl text-[#dbd1d1] italic leading-relaxed pl-6 lg:pl-8">
                  Building the future of matcha experience, one cup at a time. We believe great matcha can bring people together.
                </p>
              </blockquote>

              <div className="mt-8 p-6 rounded-2xl bg-zinc-800/50 border border-white/10">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Vision
                </h4>
                <p className="text-[#a8a8a8] leading-relaxed text-justify">
                  To make Serba Matcha the leading matcha lifestyle brand in Indonesia, inspiring a new generation to embrace wellness, creativity, and meaningful moments through every cup.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 justify-center lg:justify-start">
                <span className="flex items-center gap-2 text-sm text-white/70 bg-zinc-800/50 px-4 py-2 rounded-full border border-white/10">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Entrepreneur
                </span>
                <span className="flex items-center gap-2 text-sm text-white/70 bg-zinc-800/50 px-4 py-2 rounded-full border border-white/10">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Innovator
                </span>
                <span className="flex items-center gap-2 text-sm text-white/70 bg-zinc-800/50 px-4 py-2 rounded-full border border-white/10">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Matcha Lover
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
