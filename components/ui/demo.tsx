"use client";

import { Link } from "react-router-dom";
import AppFooter from "@/components/AppFooter";

export default function NotFoundGlitchPreview() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0D1B2A] text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight">
            404
          </h1>
          <span className="absolute -bottom-2 right-0 text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
            Lost In Space
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Oops! You wandered off the map.</h2>
        <p className="text-gray-400 max-w-md text-sm md:text-base mb-8">
          The page or coin you are looking for has floated away into the galaxy. Let's get you back to your savings dashboard!
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
        >
          Return to Mission Control
        </Link>
      </div>
      <AppFooter />
    </div>
  );
}
