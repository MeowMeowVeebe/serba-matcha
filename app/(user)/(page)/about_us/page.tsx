import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-green-50 font-['Blue-Winter']">
      {/* Our mission statement */}
      <section className="flex w-full flex-col items-center justify-center bg-green-100 px-5 py-24">
        <div className="w-full max-w-7xl">
          <h2 className="text-5xl font-bold text-green-900">Our Mission Statement</h2>
          <hr className="mt-6 h-1 w-full bg-[#296e29] border-0" />

          <p className="mt-8 max-w-6xl px-0 text-4xl leading-snug text-green-800">
            “We challenge the way matcha is experienced and make Serba Matcha an
            inseparable part of everyday life—creating moments that inspire calm,
            creativity, and joy beyond the cup.”
          </p>
        </div>
      </section>

      <div className="h-10" />

      {/* Our Story section */}
      <section className="flex w-full flex-col items-center justify-center bg-[#22201b] px-5 py-16">
        {/* Hero image */}
        <div className="relative w-full max-w-7xl overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/team_group.png"
              alt="Team Group"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="mt-10 w-full max-w-7xl">
          <h2 className="text-left text-4xl font-bold text-[#F5F5F5]">Our Story</h2>
        </div>

        <div className="mt-6 w-full max-w-7xl">
          <div className="space-y-6 text-2xl leading-relaxed text-[#dbd1d1]">
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
          <h2 className="mb-6 w-full text-center text-4xl font-bold text-[#F5F5F5]">
            Our Founder
          </h2>

          <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900/20">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/people/irsyad.png"
                alt="Irsyad"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
