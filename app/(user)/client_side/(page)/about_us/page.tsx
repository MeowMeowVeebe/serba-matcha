import Image from "next/image";

export default function about_us() {



    return (


        <main className="min-h-screen bg-green-50 font-['Blue-Winter']">
            {/* Our mission statement */}
            <section className="flex flex-col bg-green-100 w-full  flex py-150 px-5 items-center justify-center ">

                <div className="mb-30">

                    <div className="flex flex-col items-start">

                        <h2 className="text-5xl font-bold mb-4 text-green-900">
                            Our Mission Statement


                            <hr className="w-full max-w-7xl h-1 bg-[#296e29] border-0 mt-6" />

                        </h2>


                        <div className="max-w-7xl px-6">
                            <p className="text-green-800 text-4xl leading-snug">
                                "We challenge the way matcha is experienced and make Serba Matcha an inseparable part of everyday life—creating moments that inspire calm, creativity, and joy beyond the cup."
                            </p>
                        </div>

                    </div>


                </div>
            </section>


            <div className="h-10"> </div>



            <section className="flex flex-col bg-[#22201b] w-full flex py-15 px-5 items-center justify-center ">


                {/* OOur Story */}

                <section className="relative w-[1300px] h-[700px] bg-blue-500">
                    <Image
                        src="/team_group.png"
                        alt="Test"
                        fill
                        className="object-cover"
                    />
                </section>

                <div className="mb-30 mt-10">
                    <h2 className="self-start text-4xl font-bold mb-6 text-[#F5F5F5]  text-left">Our Story</h2>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-[#dbd1d1] text-2xl leading-relaxed space-y-6">
                        <p>
                            Serba Matcha is a contemporary beverage brand born from a shared passion for creativity, culture, and quality. Built on the belief that matcha can be both meaningful and modern, Serba Matcha exists to reimagine traditional flavors for a new generation.
                        </p>

                        <p>
                            Founded by a small team of creatives with backgrounds in design, hospitality, and digital culture, Serba Matcha began as an idea to bring matcha beyond its conventional boundaries. What started as simple experimentation—blending premium matcha with coffee, milk, and innovative flavor profiles—slowly evolved into a clear vision: to create a space where tradition meets expression, and every cup tells a story.
                        </p>

                        <p>
                            In its early stages, Serba Matcha focused on refining its craft—sourcing quality ingredients, developing signature recipes, and shaping a visual identity that felt calm, modern, and approachable. Through continuous exploration and attention to detail, the brand began forming a loyal community drawn to its distinctive taste and atmosphere.
                        </p>

                        <p>
                            As Serba Matcha grew, so did its ambition. The brand expanded its creative direction, strengthened its internal team, and laid the foundation for long-term growth. With a focus on experience as much as flavor, Serba Matcha continues to evolve as a lifestyle brand—one that blends beverage innovation, thoughtful design, and emotional connection.
                        </p>

                        <p>
                            Today, Serba Matcha stands as more than just a drink. It is a creative expression, a daily ritual, and a reflection of the belief that even the simplest moments—like enjoying a cup of matcha—can feel intentional, comforting, and inspiring.
                        </p>
                    </div>
                </div>

                <hr className="w-full max-w-7xl h-1 bg-[#296e29] border-0 mb-30 mt-20" />


                {/* Our Founder */}

                <section className="flex flex-col relative w-full py-30 mt-20 items-center">

                    <h2 className="text-4xl font-bold mb-6 text-[#F5F5F5] text-left">Our Founder</h2>

                    <section className="relative w-[900px] h-[700px] flex items-center justify-center bg-zinc-900/5">
                        <Image
                            src="/people/irsyad.png"
                            alt="Irsyad"
                            fill
                            className="object-contain"
                        />
                    </section>







                </section>








            </section>
            ``
        </main>
    )
};


