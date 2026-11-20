"use client"

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  GraduationCap,
  ShieldAlert,
  TrendingUp,
  FileText,
  Coins,
  AlertTriangle,
  Award,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

export interface ClippingItem {
  tempId: number;
  source: string;
  tag: string;
  headline: string;
  excerpt: string;
  citation: string;
  iconType: 'newspaper' | 'academic' | 'shield' | 'trending' | 'file' | 'coins' | 'alert' | 'award';
}

const clippings: ClippingItem[] = [
  {
    tempId: 0,
    source: "The Economic Times",
    tag: "National Survey",
    headline: "76% of Indian Adults Lack Basic Financial Literacy",
    excerpt: "Without early education before age 14, youth step into the UPI era unprepared for predatory scams, impulse buying, and compounding interest.",
    citation: "National Financial Capability Study",
    iconType: "newspaper"
  },
  {
    tempId: 1,
    source: "University of Cambridge",
    tag: "Child Psychology",
    headline: "Core Money Habits Form between Ages 7-10",
    excerpt: "Delayed gratification, planning, and spending behaviors are solidified between ages 7-10. Waiting for college to teach money is too late.",
    citation: "Child Habit Formation Research",
    iconType: "academic"
  },
  {
    tempId: 2,
    source: "Reserve Bank of India (RBI)",
    tag: "Cyber Alert",
    headline: "Over 55% of Digital Frauds Target Inexperienced Mobile Users",
    excerpt: "Children and tweens frequently fall victim to deceptive 'Free Robux/Coins' QR phishing links and hidden auto-debit subscriptions.",
    citation: "RBI Consumer Protection Annual Report",
    iconType: "shield"
  },
  {
    tempId: 3,
    source: "World Economic Forum",
    tag: "21st-Century Skills",
    headline: "Financial Literacy Is as Vital as Reading or Coding",
    excerpt: "In a cashless digital economy, learning to manage digital balances, avoid deceptive dark patterns, and budget early is a core survival skill.",
    citation: "WEF Future of Education & Work",
    iconType: "trending"
  },
  {
    tempId: 4,
    source: "National Education Policy (NEP)",
    tag: "Policy Mandate",
    headline: "NEP Mandates Experiential Financial Literacy in Schools",
    excerpt: "Textbook theory fails. Schools are urged to adopt gamified simulations, pocket money budgeting, and digital hygiene to prepare students.",
    citation: "Ministry of Education • NEP Curriculum Framework",
    iconType: "file"
  },
  {
    tempId: 5,
    source: "Mint / HT Media",
    tag: "Youth Economics",
    headline: "Pocket Money Without Guidance Fosters Impulse Spending",
    excerpt: "Giving allowances without a Needs vs. Wants framework creates spending sprees. Gamified budgeting builds lifelong savers.",
    citation: "Mint Personal Wealth Analysis",
    iconType: "coins"
  },
  {
    tempId: 6,
    source: "Times of India Cyber Cell",
    tag: "Gaming Trap",
    headline: "45% Rise in Accidental In-Game Purchases by Children",
    excerpt: "Dark UX patterns and one-tap payment integrations drain family bank accounts before children realize real money was spent.",
    citation: "Metro Cyber Crime Directorate",
    iconType: "alert"
  },
  {
    tempId: 7,
    source: "OECD / PISA Assessment",
    tag: "Global Benchmark",
    headline: "Teens with Early Money Training Save 4x More as Adults",
    excerpt: "Students who practice budgeting and trade-offs before high school consistently outperform peers in long-term wealth accumulation.",
    citation: "OECD PISA Financial Literacy Ranking",
    iconType: "award"
  },
  {
    tempId: 8,
    source: "Forbes India",
    tag: "Future Wealth",
    headline: "The Power of Compound Interest Starts in Childhood",
    excerpt: "A child who understands compound growth and delayed gratification at age 10 builds a lifetime compounding advantage.",
    citation: "Forbes Youth Wealth & Economics",
    iconType: "trending"
  },
  {
    tempId: 9,
    source: "National Payments Corp of India",
    tag: "UPI Safety",
    headline: "UPI PIN Rule: PIN Is Only to Send Money, Never to Receive",
    excerpt: "Thousands of students lose money every month believing PINs are required to receive cashbacks or lottery winnings.",
    citation: "NPCI Digital Payments Safety Campaign",
    iconType: "shield"
  }
];

function getClippingIcon(type: ClippingItem['iconType']) {
  switch (type) {
    case 'newspaper': return Newspaper;
    case 'academic': return GraduationCap;
    case 'shield': return ShieldAlert;
    case 'trending': return TrendingUp;
    case 'file': return FileText;
    case 'coins': return Coins;
    case 'alert': return AlertTriangle;
    case 'award': return Award;
    default: return Newspaper;
  }
}

interface ClippingCardProps {
  position: number;
  clipping: ClippingItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const ClippingCard: React.FC<ClippingCardProps> = ({
  position,
  clipping,
  handleMove,
  cardSize
}) => {
  const isCenter = position === 0;
  const IconComponent = getClippingIcon(clipping.iconType);

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 sm:p-7 transition-all duration-500 ease-in-out select-none",
        isCenter
          ? "z-10 bg-gradient-to-br from-[#122B48] via-[#0E2238] to-[#0A1726] text-white border-[#0BBFBF] shadow-[0_16px_40px_rgba(11,191,191,0.35)] ring-1 ring-[#0BBFBF]/40"
          : "z-0 bg-[#0B1728]/95 text-gray-200 border-[#1E3448] hover:border-[#0BBFBF]/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(11,191,191,0.25)" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-[#1E3448]"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />

      <div className="flex flex-col h-full justify-between">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border",
              isCenter
                ? "bg-[#0BBFBF] text-[#0A1828] border-[#0BBFBF]"
                : "bg-[#0BBFBF]/10 text-[#0BBFBF] border-[#0BBFBF]/30"
            )}>
              <IconComponent className="w-3.5 h-3.5" />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{clipping.source}</span>
            </span>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
              isCenter ? "bg-white/15 text-white" : "bg-white/5 text-gray-400"
            )}>
              {clipping.tag}
            </span>
          </div>

          {/* Headline */}
          <h3 className={cn(
            "font-heading font-black text-sm sm:text-base leading-snug tracking-tight mb-2",
            isCenter ? "text-white" : "text-gray-100"
          )}>
            &ldquo;{clipping.headline}&rdquo;
          </h3>

          {/* Excerpt */}
          <p className={cn(
            "text-xs leading-relaxed font-normal",
            isCenter ? "text-cyan-100/90" : "text-gray-400"
          )}>
            {clipping.excerpt}
          </p>
        </div>

        {/* Footer Citation */}
        <div className={cn(
          "pt-3 border-t text-[11px] font-medium flex items-center justify-between mt-2",
          isCenter ? "border-white/20 text-[#0BBFBF]" : "border-white/10 text-gray-400"
        )}>
          <span className="truncate max-w-[200px] sm:max-w-[240px]">
            {clipping.citation}
          </span>
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        </div>
      </div>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
  const [clippingsList, setClippingsList] = useState(clippings);

  const handleMove = (steps: number) => {
    const newList = [...clippingsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setClippingsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-transparent"
      style={{ height: 560 }}
    >
      {clippingsList.map((clipping, index) => {
        const position = clippingsList.length % 2
          ? index - (clippingsList.length + 1) / 2
          : index - clippingsList.length / 2;
        return (
          <ClippingCard
            key={clipping.tempId}
            clipping={clipping}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-xl transition-all rounded-full cursor-pointer",
            "bg-[#0F2744] border-2 border-[#1E3448] text-white hover:border-[#0BBFBF] hover:bg-[#0BBFBF] hover:text-[#0A1828]",
            "shadow-md active:scale-95"
          )}
          aria-label="Previous article"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-xl transition-all rounded-full cursor-pointer",
            "bg-[#0F2744] border-2 border-[#1E3448] text-white hover:border-[#0BBFBF] hover:bg-[#0BBFBF] hover:text-[#0A1828]",
            "shadow-md active:scale-95"
          )}
          aria-label="Next article"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
