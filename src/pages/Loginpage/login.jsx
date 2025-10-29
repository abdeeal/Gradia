// src/App.jsx
import LoginAuth from "./components/login-auth.jsx";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop";

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Background media (foto/video) */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />

      {/* ⬅️ Overlay full-page yang melakukan blur ke seluruh halaman */}
      <div className="fixed inset-0 -z-10 bg-black/35 backdrop-blur-xl" />

      {/* Layout 2 sisi */}
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_624px]">
        {/* Kiri: logo/tagline (konten di atas blur full-page) */}
        <section className="relative hidden lg:flex items-start justify-start">
          <div className="relative z-10 p-16">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-violet-400">GRA</span>
              <span className="text-5xl font-extrabold tracking-tight text-white">DIA</span>
            </div>
            <p className="mt-6 text-lg text-neutral-200">
              Manage Smarter,<br /> Achieve More
            </p>
          </div>
        </section>

        {/* Kanan: panel login fix 624px */}
        <aside className="relative flex items-center justify-center">
          <div className="my-10 w-[624px] rounded-2xl border border-white/10 bg-black/30 shadow-xl backdrop-blur-lg">
            <LoginAuth />
          </div>
        </aside>
      </div>
    </div>
  );
}
