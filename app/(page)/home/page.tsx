

import Link from "next/link";

import localFont from "next/font/local";
import Image from "next/image";



export default function homepage() {
  return (

    <main className="min-h-screen bg-green-50">

      <section id="hero" className="relative w-full h-200 bg-[url('/serba-matcha-welcome.png')] bg-cover bg-center flex items-center justify-center overflow-hidden">

        <div className='absolute w-full h-full bg-black/30'>

        </div>

        <div className="z-30 text-center text-5xl font-['InkSeine']">
          <h1 className=" text-white"> Welcome to serba matcha</h1>
          <p className='text-white text-center mt-2 text-xl'> Fresh. Natural. Energizing.</p>
        </div>

        <Image
          src="/female-barrista.png"
          alt="Portrait Frame"
          width={1000}
          height={1000}
          className="absolute object-contain pointer-events-none z-20 w-120 h-120 bottom-0 right-50"
        />


      </section>
      {/* Hero Section */}
      <section className="relative mx-auto px-6   min-h-[32rem] text-center py-12 bg-gradient-to-b from-[#FAF8F5] to-[#F4F1EC]">

        <h1 className="text-4xl font-bold text-[#2E2E2E]">
          Serba Matcha
        </h1>
        <div className="
  mt-6
  max-w-6xl
  mx-auto
  columns-1
  gap-10
  text-[#2E2E2E]

  leading-relaxed
  
">
          <p>
            Serba Matcha Coffee Company adalah perusahaan minuman berbasis teh matcha dan kopi
            yang berfokus pada inovasi rasa, kualitas bahan, serta pengalaman pelanggan.
            Perusahaan ini menghadirkan berbagai varian minuman yang memadukan cita rasa
            tradisional matcha Jepang dengan sentuhan modern kopi dan kreasi kekinian.
          </p>

          <p>
            Matcha yang digunakan dipilih dari daun teh berkualitas tinggi yang diolah secara
            higienis untuk menjaga rasa autentik dan manfaat kesehatannya. Kombinasi matcha dan
            kopi memberikan alternatif minuman yang unik—menyegarkan, menenangkan, sekaligus
            meningkatkan energi secara seimbang.
          </p>

          <p>
            Melalui proses produksi yang terstandarisasi, Serba Matcha Coffee Company memastikan
            setiap produk memiliki kualitas, konsistensi rasa, serta nilai gizi yang optimal.
            Perusahaan juga menekankan konsep customer experience, di mana pelanggan dapat
            menikmati minuman sehat dan premium dalam suasana yang nyaman dan modern.
          </p>

          <p>
            Sebagai bagian dari pengembangan bisnis, Serba Matcha Coffee Company terus melakukan
            riset dan inovasi untuk menciptakan varian minuman baru yang sesuai dengan tren pasar.
            Dengan mengutamakan kualitas, kreativitas, dan pelayanan, perusahaan ini bertujuan
            menjadi salah satu brand minuman matcha dan kopi terkemuka di Indonesia maupun pasar
            internasional.
          </p>
        </div>


        <div className="mt-8 flex justify-center gap-4">

          <Link
            href="/about"
            className="rounded-full border border-green-600 px-6 py-3 text-green-700 font-medium hover:bg-green-100 transition"
          >
            About us
          </Link>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-black/10" />

      </section>




<section className="relative text-center px-6">
  <div className="pointer-events-none absolute left-0 w-full h-10 bg-gradient-to-b from-black/10 to-transparent" />

  <div className="flex flex-row flex-wrap items-center justify-center gap-12 py-12">
     <div className="flex flex-col items-center gap-3">
    <div className="w-24 h-24 bg-[#FAF8F5] rounded-full border-4 border-green-700 flex items-center justify-center">

            <img src="/matcha-tea.png" alt="Fresh Icon"  className="w-1/2 h-1/2"/>
    </div>
    <p className="text-sm text-green-900 font-medium">Excellent Drinks</p>
  </div>

  <div className="flex flex-col items-center gap-3">
    <div className="w-24 h-24 bg-[#FAF8F5] rounded-full border-4 border-green-700 flex items-center justify-center">
            <img src="/leaf.png" alt="Fresh Icon"  className="w-1/2 h-1/2"/>
    </div>
    <p className="text-sm text-green-900 font-medium">Excellent Matcha</p>
  </div>

  <div className="flex flex-col items-center gap-3">
    <div className="w-24 h-24 bg-[#FAF8F5] rounded-full border-4 border-green-700 flex items-center justify-center">
              <img src="/quality.png" alt="Fresh Icon"  className="w-1/2 h-1/2"/>
    </div>
    <p className="text-sm text-green-900 font-medium">High Quality</p>
  </div>

  <div className="flex flex-col items-center gap-3">
    <div className="w-24 h-24 bg-[#FAF8F5] rounded-full border-4 border-green-700 flex items-center justify-center"> 
      <img src="/trust.png" alt="Fresh Icon"  className="w-1/2 h-1/2"/>
    </div>
    <p className="text-sm text-green-900 font-medium">Made With Love</p>

  </div>

  </div>

    <div className="pointer-events-none absolute bottom-0 left-0 w-full h-10 bg-gradient-to-b from-transparent to-black/10 " />

</section>





      {/* Products Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 relative">



        <h2 className="text-2xl font-semibold text-green-900 mb-6 text-center">
          Featured Matcha
        </h2>

       
      </section>

      {/* About Section */}
      <section className="bg-green-100 py-90 ">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-green-900">
            Why Serba Matcha?
          </h2>
          <p className="mt-3 text-green-800/80">
            We provide fresh and healthy matcha products, carefully selected and crafted
            for the best taste and benefits.
          </p>
        </div>
      </section>



    </main>
  );
}
