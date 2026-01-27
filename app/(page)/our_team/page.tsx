
import contact from '@/app/components/contact';
import Image from "next/image";

export default function our_teampage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-black font-['Blue-Winter']">
      {/* Moving matcha wallpaper */}
      <div className="absolute inset-0 animate-drift bg-[url('/matcha-wallpaper.jpg')] bg-cover bg-center" />

      {/* Optional overlay so text stays readable */}
      <div className="absolute inset-0 bg-white/70" />

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-5xl font-bold text-center py-10">Our Founder</h1>

        <div className="grid grid-cols-2 gap-y-12 gap-x-6 max-w-4xl w-full">
          <div className="col-span-2 flex justify-center">
            <div className="group w-[280px] h-[380px] relative overflow-hidden">
              <Image
                src="/people/irsyad.png"
                alt="Person 1"
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center">
                <h3 className="text-white text-lg font-semibold">Irsyad</h3>
                <p className="text-white/80 text-sm">CEO</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Your content on top */}
      <div className="relative z-10 flex flex-col items-center py-20">
        <h1 className="text-5xl font-bold text-center py-10">Our Executive Team</h1>

        <div className="grid grid-cols-2 gap-y-12 gap-x-6 max-w-4xl">
          {/* Top Left */}
          <div className="group w-[280px] h-[380px] relative overflow-hidden">
            <Image src="/people/azzam.png" alt="Person 1" fill className="object-cover" priority />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center">
              <h3 className="text-white text-lg font-semibold">Azzam</h3>
              <p className="text-white/80 text-sm">PPT</p>
            </div>

            {/*    <Image
              src="/frame.png"
              alt="Portrait Frame"
              fill
              className="object-contain pointer-events-none z-20 w-full h-full"
            />
  
      */}
          </div>
          {/* Top Right */}
          <div className="group w-[280px] h-[380px] relative overflow-hidden">
            <Image src="/people/sultan.png" alt="Person 2" fill className="object-cover" priority />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center">
              <h3 className="text-white text-lg font-semibold">Sultan Harunsyah</h3>
              <p className="text-white/80 text-sm">Frontend Developer</p>
            </div>
          </div>

          {/* Bottom Left */}
          <div className="group w-[280px] h-[380px] relative overflow-hidden">
            <Image src="/people/ray.png" alt="Person 3" fill className="object-cover" priority />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center">
              <h3 className="text-white text-lg font-semibold">Ray Alan</h3>
              <p className="text-white/80 text-sm">Backend Developer</p>
            </div>
          </div>

          {/* Bottom Right */}
          <div className="group w-[280px] h-[380px] relative overflow-hidden">
            <Image src="/people/hanif.png" alt="Person 4" fill className="object-cover" priority />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center">
              <h3 className="text-white text-lg font-semibold">Hanif</h3>
              <p className="text-white/80 text-sm">Manager</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
