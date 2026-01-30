"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const founder = {
  name: "Irsyad",
  role: "Chief Executive Officer",
  image: "/people/irsyad.png",
  quote: "Building the future of matcha experience, one cup at a time.",
};

const team = [
  {
    name: "Azzam",
    role: "Creative Director",
    image: "/people/azzam.png",
    socials: { linkedin: "#", twitter: "#" },
  },
  {
    name: "Sultan Harunsyah",
    role: "Frontend Developer",
    image: "/people/sultan.png",
    socials: { linkedin: "#", github: "#" },
  },
  {
    name: "Ray Alland",
    role: "Backend Developer",
    image: "/people/ray.png",
    socials: { linkedin: "#", github: "#" },
  },
  {
    name: "Hanif",
    role: "Operations Manager",
    image: "/people/hanif.png",
    socials: { linkedin: "#", twitter: "#" },
  },
];

const values = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Passion",
    description: "We love what we do and it shows in every cup we serve.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Innovation",
    description: "Constantly exploring new ways to enhance your matcha experience.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Community",
    description: "Building meaningful connections with our customers and partners.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Quality",
    description: "Only the finest ingredients and meticulous preparation methods.",
  },
];

export default function OurTeamPage() {
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [valuesProgress, setValuesProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Executive Team Section parallax
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight && rect.bottom > 0) {
          const offset = (windowHeight - rect.top) * 0.3;
          setParallaxOffset(offset);
        }
      }

      // Values Section parallax
      if (valuesRef.current) {
        const rect = valuesRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight && rect.bottom > 0) {
          const startPoint = windowHeight;
          const endPoint = windowHeight * 0.4;
          const currentPosition = rect.top;
          
          if (currentPosition >= startPoint) {
            setValuesProgress(0);
          } else if (currentPosition <= endPoint) {
            setValuesProgress(1);
          } else {
            const progress = (startPoint - currentPosition) / (startPoint - endPoint);
            setValuesProgress(Math.min(1, Math.max(0, progress)));
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EDE8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0C3B2E] via-[#0F4D3A] to-[#127246] pt-24 pb-20 sm:pt-28 sm:pb-28">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-green-300/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-yellow-300/10 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            Our Team
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Passionate individuals dedicated to bringing you the finest matcha experience. Together, we craft moments of pure joy.
          </p>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-50 px-4 py-1.5 rounded-full mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Our Visionary
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-green-900">Founder & CEO</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Founder Image */}
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div className="absolute -inset-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl blur-2xl opacity-20" />
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white">{founder.name}</h3>
                  <p className="text-green-300 font-medium">{founder.role}</p>
                </div>
              </div>
            </div>

            {/* Founder Info */}
            <div className="flex-1 text-center lg:text-left">
              <blockquote className="relative">
                <svg className="absolute -top-4 -left-4 w-12 h-12 text-green-200 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-xl sm:text-2xl text-green-800 italic leading-relaxed pl-8">
                  {founder.quote}
                </p>
              </blockquote>

              <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
                <h4 className="font-semibold text-green-900 mb-3">Our Mission</h4>
                <p className="text-green-700/80 leading-relaxed">
                  To share the authentic taste of premium Japanese matcha while creating a welcoming space for our community. We believe that great matcha can bring people together and create meaningful moments.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Est. 2026
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Indonesia
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="py-16 bg-gradient-to-r from-green-800 to-green-700 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Our Core Values</h2>
            <p className="text-green-100/80 max-w-xl mx-auto">
              The principles that guide everything we do at Serba Matcha
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              // index 0 (Passion) & 1 (Innovation) slide from left
              // index 2 (Community) & 3 (Quality) slide from right
              const isFromLeft = index < 2;
              const slideDistance = isFromLeft ? -100 : 100;
              const delay = index * 0.1;
              
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors group"
                  style={{
                    opacity: valuesProgress,
                    transform: `translateX(${(1 - valuesProgress) * slideDistance}px)`,
                    transition: `opacity 0.4s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-green-200 mb-4 group-hover:scale-110 transition-transform">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-green-100/70">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Executive Team Section */}
      <section ref={sectionRef} className="relative py-16 sm:py-24 overflow-hidden">
        {/* Background Image with Parallax */}
        <div 
          className="absolute inset-0 bg-[url('/matcha-wallpaper.jpg')] bg-cover bg-center"
          style={{
            transform: `translateY(${parallaxOffset}px) scale(1.2)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${135 + parallaxOffset * 0.1}deg, rgba(255,255,255,0.85) 0%, rgba(240,253,244,0.8) 50%, rgba(255,255,255,0.85) 100%)`,
            backdropFilter: 'blur(4px)',
            transition: 'background 0.3s ease-out',
          }}
        />
        {/* Floating decorative shapes */}
        <div 
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-green-300/20 blur-3xl"
          style={{
            transform: `translate(${parallaxOffset * 0.15}px, ${parallaxOffset * -0.1}px)`,
          }}
        />
        <div 
          className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-emerald-400/15 blur-3xl"
          style={{
            transform: `translate(${parallaxOffset * -0.12}px, ${parallaxOffset * 0.08}px)`,
          }}
        />
        <div 
          className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-green-200/25 blur-2xl"
          style={{
            transform: `translate(${parallaxOffset * 0.1}px, ${parallaxOffset * -0.15}px)`,
          }}
        />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-50 px-4 py-1.5 rounded-full mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              The Dream Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-green-900">Executive Team</h2>
            <p className="mt-3 text-green-700/70 max-w-xl mx-auto">
              The talented individuals who bring our vision to life every single day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Social Links - appear on hover */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {member.socials.linkedin && (
                      <a href={member.socials.linkedin} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    )}
                    {member.socials.github && (
                      <a href={member.socials.github} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {member.socials.twitter && (
                      <a href={member.socials.twitter} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 text-center">
                  <h3 className="font-semibold text-green-900 text-lg">{member.name}</h3>
                  <p className="text-sm text-green-600 mt-1">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-green-900 mb-4">
            Get in Touch With Us
          </h2>
          <p className="text-green-700/80 mb-8 max-w-xl mx-auto">
            Have questions or want to know more? Feel free to reach out to us via WhatsApp or explore our delicious menu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/6287878102550?text=Halo%20Serba%20Matcha%2C%20saya%20tertarik%20untuk%20bergabung%20dengan%20tim%20Anda!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3.5 text-white font-semibold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Hubungi via WhatsApp
            </a>
            <Link
              href="/menu"
              className="group relative inline-flex items-center gap-2 rounded-full border-2 border-green-600 px-8 py-3.5 text-green-700 font-semibold overflow-hidden transition-all duration-300 hover:text-white hover:border-green-700 hover:shadow-lg hover:scale-105"
            >
              {/* Background animation */}
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              
              {/* Text content */}
              <span className="relative z-10">View Our Menu</span>
              
              {/* Arrow icon with animation */}
              <svg 
                className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
