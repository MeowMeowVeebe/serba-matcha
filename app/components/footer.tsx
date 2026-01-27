
import Image from "next/image";

export default function Footer() {
  return (



    <main className="w-full h bg-[#1A1A1A]">

      <footer className="flex text-center text-green-800/70 text-sm py-10 py-25 item-center w-full justify-between px-10 ">

        <div className="flex flex-col items-center justify-center gap-3 text-center text-[#CFCFCF]">
          <Image
            src="/logo/serbamatcha.png"
            alt="Serba Matcha Logo"
            width={160}
            height={160}
            className="opacity-90"
          />

          <p className="text-sm">
            © {new Date().getFullYear()} Serba Matcha Company
          </p>
        </div>


        <div className="flex flex-col items-center gap-3 py-6 text-center text-[#CFCFCF] ">

           <p className="text-2xl font-medium tracking-wide">
            Social Media
          </p>


          <hr className="w-full h-px bg-[#CFCFCF] border-0"/>
          
          
          <div className="flex flex-row items-center gap-30 mt-2"> 
            <a href="https://www.facebook.com/serbamatcha" target="_blank" rel="noopener noreferrer">
              <Image
                src="/facebook.png"
                alt="Facebook Logo"
                width={24}
                height={24}
                className="hover:opacity-70"
              />
            </a>

                  <a href="https://www.facebook.com/serbamatcha" target="_blank" rel="noopener noreferrer">
              <Image
                src="/facebook.png"
                alt="Facebook Logo"
                width={24}
                height={24}
                className="hover:opacity-70"
              />
            </a>

                  <a href="https://www.facebook.com/serbamatcha" target="_blank" rel="noopener noreferrer">
              <Image
                src="/facebook.png"
                alt="Facebook Logo"
                width={24}
                height={24}
                className="hover:opacity-70"
              />
            </a>


          </div>

         
        </div>
      </footer>




    </main>

  )
};