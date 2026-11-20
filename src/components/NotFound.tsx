import { Link } from "react-router-dom";
import AppFooter from "./AppFooter";
import MascotCompanion from "./MascotCompanion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0D1B2A] text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-56 h-56 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-6 bg-[#e2e9fd] relative">
          <MascotCompanion state="error" showSpeechBubble speechText="Oops! This page wandered off the map 🗺️" className="w-full h-full" />
        </div>
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold mt-2 mb-3">Lost in space</h2>
        <p className="text-gray-400 max-w-md text-sm mb-8">
          The page you are looking for has floated away. Let's get you back to your savings journey!
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold shadow-lg"
        >
          Return to Mission Control
        </Link>
      </div>
      <AppFooter />
    </div>
  );
}
