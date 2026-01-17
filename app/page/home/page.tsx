
import contact from '@/app/components/contact';
import Link from "next/link";

export default function home() {
  return (


     <main className="min-h-screen px-6 py-10">
      {/* Hero */}
      <section className="mx-auto max-w-5xl">
        <div className="rounded-2xl border p-8">
          <p className="text-sm opacity-70">Next.js • App Router</p>

          <h1 className="mt-3 text-3xl font-bold leading-tight">
            Welcome to Home 👋
          </h1>

          <p className="mt-3 max-w-2xl opacity-80">
            Ini halaman default untuk route <b>/</b>. Jadi saat website pertama
            kali dibuka, yang tampil adalah Home (bukan 404).
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Go to About →
            </Link>

            <Link
              href="/products"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:opacity-80"
            >
              Browse Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-10 max-w-5xl">
        <h2 className="text-xl font-semibold">Quick Sections 🚀</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">Fast Setup</h3>
            <p className="mt-2 text-sm opacity-80">
              Letakkan file ini di <code>app/page.tsx</code> supaya route <b>/</b>{" "}
              selalu ada.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">App Router Ready</h3>
            <p className="mt-2 text-sm opacity-80">
              Layout kamu tetap jalan (Header muncul), lalu {`{children}`} akan
              menampilkan halaman ini.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">Easy Navigation</h3>
            <p className="mt-2 text-sm opacity-80">
              Link di atas contoh route. Pastikan kamu punya folder route-nya biar
              ga 404.
            </p>
          </div>
        </div>
      </section>
      </main>
  );
}
