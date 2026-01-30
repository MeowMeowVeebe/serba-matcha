

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  stock?: number;
};

export default function homepage() {
  const [featured, setFeatured] = useState<Product | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  // 'pending' = waiting to determine, 'animate' = should animate, 'none' = no animation
  const [animationMode, setAnimationMode] = useState<'pending' | 'animate' | 'none'>('pending');
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const featuredRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Always enable animation
  useEffect(() => {
    setAnimationMode('animate');
  }, []);

  // Handle browser back/forward navigation to ensure UI loads properly
  useEffect(() => {
    const handlePopState = () => {
      // Force refresh when navigating back to this page
      if (window.location.pathname === '/home') {
        window.location.reload();
      }
    };

    // Listen to popstate event (browser back/forward button)
    window.addEventListener('popstate', handlePopState);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Scroll-based parallax animation for Featured Product
  useEffect(() => {
    if (animationMode !== 'animate' || !featuredRef.current) return;

    const handleScroll = () => {
      if (!featuredRef.current) return;
      
      const rect = featuredRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress: 0 when section enters viewport bottom, 1 when section is centered
      // Start animating when top of section is at bottom of viewport
      // End when section is 30% from top of viewport
      const startPoint = windowHeight; // bottom of viewport
      const endPoint = windowHeight * 0.3; // 30% from top
      
      const currentPosition = rect.top;
      
      if (currentPosition >= startPoint) {
        setScrollProgress(0);
      } else if (currentPosition <= endPoint) {
        setScrollProgress(1);
      } else {
        const progress = (startPoint - currentPosition) / (startPoint - endPoint);
        setScrollProgress(Math.min(1, Math.max(0, progress)));
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [animationMode]);

  useEffect(() => {
    const loadFeatured = async () => {
      setFeaturedLoading(true);
      try {
        const res = await fetch("/api/seller/products");
        if (!res.ok) return;
        const json = await res.json();
        const products: Product[] = json.products || [];
        if (!products.length) return;
        // Heuristic: pick the product with lowest stock (most purchased); fallback to first item.
        const sorted = [...products].sort((a, b) => (a.stock ?? Number.MAX_SAFE_INTEGER) - (b.stock ?? Number.MAX_SAFE_INTEGER));
        setFeatured(sorted[0]);
      } catch {
        /* ignore */
      } finally {
        setFeaturedLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (

    <main className="min-h-screen bg-green-50">

      <section
        id="hero"
        className="relative flex w-full items-center justify-center overflow-hidden bg-[url('/serba-matcha-welcome.png')] bg-cover bg-center min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh]"
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Main content - centered text */}
        <div className="relative z-30 flex flex-col items-center justify-center px-4 text-center pt-16 sm:pt-20 md:pt-24">
          {/* Logo above text */}
          <div className="mb-4 sm:mb-6">
            <Image
              src="/logo/serbamatcha.png"
              alt="Serba Matcha Logo"
              width={200}
              height={200}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
          
          {/* Welcome text */}
          <h1 className="font-['InkSeine'] text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg">
            Welcome to Serba Matcha
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-white/90 font-medium tracking-wide drop-shadow-md">
            Fresh. Natural. Energizing.
          </p>
          
          {/* CTA Button */}
          <Link
            href="/menu"
            className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:scale-105 hover:shadow-xl"
          >
            Explore Menu
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Barista image - positioned at bottom right */}
        <div className="pointer-events-none absolute bottom-0 right-0 z-20">
          <Image
            src="/female-barrista.png"
            alt="Barista"
            width={600}
            height={600}
            className="object-contain w-[180px] sm:w-[280px] md:w-[380px] lg:w-[480px] translate-x-[5%] sm:translate-x-0"
            priority
          />
        </div>
      </section>




      {/* About Section */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#FAF8F5] to-[#F4F1EC]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2E2E2E] mb-2">
            Serba Matcha
          </h2>
          <div className="w-20 h-1 bg-green-600 mx-auto mb-8 rounded-full" />
          
          <div className="space-y-5 text-[#4A4A4A] text-sm sm:text-base leading-relaxed text-justify sm:text-center">
            <p>
              Serba Matcha Coffee Company is a matcha- and coffee-based beverage brand focused on flavor innovation,
              ingredient quality, and an exceptional customer experience. The company offers a wide range of drinks
              that blend the traditional taste of Japanese matcha with modern coffee elements and contemporary
              creations.
            </p>

            <p>
              Our matcha is sourced from high-quality tea leaves and processed hygienically to preserve its authentic
              flavor and health benefits. The combination of matcha and coffee provides a unique alternative—refreshing
              and calming, while also delivering balanced energy.
            </p>

            <p>
              Through standardized production processes, Serba Matcha Coffee Company ensures every product meets
              high quality standards, maintains consistent taste, and delivers optimal nutritional value. We also
              emphasize customer experience, creating a comfortable, modern atmosphere where customers can enjoy
              healthy, premium beverages.
            </p>

            <p>
              As part of our business growth, we continuously conduct research and innovation to develop new drink
              variants that align with market trends. By prioritizing quality, creativity, and service, we aim to become
              one of the leading matcha and coffee beverage brands in Indonesia and the international market.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/about_us"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 px-6 sm:px-8 py-3 text-green-700 font-semibold hover:bg-green-600 hover:text-white transition-all duration-300"
            >
              Learn More About Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Product Section */}
      <section ref={featuredRef} className="w-full bg-gradient-to-b from-[#F4F1EC] to-[#E8E4DD] py-16 sm:py-20 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-green-900">Featured Product</h2>
          </div>

          {/* 16:9 Featured Card */}
          <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10">
            {/* Background Image */}
            <Image
              src="/background-featured2.png"
              alt="Featured Background"
              fill
              className="object-cover"
              priority
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            
            {/* Content Grid */}
            <div className="absolute inset-0 flex items-center">
              <div 
                ref={contentRef}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full p-6 sm:p-10 lg:p-12"
              >
                {/* Left - Product Info */}
                <div 
                  className="flex flex-col justify-center"
                  style={animationMode === 'animate' ? {
                    opacity: scrollProgress,
                    transform: `translateX(${(1 - scrollProgress) * -80}px)`,
                    transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                  } : {}}
                >
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                      {featured?.name || "Signature Matcha Latte"}
                    </h3>
                    
                    <p className="text-white/80 text-sm sm:text-base line-clamp-3 max-w-md">
                      {featured?.description || "Crafted with ceremonial-grade matcha from Kyoto, blended to perfection for a smooth and refreshing experience."}
                    </p>
                    
                    <Link
                      href="/menu"
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-lg w-fit mt-2"
                    >
                      Order Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
                
                {/* Right - Product Image */}
                <div 
                  className="relative flex items-center justify-center"
                  style={animationMode === 'animate' ? {
                    opacity: scrollProgress,
                    transform: `translateX(${(1 - scrollProgress) * 80}px)`,
                    transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                  } : {}}
                >
                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] aspect-square">
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 bg-green-400/20 rounded-full blur-3xl"
                      style={animationMode === 'animate' ? {
                        transform: `scale(${0.5 + scrollProgress * 0.25})`,
                        opacity: scrollProgress * 0.8,
                        transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
                      } : { transform: 'scale(0.75)' }}
                    />
                    
                    {/* Product Image */}
                    <Image
                      src={featured?.image || "/matchatea.png"}
                      alt={featured?.name || "Featured product"}
                      fill
                      sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 380px"
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-white/20 rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-white/20 rounded-bl-2xl" />
          </div>

          {/* Loading State */}
          {featuredLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-gradient-to-br from-green-100 to-green-50 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 mb-4">
            Why Serba Matcha?
          </h2>
          <div className="w-16 h-1 bg-green-600 mx-auto mb-6 rounded-full" />
          <p className="text-base sm:text-lg text-green-800/90 leading-relaxed max-w-2xl mx-auto">
            We provide fresh and healthy matcha products, carefully selected and crafted
            for the best taste and benefits. Experience the authentic Japanese matcha
            tradition with our premium quality beverages.
          </p>
          <div className="mt-8">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3 text-white font-semibold shadow-md transition-all hover:bg-green-700 hover:shadow-lg hover:scale-105"
            >
              View Our Menu
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>



    </main>
  );
}


