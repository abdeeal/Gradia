import { useState } from "react";

export default function LoginAuth() {
  const [showPwd, setShowPwd] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="mt-[40px] px-[47px]">
        <h1 className="text-4xl font-semibold leading-tight">Welcome Back</h1>
        <p className="mt-2 text-sm text-neutral-200/90">
          Gradia helps you organize, Login and turn your self-management into real results.
        </p>
      </header>

      {/* Body */}
      <section className="mt-6 px-[47px] pb-10">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {/* Username */}
          <label className="block">
            <span className="mb-1.5 block text-xs text-neutral-200/90">
              Username
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-transparent px-4 py-3 focus-within:border-violet-400/70">
              <i className="ri-user-3-line text-[18px] opacity-80"></i>
              <input
                type="text"
                required
                placeholder="jane.doe"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-300/70"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-1.5 block text-xs text-neutral-200/90">
              Password
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-transparent px-4 py-3 focus-within:border-violet-400/70">
              <i className="ri-lock-password-line text-[18px] opacity-80"></i>
              <input
                type={showPwd ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-300/70"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="rounded-md p-1 hover:bg-white/10"
                aria-label="toggle password"
              >
                <i
                  className={`text-[18px] ${
                    showPwd ? "ri-eye-off-line" : "ri-eye-line"
                  }`}
                ></i>
              </button>
            </div>
          </label>

          <div className="flex justify-end">
            <a href="#" className="text-xs text-neutral-200/90 hover:text-white">
              Forgot Password?
            </a>
          </div>

          {/* Row tombol */}
          <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-white/20">
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-black/40 px-4 py-3 text-sm hover:bg-black/55"
            >
              <i className="ri-google-fill text-[18px]" /> Google
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-violet-600 px-4 py-3 text-sm font-medium hover:bg-violet-500"
            >
              <i className="ri-login-box-line text-[18px]" /> Log In
            </button>
          </div>

          <p className="text-center text-xs text-neutral-200/90">
            Don’t have an account?{" "}
            <a href="#" className="text-violet-300 hover:text-violet-200">
              Register here
            </a>
          </p>
        </form>

        {/* Footer kecil */}
        <p className="mt-8 text-center text-[11px] text-neutral-200/80">
          © 2025 Gradia. All rights reserved.
        </p>
      </section>
    </>
  );
}
