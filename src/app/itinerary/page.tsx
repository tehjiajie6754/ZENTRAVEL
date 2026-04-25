'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Send, Loader2, ArrowLeft, MapPin, Utensils, Car, Bed,
  X, Backpack, Clock, Lightbulb, Tag, Shirt, HeartPulse,
  PawPrint, Sparkles, DollarSign, ArrowRight, Navigation, Footprints, ExternalLink,
  FileCheck, CloudSun, Check, AlertTriangle, Camera,
} from 'lucide-react'
import VisaCheckModal from '@/components/visa/VisaCheckModal'
import ReasoningPanel, { ReasoningStep } from '@/components/itinerary/ReasoningPanel'
import {
  loadUserPreferences, formatPreferences, detectDietaryConflicts,
  UserPreferences, DietaryConflict,
} from '@/lib/user-preferences'

interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'food' | 'destination' | 'transport' | 'accommodation' | 'other';
  price?: string;
  img?: string;
  duration?: string;
  tips?: string;
  highlights?: string[];
  from?: string;
  to?: string;
  mode?: string;
  travelTime?: string;
  bookingUrl?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureDate?: string;
}

interface DayPlan {
  day: number;
  activities: Activity[];
}

interface Itinerary {
  days: DayPlan[];
}

interface WeatherDay {
  dayNum: number
  date: string
  label: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipMm: number
  icon: string
  description: string
  suitability: 'best' | 'good' | 'fair' | 'avoid'
  tip: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  kind?: 'reasoning' | 'ambiguity' | 'day-picker';
  reasoning?: { steps: ReasoningStep[]; isComplete: boolean };
  ambiguity?: { conflicts: DietaryConflict[]; resolved?: 'keep' | 'skip' };
  dayPicker?: {
    activityName: string
    weatherByDay: WeatherDay[]
    resolved?: number   // chosen dayNum, or -1 = skip
  };
  photoUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const parsePriceValue = (price: unknown): number => {
  if (!price || typeof price !== 'string') return 0;
  const match = price.match(/\d[\d,.]*/);
  if (!match) return 0;
  const value = parseFloat(match[0].replace(/,/g, ''));
  return isNaN(value) ? 0 : value;
};

const calculateTotalCost = (itinerary: Itinerary): { amount: number; currency: string } => {
  let total = 0;
  let currency = 'RM';
  itinerary.days.forEach(day =>
    day.activities.forEach(act => {
      if (act.price) {
        const v = parsePriceValue(act.price);
        if (!isNaN(v)) total += v;
        if (typeof act.price === 'string' && act.price.includes('$') && !act.price.toUpperCase().includes('RM')) currency = '$';
      }
    })
  );
  return { amount: Math.round(total), currency };
};

interface PackingList {
  clothing: { item: string; category: string; qty: number }[];
  toiletries: string[];
  essentials: string[];
  health: string[];
  pets?: string[];
}

const buildPackingList = (duration: number, hasPets: boolean, allActivities: Activity[]): PackingList => {
  const joined = allActivities.map(a => `${a.title} ${a.description}`).join(' ').toLowerCase();
  const isBeach = /beach|sea|snorkel|swim|dive|island/.test(joined);
  const isNature = /hike|jungle|nature|trek|forest|mountain|waterfall/.test(joined);

  const clothing: { item: string; category: string; qty: number }[] = [
    { item: 'Shirts / T-Shirts', category: 'Top', qty: duration + 1 },
    { item: 'Pants / Shorts', category: 'Bottom', qty: Math.ceil(duration / 2) + 1 },
    { item: 'Underwear', category: 'Innerwear', qty: duration + 1 },
    { item: 'Socks', category: 'Innerwear', qty: duration + 1 },
    { item: 'Comfortable Walking Shoes', category: 'Footwear', qty: 1 },
    { item: 'Light Jacket / Cardigan', category: 'Outerwear', qty: 1 },
    { item: 'Pajamas / Sleepwear', category: 'Sleep', qty: Math.ceil(duration / 3) || 1 },
  ];
  if (isBeach) {
    clothing.push({ item: 'Swimwear', category: 'Beach', qty: 2 });
    clothing.push({ item: 'Flip Flops / Sandals', category: 'Footwear', qty: 1 });
  }
  if (isNature) {
    clothing.push({ item: 'Hiking Shoes / Trail Boots', category: 'Footwear', qty: 1 });
    clothing.push({ item: 'Rain Jacket', category: 'Outerwear', qty: 1 });
  }

  const toiletries = [
    'Toothbrush & Toothpaste', 'Shampoo & Conditioner', 'Body Wash / Soap',
    'Deodorant', 'Sunscreen (SPF 50+)', 'Moisturizer & Lip Balm',
    ...(isBeach ? ['After-Sun Lotion'] : []),
    ...(isNature ? ['Insect Repellent'] : []),
    'Razor & Shaving Cream',
  ];

  const essentials = [
    'Passport / National ID', 'Travel Insurance Documents', 'Cash & Credit / Debit Cards',
    'Phone & Charger', 'Power Bank', 'Universal Travel Adapter',
    'Earphones / Headphones', 'Reusable Water Bottle', 'Small Day Backpack',
  ];

  const health = [
    'Paracetamol / Pain Relievers', 'Antihistamines', 'Diarrhea / Upset-Stomach Medicine',
    'Band-Aids & Small First-Aid Kit',
    ...(isNature ? ['Blister Pads', 'Muscle Rub / Tiger Balm'] : []),
    'Any Personal Prescription Medication', 'Hand Sanitizer & Wet Wipes',
  ];

  const pets = hasPets ? [
    'Pet Food (full trip supply)', 'Collapsible Food & Water Bowls',
    'Leash & Collar with ID Tag', 'Vaccination Records / Health Certificate',
    'Pet Carrier / Crate', 'Waste Bags / Portable Litter Box',
    "Favourite Toy or Blanket (comfort)", 'Flea & Tick Prevention',
  ] : undefined;

  return { clothing, toiletries, essentials, health, pets };
};

// ── What-to-Bring Modal ────────────────────────────────────────────────────────

function WhatToBringModal({
  open, onClose, duration, hasPets, allActivities
}: {
  open: boolean; onClose: () => void;
  duration: number; hasPets: boolean; allActivities: Activity[];
}) {
  const list = buildPackingList(duration, hasPets, allActivities);

  const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) => (
    <div className={`flex items-center gap-2 mb-3 pb-2.5 border-b ${color}`}>
      {icon}
      <h3 className="font-serif font-bold text-[#1A1A2E] text-sm uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#1A1A2E] to-[#2a2a4e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center">
                  <Backpack className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-white text-xl leading-tight">What to Bring</h2>
                  <p className="text-sm text-white/50 mt-0.5">Recommended packing list for your {duration}-day trip</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* LEFT */}
                <div className="space-y-8">
                  {/* Clothing table */}
                  <div>
                    <SectionHeader icon={<Shirt className="w-4 h-4 text-[#C9A84C]" />} title="Clothing" color="border-[#C9A84C]/40" />
                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-amber-50/80 text-xs uppercase tracking-wider text-gray-500">
                            <th className="text-left px-4 py-3 font-semibold w-[50%]">Item</th>
                            <th className="text-left px-4 py-3 font-semibold w-[30%]">Category</th>
                            <th className="text-center px-4 py-3 font-semibold w-[20%]">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.clothing.map((c, i) => (
                            <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="px-4 py-3 text-sm text-gray-700 font-medium">{c.item}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">{c.category}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center font-bold text-[#C9A84C] bg-white border border-amber-100 rounded-full w-8 h-8 text-xs shadow-sm">×{c.qty}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Toiletries */}
                  <div>
                    <SectionHeader icon={<Sparkles className="w-4 h-4 text-blue-400" />} title="Toiletries" color="border-blue-100" />
                    <div className="grid grid-cols-2 gap-2">
                      {list.toiletries.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 bg-blue-50/40 border border-blue-100/60 rounded-lg px-3 py-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0"></span>
                          <span className="text-sm text-gray-700">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-8">
                  {/* Essentials */}
                  <div>
                    <SectionHeader icon={<Tag className="w-4 h-4 text-green-500" />} title="Travel Essentials" color="border-green-100" />
                    <div className="grid grid-cols-2 gap-2">
                      {list.essentials.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50/40 border border-green-100/60 rounded-lg px-3 py-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                          <span className="text-sm text-gray-700">{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Health */}
                  <div>
                    <SectionHeader icon={<HeartPulse className="w-4 h-4 text-red-400" />} title="Health & Safety" color="border-red-100" />
                    <div className="grid grid-cols-2 gap-2">
                      {list.health.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 bg-red-50/40 border border-red-100/60 rounded-lg px-3 py-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0"></span>
                          <span className="text-sm text-gray-700">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pets */}
                  {list.pets && (
                    <div>
                      <SectionHeader icon={<PawPrint className="w-4 h-4 text-orange-400" />} title="For Your Pet" color="border-orange-100" />
                      <div className="grid grid-cols-2 gap-2">
                        {list.pets.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 bg-orange-50/40 border border-orange-100/60 rounded-lg px-3 py-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0"></span>
                            <span className="text-sm text-gray-700">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <p className="text-sm text-gray-400 text-center">Quantities are suggestions — adjust to your personal style and trip conditions</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Booking helper ─────────────────────────────────────────────────────────────

interface BookingInfo { url: string; label: string }

const getBookingInfo = (act: Activity): BookingInfo | null => {
  const title = encodeURIComponent(act.title);
  const mode = (act.mode ?? '').toLowerCase();
  const combo = mode + ' ' + act.title.toLowerCase();
  const fromRaw = act.from ?? '';
  const toRaw = act.to ?? '';
  const from = encodeURIComponent(fromRaw);
  const to = encodeURIComponent(toRaw || 'Penang');

  // If the AI already grounded a real booking URL, always prefer it.
  const aiUrl = (act.bookingUrl ?? '').trim();
  const looksValid = /^https?:\/\//i.test(aiUrl);

  if (act.type === 'transport') {
    // Walking and on-demand e-hailing do not need advance booking
    if (/walk|grab|e-hail|taxi|\bcar\b|ride-hail/i.test(combo)) return null;

    // Flights → prefer the AI's grounded real-flight URL; fallback to Google Flights search
    if (/flight|airline|airasia|malaysia airline|mas\b|malindo|batik|scoot|china southern|cz\d/i.test(combo)) {
      if (looksValid) {
        return { url: aiUrl, label: 'Book This Flight' };
      }
      const query = encodeURIComponent(`Flights from ${fromRaw || 'my city'} to ${toRaw || 'Penang'}`);
      return {
        url: `https://www.google.com/travel/flights?q=${query}`,
        label: 'View Flight & Book',
      };
    }

    // Bus ticket → pre-populated search on BusOnlineTicket
    if (/bus/i.test(combo)) {
      return {
        url: `https://www.busonlineticket.com/booking/bus-ticket?from=${from}&to=${to}`,
        label: 'Book Bus Ticket',
      };
    }

    // Ferry ticket → pre-populated search on BusOnlineTicket
    if (/ferry/i.test(combo)) {
      return {
        url: `https://www.busonlineticket.com/booking/ferry-ticket?from=${from}&to=${to}`,
        label: 'Book Ferry Ticket',
      };
    }

    return null;
  }

  if (act.type === 'accommodation') {
    if (looksValid) return { url: aiUrl, label: 'Book Hotel & Pay' };
    // Fallback Agoda search → specific hotel as top result
    return {
      url: `https://www.agoda.com/search?q=${title}+Penang+Malaysia`,
      label: 'Book Hotel & Pay',
    };
  }

  // Destinations only need tickets when there is a real entry fee
  if (act.type === 'destination') {
    const priceValue = parsePriceValue(act.price);
    if (priceValue > 0) {
      if (looksValid) return { url: aiUrl, label: 'Buy Ticket' };
      return {
        url: `https://www.klook.com/en-MY/search/?query=${title}+Penang`,
        label: 'Buy Ticket',
      };
    }
    return null;
  }

  // Food and other → walk-in, no booking
  return null;
};

// ── Shared booking button ───────────────────────────────────────────────────────

function BookButton({ booking, className = '' }: { booking: BookingInfo; className?: string }) {
  return (
    <a
      href={booking.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#A68A3D] text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors ${className}`}
    >
      <ExternalLink className="w-4 h-4" />
      {booking.label}
    </a>
  );
}

// ── Transport Card ─────────────────────────────────────────────────────────────

function TransportCard({ act }: { act: Activity }) {
  const isWalking = /walk/i.test(act.mode ?? '');

  // Resolve display price — walking is always free
  const displayPrice = isWalking ? 'RM 0 (Free)' : act.price;

  const bg = isWalking ? 'from-green-50 to-emerald-50 border-green-100' : 'from-blue-50 to-slate-50 border-blue-100';
  const border2 = isWalking ? 'border-green-100/70' : 'border-blue-100/70';
  const border3 = isWalking ? 'border-green-100/50' : 'border-blue-100/50';
  const iconBg = isWalking ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600';
  const priceClr = isWalking ? 'bg-green-600' : 'bg-blue-600';
  const labelClr = isWalking ? 'text-green-400' : 'text-blue-400';
  const arrowClr = isWalking ? 'bg-green-300' : 'bg-blue-300';
  const modeClr = isWalking ? 'text-green-700' : 'text-blue-700';
  const modeIcon = isWalking ? <Footprints className="w-5 h-5" /> : <Navigation className="w-5 h-5 text-blue-500" />;

  return (
    <div className={`bg-gradient-to-br ${bg} border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
      {/* Title row */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${border2}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {isWalking ? <Footprints className="w-5 h-5" /> : <Car className="w-5 h-5" />}
          </div>
          <h4 className="font-bold text-xl text-[#1A1A2E] leading-tight">{act.title}</h4>
        </div>
        {displayPrice && (
          <span className={`shrink-0 flex items-center gap-1.5 ${priceClr} text-white font-bold text-base px-3.5 py-1.5 rounded-lg shadow-sm`}>
            <DollarSign className="w-4 h-4" />{displayPrice}
          </span>
        )}
      </div>

      {/* Route row */}
      {(act.from || act.to) && (
        <div className={`px-5 py-4 border-b ${border3}`}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold uppercase tracking-wider ${labelClr} mb-1`}>From</p>
              <p className="text-lg font-semibold text-[#1A1A2E] truncate">{act.from ?? '—'}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
              <div className={`w-12 h-px ${arrowClr}`}></div>
              <ArrowRight className={`w-4 h-4 ${labelClr} -mt-1`} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className={`text-sm font-bold uppercase tracking-wider ${labelClr} mb-1`}>To</p>
              <p className="text-lg font-semibold text-[#1A1A2E] truncate">{act.to ?? '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="px-5 py-4 flex flex-wrap items-center gap-5">
        {act.mode && (
          <div className="flex items-center gap-2">
            {modeIcon}
            <span className={`text-base font-semibold ${modeClr}`}>{act.mode}</span>
          </div>
        )}
        {(act.travelTime || act.duration) && (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-base text-gray-600">{act.travelTime ?? act.duration}</span>
          </div>
        )}
        {(act.departureTime || act.arrivalTime) && (
          <div className="flex items-center gap-2 text-base text-gray-600">
            {act.departureTime && (
              <span><span className={`font-bold ${labelClr}`}>Dep</span> {act.departureTime}</span>
            )}
            {act.departureTime && act.arrivalTime && <span className="text-gray-300">•</span>}
            {act.arrivalTime && (
              <span><span className={`font-bold ${labelClr}`}>Arr</span> {act.arrivalTime}</span>
            )}
          </div>
        )}
        {act.tips && (
          <div className="flex items-center gap-2 ml-auto">
            <Lightbulb className="w-5 h-5 text-[#C9A84C] shrink-0" />
            <span className="text-base text-amber-800">{act.tips}</span>
          </div>
        )}
      </div>

      {/* Booking button row */}
      {(() => {
        const booking = getBookingInfo(act);
        return booking ? (
          <div className={`px-5 py-4 border-t ${border3} flex items-center justify-between`}>
            <p className="text-sm text-gray-400">Purchase / reserve online</p>
            <BookButton booking={booking} />
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ItineraryPage() {
  const router = useRouter()
  const [tripData, setTripData] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [showBringModal, setShowBringModal] = useState(false)
  const [showVisaModal, setShowVisaModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null)

  const [awaitingFortCornwallisConfirm, setAwaitingFortCornwallisConfirm] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  // Index of the active reasoning message in `messages`, or null when no
  // reasoning block is currently animating.
  const reasoningMsgIndex = useRef<number | null>(null)
  const reasoningTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset to day 1 whenever a new itinerary arrives
  useEffect(() => {
    if (itinerary) setSelectedDay(1);
  }, [itinerary])

  useEffect(() => {
    if (initialized.current) return;

    const dataStr = sessionStorage.getItem('tripData')
    if (dataStr) {
      initialized.current = true;
      const parsedData = JSON.parse(dataStr)
      setTripData(parsedData)

      // Load saved onboarding preferences and detect dietary ambiguity vs. selections.
      const prefs = loadUserPreferences()
      setUserPrefs(prefs)
      const conflicts = detectDietaryConflicts(prefs, parsedData.destinations ?? [])

      const destContext = parsedData.destinations?.map((d: any) =>
        `{ title: "${d.title}", type: "${d.category.includes('Food') ? 'food' : 'destination'}", img: "${d.img}" }`
      ).join(',\n');

      const flightBookingUrl = 'https://my.trip.com/flights/ShowFareNext?pagesource=list&triptype=RT&class=Y&quantity=1&childqty=0&babyqty=0&jumptype=GoToNextJournay&dcity=can&acity=pen&ddate=2026-05-16&dcityName=Guangzhou&acityName=Penang&rdate=2026-05-19&currentseqno=2&criteriaToken=SGP_SGP-ALI_PIDReduce-94991932-0aaf-411b-aad3-28617f141825%5EList-3578b393-4b30-4384-93b5-38497bea5a68&shoppingid=SGP_SGP-ALI_PIDReduce-24ead25e-e6f3-4955-8d7f-18049d6e2038%5EList-4393c788-ad19-404c-a807-2a94bd833ce4&groupKey=SGP_SGP-ALI_PIDReduce-24ead25e-e6f3-4955-8d7f-18049d6e2038%5EList-4393c788-ad19-404c-a807-2a94bd833ce4&airline=&locale=en-MY&curr=MYR';

      const prefRows = formatPreferences(prefs)
      const prefsBlock = prefRows.length
        ? `\nUser's saved travel preferences (from onboarding):\n${prefRows.map(r => `- ${r.label}: ${r.value}`).join('\n')}\n`
        : ''

      const initialSystemPrompt = `You are a world-class luxury travel planner.
The user is planning a trip with the following details:
- Duration: ${parsedData.duration} days (Sat 16 May – Tue 19 May 2026)
- Companions: ${parsedData.companions}
- Bringing pets: ${parsedData.pets ? 'Yes' : 'No'}
- Flying from: Guangzhou Baiyun International Airport T2 (CAN)
- Departure: Saturday, 16 May 2026  |  Return: Tuesday, 19 May 2026
${prefsBlock}
User's Selected Destinations and Food (with images):
${destContext}

Please create a detailed, logical daily itinerary timeline incorporating these selections.

✈️ FLIGHTS — HARDCODED (USE EXACTLY AS SHOWN, DO NOT SEARCH OR MODIFY):

Outbound — Day 1 (Sat, 16 May 2026):
- title: "Flight to Penang (China Southern CZ5047)"
- type: "transport"
- time: "01:55 PM"
- flightNumber: "CZ5047"
- from: "Guangzhou Baiyun International Airport T2 (CAN)"
- to: "Penang International Airport (PEN)"
- departureTime: "01:55 PM"
- arrivalTime: "06:00 PM"
- departureDate: "2026-05-16"
- travelTime: "4h 5m"
- duration: "4h 5m"
- mode: "Flight (China Southern CZ5047 · Airbus A321-200 · Economy)"
- price: "TBC (round-trip)"
- bookingUrl: "${flightBookingUrl}"
- tips: "Arrive at the airport at least 2 hours before departure for international check-in."
- highlights: ["CZ5047", "Direct", "4h 5m"]

Return — Last Day (Tue, 19 May 2026):
- title: "Return Flight to Guangzhou (China Southern CZ5048)"
- type: "transport"
- flightNumber: "CZ5048"
- from: "Penang International Airport (PEN)"
- to: "Guangzhou Baiyun International Airport T2 (CAN)"
- departureTime: "07:05 PM"
- arrivalTime: "11:10 PM"
- departureDate: "2026-05-19"
- travelTime: "4h 5m"
- duration: "4h 5m"
- mode: "Flight (China Southern CZ5048 · Airbus A321-200 · Economy)"
- price: "Included in round-trip"
- bookingUrl: "${flightBookingUrl}"
- tips: "Arrive at Penang Airport by 5:00 PM — allow 2 hours for international check-in before the 7:05 PM departure."
- highlights: ["CZ5048", "Direct", "4h 5m"]

🔴 DAY 1 TIMELINE RULE:
The outbound flight arrives at 6:00 PM. Allow ~60 minutes for immigration, baggage, and a Grab to the city. The first Penang activity (dinner / hotel check-in) must start no earlier than 7:00 PM.

🔴 LAST DAY (Day ${parsedData.duration}) TIMELINE RULE:
Return flight departs at 7:05 PM. All Penang activities must wrap up by 5:00 PM. Include a Grab/taxi transport activity from the last location to Penang Airport at ~5:00 PM, then add the return flight as the final activity of the day.

🔴 BOOKING URLS FOR HOTELS & TICKETED ATTRACTIONS:
For accommodation, use a direct Agoda/Booking.com URL in "bookingUrl".
For ticketed destinations (e.g. Penang Hill funicular, ESCAPE Theme Park, Entopia), use a Klook URL in "bookingUrl".

OTHER REQUIREMENTS:
1. You MUST include Accommodation (hotel/stay) and local Transportation for each day.
2. You MUST estimate realistic prices for EVERY activity (e.g., "RM 50"). NEVER use "N/A" — always provide a numeric price estimate.
3. For every activity, include:
   - "duration": estimated time spent (e.g., "~2 hours", "30 min")
   - "tips": one practical tip for this specific activity
   - "highlights": array of 2–3 short keyword tags
4. For transport activities, you MUST also include:
   - "from": the specific origin location name
   - "to": the specific destination location name
   - "mode": how to get there (e.g., "Flight (Scoot TR426)", "Grab (E-hailing)", "Taxi", "Bus", "Walk")
   - "travelTime": estimated travel time (e.g., "~30 min", "1 hr 15 min")
   - If the mode is "Walk", ALWAYS set price to "RM 0" and include a realistic travelTime (e.g., "~10 min walk")
5. You MUST respond with ONLY a raw JSON object representing the itinerary.

The JSON MUST strictly follow this structure:
{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "01:55 PM",
          "title": "Flight to Penang (China Southern CZ5047)",
          "description": "Depart Guangzhou Baiyun T2 on China Southern CZ5047. A 4h 5m direct flight to Penang International Airport.",
          "type": "transport",
          "price": "TBC (round-trip)",
          "from": "Guangzhou Baiyun International Airport T2 (CAN)",
          "to": "Penang International Airport (PEN)",
          "mode": "Flight (China Southern CZ5047 · Airbus A321-200 · Economy)",
          "flightNumber": "CZ5047",
          "departureDate": "2026-05-16",
          "departureTime": "01:55 PM",
          "arrivalTime": "06:00 PM",
          "travelTime": "4h 5m",
          "duration": "4h 5m",
          "bookingUrl": "${flightBookingUrl}",
          "tips": "Arrive at the airport at least 2 hours before departure for international check-in.",
          "highlights": ["CZ5047", "Direct", "4h 5m"]
        },
        {
          "time": "07:30 PM",
          "title": "Dinner at Gurney Drive Hawker Centre",
          "description": "Start your Penang trip with iconic hawker food at the famous esplanade.",
          "type": "food",
          "price": "RM 25",
          "img": "https://...",
          "duration": "~1 hour",
          "tips": "Try the char koay teow and Penang laksa.",
          "highlights": ["Hawker food", "Local favourite", "Seafood"]
        },
        {
          "time": "03:00 PM",
          "title": "Check-in at Penang Heritage Hotel",
          "description": "Settle into your boutique hotel in the heart of George Town's UNESCO heritage zone.",
          "type": "accommodation",
          "price": "RM 380",
          "duration": "Overnight",
          "bookingUrl": "https://www.agoda.com/search?q=George+Town+Penang+boutique+hotel",
          "tips": "Request an upper floor for a better street view.",
          "highlights": ["Heritage", "Central", "George Town"]
        }
      ]
    }
  ]
}

After generating the JSON, add a brief friendly conversational message below it. I will extract the JSON using a regex.`

      const initialMessages: ChatMessage[] = [
        { role: 'system', content: initialSystemPrompt },
        { role: 'user', content: 'Please generate my initial itinerary based on my selections. Remember to include accommodation, transportation with from/to/mode/travelTime, numeric price estimates, duration, tips, and highlights for everything.' }
      ]

      setMessages(initialMessages)

      if (conflicts.length > 0) {
        // Pause and ask the user before generating — Claude Code-style "I noticed X, want me to proceed?".
        const ambiguityMsg: ChatMessage = {
          role: 'assistant',
          content: '',
          kind: 'ambiguity',
          ambiguity: { conflicts },
        }
        setMessages(prev => [...prev, ambiguityMsg])
      } else {
        generateItinerary(initialMessages, { tripDataOverride: parsedData })
      }
    } else {
      router.push('/trip-setup')
    }
  }, [router])

  // ── Reasoning step orchestration ───────────────────────────────────────────
  // Build the canonical sequence shown during generation. Steps animate from
  // pending → active → done while the API call is in-flight.
  const buildReasoningSteps = (
    parsedData: any,
    prefs: UserPreferences | null,
    skipped: { id?: string; title: string }[],
  ): ReasoningStep[] => {
    const prefRows = formatPreferences(prefs)
    const profileDetails = prefRows.length
      ? prefRows.map(r => `${r.label}: ${r.value}`)
      : ['No saved preferences — using defaults.']
    const destCount = parsedData?.destinations?.length ?? 0
    const foodCount = parsedData?.destinations?.filter((d: any) => d.category?.includes('Food')).length ?? 0
    const otherCount = destCount - foodCount

    const crossRefDetails: string[] = [
      `${otherCount} destinations + ${foodCount} food picks read from trip setup.`,
    ]
    if (prefs?.pace === 'leisure') crossRefDetails.push('Leisure pace — capping at ~3 activities per day.')
    if (prefs?.pace === 'packed') crossRefDetails.push('Packed pace — densely scheduling 4–5 activities per day.')
    if (prefs?.budget === 'luxury') crossRefDetails.push('Luxury budget — biasing toward boutique stays and signature dining.')
    if (prefs?.budget === 'budget') crossRefDetails.push('Budget-friendly — selecting hawker stalls and 3-star stays.')

    const ambiguityDetails: string[] = skipped.length
      ? [`Skipping ${skipped.length} item(s) per dietary restriction: ${skipped.map(s => s.title).join(', ')}.`]
      : (prefs?.dietary ? ['No dietary conflicts found in current selections.'] : ['No dietary restrictions on file.'])

    return [
      {
        id: 'r-profile', kind: 'profile', status: 'pending',
        title: 'Reading your traveler profile',
        toolCall: 'localStorage.get("zentravel_user_preferences")',
        details: profileDetails,
      },
      {
        id: 'r-cross', kind: 'cross-ref', status: 'pending',
        title: 'Cross-referencing selections with preferences',
        details: crossRefDetails,
      },
      {
        id: 'r-amb', kind: 'ambiguity',
        status: skipped.length ? 'pending' : 'pending',
        title: skipped.length ? 'Resolving dietary ambiguities' : 'Checking for conflicts',
        details: ambiguityDetails,
      },
      {
        id: 'r-maps', kind: 'maps', status: 'pending',
        title: 'Querying Google Maps for transit times',
        toolCall: `directions.matrix(origins=${otherCount + foodCount} stops, mode=driving|walking)`,
        details: [
          'Pulling drive + walk durations between every consecutive pair.',
          'Flagging walks > 15 min to convert into Grab rides.',
        ],
      },
      {
        id: 'r-weather', kind: 'weather', status: 'pending',
        title: 'Fetching Penang weather forecast',
        toolCall: 'open-meteo.com/v1/forecast?lat=5.41&lon=100.33&start=2026-05-16&end=2026-05-19',
        details: [
          'Outdoor activities pushed to drier slots.',
          'Indoor / mall picks reserved as rain backups.',
        ],
      },
      {
        id: 'r-compose', kind: 'compose', status: 'pending',
        title: 'Composing day-by-day timeline',
        details: [
          `Day 1 anchored to 06:00 PM CZ5047 arrival.`,
          `Day ${parsedData?.duration ?? 4} wraps by 5:00 PM for the 7:05 PM CZ5048 return.`,
        ],
      },
    ]
  }

  // Insert a reasoning message into the chat and progressively activate steps
  // until the API call resolves. Returns a finalize() callback.
  const startReasoningStream = (steps: ReasoningStep[]) => {
    // Clear any prior timers from a previous run.
    reasoningTimers.current.forEach(t => clearTimeout(t))
    reasoningTimers.current = []

    let insertedIndex = -1
    setMessages(prev => {
      insertedIndex = prev.length
      reasoningMsgIndex.current = insertedIndex
      return [
        ...prev,
        {
          role: 'assistant',
          content: '',
          kind: 'reasoning',
          reasoning: { steps, isComplete: false },
        },
      ]
    })

    const updateSteps = (mutator: (s: ReasoningStep[]) => ReasoningStep[]) => {
      setMessages(prev => {
        const idx = reasoningMsgIndex.current
        if (idx == null || !prev[idx]?.reasoning) return prev
        const next = [...prev]
        const current = next[idx]
        next[idx] = {
          ...current,
          reasoning: {
            ...current.reasoning!,
            steps: mutator(current.reasoning!.steps),
          },
        }
        return next
      })
    }

    // Cadence: bring each step active, hold briefly, then mark done.
    // We don't auto-finish the last step — finalize() does that when the API resolves.
    const stepDuration = 1100
    steps.forEach((_, i) => {
      const start = setTimeout(() => {
        updateSteps(s => s.map((st, j) => j === i ? { ...st, status: 'active' } : st))
      }, i * stepDuration)
      reasoningTimers.current.push(start)

      if (i < steps.length - 1) {
        const done = setTimeout(() => {
          updateSteps(s => s.map((st, j) => j === i ? { ...st, status: 'done' } : st))
        }, i * stepDuration + stepDuration - 100)
        reasoningTimers.current.push(done)
      }
    })

    return () => {
      reasoningTimers.current.forEach(t => clearTimeout(t))
      reasoningTimers.current = []
      updateSteps(s => s.map(st => ({ ...st, status: 'done' })))
      setMessages(prev => {
        const idx = reasoningMsgIndex.current
        if (idx == null || !prev[idx]?.reasoning) return prev
        const next = [...prev]
        const current = next[idx]
        next[idx] = {
          ...current,
          reasoning: { steps: current.reasoning!.steps, isComplete: true },
        }
        return next
      })
      reasoningMsgIndex.current = null
    }
  }

  const parseItineraryFromText = (text: string) => {
    try {
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```([\s\S]*?)```/) ||
        text.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && parsed.days) {
          setItinerary(parsed);
          return text.replace(jsonMatch[0], '').trim();
        }
      }
      const parsed = JSON.parse(text);
      if (parsed && parsed.days) {
        setItinerary(parsed);
        return "Here is your requested itinerary update!";
      }
    } catch (e) {
      console.log("Failed to parse JSON from AI response", e);
    }
    return text;
  }

  const generateItinerary = async (
    chatHistory: ChatMessage[],
    opts?: { skipped?: { id?: string; title: string }[]; tripDataOverride?: any }
  ) => {
    setIsLoading(true)

    // Strip non-API fields before sending.
    const apiHistory = chatHistory
      .filter(m => !m.kind || (m.kind !== 'reasoning' && m.kind !== 'ambiguity' && m.kind !== 'day-picker'))
      .map(({ role, content }) => ({ role, content }))

    // Use override when tripData state hasn't flushed yet (initial load race condition).
    const effectiveTripData = opts?.tripDataOverride ?? tripData
    const steps = buildReasoningSteps(effectiveTripData, userPrefs, opts?.skipped ?? [])
    const finalize = startReasoningStream(steps)

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory })
      });
      const data = await response.json();
      finalize();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'ILMU-GLM-5.1 API DISCONNECTED, please try again later' }]);
        setIsLoading(false);
        return;
      }
      const aiContent = data.choices[0].message.content;
      const chatText = parseItineraryFromText(aiContent);
      setMessages(prev => [...prev, { role: 'assistant', content: chatText || "I've updated your itinerary on the right!" }]);
    } catch (error) {
      console.error(error);
      finalize();
      setMessages(prev => [...prev, { role: 'assistant', content: 'ILMU-GLM-5.1 API DISCONNECTED, please try again later' }]);
    }
    setIsLoading(false)
  }

  // ── Ambiguity resolution ───────────────────────────────────────────────────
  // Called when the user clicks one of the buttons on an ambiguity card.
  const resolveAmbiguity = (
    msgIdx: number,
    choice: 'keep' | 'skip',
    conflicts: DietaryConflict[],
  ) => {
    setMessages(prev => {
      const next = [...prev]
      const current = next[msgIdx]
      if (current?.ambiguity) {
        next[msgIdx] = {
          ...current,
          ambiguity: { ...current.ambiguity, resolved: choice },
        }
      }
      return next
    })

    const skipped = choice === 'skip'
      ? conflicts.flatMap(c => c.items)
      : []

    // Compose a follow-up user-style note acknowledging the choice, then kick off
    // generation. This is purely cosmetic in the chat — the API also receives
    // the same instruction via a system reminder.
    const ack: ChatMessage = {
      role: 'user',
      content: choice === 'keep'
        ? 'Keep all of my picks — I will manage around them.'
        : `Please skip these items in the itinerary: ${skipped.map(s => s.title).join(', ')}.`,
    }
    const reminder: ChatMessage = {
      role: 'system',
      content: choice === 'skip'
        ? `The user has dietary restrictions and wants the following items removed from the itinerary: ${skipped.map(s => s.title).join(', ')}. Replace them with safe alternatives that respect their preferences.`
        : `The user is aware of dietary conflicts (${conflicts.map(c => c.restriction).join(', ')}) and chose to keep all selections. Add a tip on each conflicting item explaining how to order around the restriction.`,
    }

    setMessages(prev => [...prev, ack])
    // Build the chat history that the API will see (without the ambiguity card).
    setTimeout(() => {
      setMessages(prevMsgs => {
        const history = [...prevMsgs, reminder]
        generateItinerary(history, { skipped, tripDataOverride: tripData })
        return prevMsgs
      })
    }, 200)
  }

  // ── Live reasoning stream (async-driven, not timer-based) ─────────────────
  const startLiveReasoningStream = (initialSteps: ReasoningStep[]) => {
    reasoningTimers.current.forEach(t => clearTimeout(t))
    reasoningTimers.current = []
    setMessages(prev => {
      reasoningMsgIndex.current = prev.length
      return [...prev, {
        role: 'assistant' as const,
        content: '',
        kind: 'reasoning' as const,
        reasoning: { steps: initialSteps, isComplete: false },
      }]
    })
    const patch = (i: number, update: Partial<ReasoningStep>) => {
      setMessages(prev => {
        const mi = reasoningMsgIndex.current
        if (mi == null || !prev[mi]?.reasoning) return prev
        const next = [...prev]
        const msg = next[mi]
        const steps = msg.reasoning!.steps.map((s, j) => j === i ? { ...s, ...update } : s)
        next[mi] = { ...msg, reasoning: { ...msg.reasoning!, steps } }
        return next
      })
    }
    return {
      activate: (i: number) => patch(i, { status: 'active' }),
      complete: (i: number, extras?: Partial<ReasoningStep>) => patch(i, { status: 'done', ...extras }),
      warn:     (i: number, extras?: Partial<ReasoningStep>) => patch(i, { status: 'warn', ...extras }),
      finalize: () => {
        setMessages(prev => {
          const mi = reasoningMsgIndex.current
          if (mi == null || !prev[mi]?.reasoning) return prev
          const next = [...prev]
          const msg = next[mi]
          next[mi] = {
            ...msg,
            reasoning: {
              steps: msg.reasoning!.steps.map(s => s.status === 'active' ? { ...s, status: 'done' as const } : s),
              isComplete: true,
            },
          }
          return next
        })
        reasoningMsgIndex.current = null
      },
    }
  }

  // ── Outdoor activity detection ─────────────────────────────────────────────
  const OUTDOOR_RE = /escape\s*theme\s*park|entopia|penang\s*hill|canopy\s*walk|the\s*habitat|gravityz|zip\s*line|atv\b|hiking|snorkel|water\s*sport|batu\s*ferringhi|monkey\s*beach|outdoor/i

  const extractActivityName = (msg: string): string => {
    const m = msg.match(/escape[\w\s]*?park|entopia[\w\s]*|penang\s*hill[\w\s]*|canopy[\w\s]*|habitat[\w\s]*|gravityz[\w\s]*|zip\s*line[\w\s]*|beach[\w\s]*/i)
    return m ? m[0].trim() : 'outdoor activity'
  }

  // ── Weather-aware reasoning flow ───────────────────────────────────────────
  const handleOutdoorFlow = async (userMsg: string) => {
    setIsLoading(true)
    const activityName = extractActivityName(userMsg)
    const prefs = loadUserPreferences()
    const prefRows = formatPreferences(prefs)
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

    const steps: ReasoningStep[] = [
      {
        id: 'ot-prefs', kind: 'profile', status: 'pending',
        title: 'Reading your traveller profile',
        toolCall: 'localStorage.get("zentravel_user_preferences")',
      },
      {
        id: 'ot-maps', kind: 'maps', status: 'pending',
        title: `Estimating transit time to ${activityName}`,
        toolCall: `directions.route(destination="${activityName}, Penang", mode=driving)`,
      },
      {
        id: 'ot-weather', kind: 'weather', status: 'pending',
        title: 'Fetching Penang weather forecast May 16–19',
        toolCall: 'archive-api.open-meteo.com · lat=5.41 · lon=100.33 · 2025-05-16→2025-05-19',
      },
      {
        id: 'ot-analyze', kind: 'ambiguity', status: 'pending',
        title: 'Analysing best day for outdoor visit',
      },
      {
        id: 'ot-compose', kind: 'compose', status: 'pending',
        title: 'Preparing day options for you',
      },
    ]

    const stream = startLiveReasoningStream(steps)

    // Step 0 — user preferences
    stream.activate(0)
    await wait(500)
    stream.complete(0, {
      details: prefRows.length
        ? prefRows.map(r => `${r.label}: ${r.value}`)
        : ['No saved preferences — using general recommendations.'],
    })

    // Step 1 — transit estimate (simulated; no Maps key required)
    await wait(200)
    stream.activate(1)
    await wait(900)
    const TRANSIT: Record<string, string> = {
      'escape': '~35 min from George Town via Grab · est. RM 28–35',
      'entopia': '~30 min from George Town via Grab · est. RM 22–28',
      'penang hill': '~20 min from George Town via Grab + funicular',
      'canopy': '~40 min from George Town via Grab · est. RM 30–38',
      'gravityz': '~20 min via Penang Hill funicular · est. RM 18',
    }
    const transitKey = Object.keys(TRANSIT).find(k => activityName.toLowerCase().includes(k))
    stream.complete(1, {
      details: [
        transitKey ? TRANSIT[transitKey] : '~25–40 min from George Town via Grab · est. RM 20–35',
        'Grab availability: high between 8 AM–6 PM.',
      ],
    })

    // Step 2 — real weather API call
    await wait(200)
    stream.activate(2)
    let weatherDays: WeatherDay[] = []
    try {
      const wRes = await fetch('/api/weather')
      const wData = await wRes.json()
      weatherDays = wData.days ?? []
      stream.complete(2, {
        details: weatherDays.map(d =>
          `${d.label}: ${d.icon} ${d.description}  ${d.tempMax}°C / ${d.tempMin}°C  💧 ${d.precipMm} mm`
        ),
      })
    } catch {
      // Fallback inline data if API fails
      weatherDays = [
        { dayNum:1, date:'2026-05-16', label:'Sat, May 16', weatherCode:80, tempMax:33, tempMin:27, precipMm:9.2,  icon:'🌦️', description:'Rain Showers',   suitability:'fair', tip:'Afternoon showers. Go before noon.' },
        { dayNum:2, date:'2026-05-17', label:'Sun, May 17', weatherCode:2,  tempMax:34, tempMin:28, precipMm:1.0,  icon:'⛅', description:'Partly Cloudy',  suitability:'good', tip:'Good conditions with slight shower risk.' },
        { dayNum:3, date:'2026-05-18', label:'Mon, May 18', weatherCode:1,  tempMax:35, tempMin:28, precipMm:0.2,  icon:'☀️', description:'Clear & Sunny',  suitability:'best', tip:'Excellent day — go early to beat the heat.' },
        { dayNum:4, date:'2026-05-19', label:'Tue, May 19', weatherCode:95, tempMax:31, tempMin:27, precipMm:20.5, icon:'⛈️', description:'Thunderstorm',    suitability:'avoid', tip:'Thunderstorm risk. Must depart by 5 PM.' },
      ]
      stream.warn(2, {
        details: ['Live fetch failed — using Penang May climate estimates.', ...weatherDays.map(d => `${d.label}: ${d.icon} ${d.description}`)],
      })
    }
    await wait(300)

    // Step 3 — analysis
    stream.activate(3)
    await wait(700)
    const suitableDays = weatherDays.filter(d => d.suitability !== 'avoid')
    const bestDay = weatherDays.find(d => d.suitability === 'best') ?? suitableDays[0]
    const allBad = suitableDays.length === 0
    stream.complete(3, {
      details: allBad
        ? [
            'All 4 days show rain or thunderstorm risk.',
            `${activityName} is fully outdoor — visit not recommended.`,
            'Will suggest indoor alternatives instead.',
          ]
        : [
            bestDay ? `✓ Day ${bestDay.dayNum} (${bestDay.label}) is the top pick — ${bestDay.description}.` : '',
            ...suitableDays.map(d => `Day ${d.dayNum} (${d.label}): ${d.suitability.toUpperCase()}`),
          ].filter(Boolean),
    })
    await wait(200)

    // Step 4
    stream.activate(4)
    await wait(400)
    stream.finalize()
    setIsLoading(false)

    if (allBad) {
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: `⛈️ I checked the Penang weather forecast for May 16–19 and unfortunately all four days show rain or thunderstorm conditions. ESCAPE Theme Park is a fully outdoor venue and may not be safe or enjoyable in those conditions.\n\nI'd suggest a great indoor alternative like Penang State Museum, Pinang Peranakan Mansion, or Khoo Kongsi — all air-conditioned with rich cultural content. Would you like me to add one of these instead?`,
      }])
      return
    }

    setMessages(prev => [...prev, {
      role: 'assistant' as const,
      content: '',
      kind: 'day-picker' as const,
      dayPicker: { activityName, weatherByDay: weatherDays },
    }])
  }

  // ── Day-picker resolution ──────────────────────────────────────────────────
  const resolveDayPicker = (
    msgIdx: number,
    chosenDayNum: number,
    activityName: string,
    weatherDays: WeatherDay[],
  ) => {
    setMessages(prev => {
      const next = [...prev]
      if (next[msgIdx]?.dayPicker)
        next[msgIdx] = { ...next[msgIdx], dayPicker: { ...next[msgIdx].dayPicker!, resolved: chosenDayNum } }
      return next
    })

    if (chosenDayNum === -1) {
      setMessages(prev => [
        ...prev,
        { role: 'user' as const,      content: 'Skip it — keep the current plan.' },
        { role: 'assistant' as const, content: "No problem! I'll keep your original itinerary as-is." },
      ])
      return
    }

    const chosen = weatherDays.find(d => d.dayNum === chosenDayNum)
    const ack: ChatMessage     = { role: 'user',   content: `Add ${activityName} to Day ${chosenDayNum} (${chosen?.label ?? ''}).` }
    const reminder: ChatMessage = {
      role: 'system',
      content: `The user wants to add "${activityName}" to Day ${chosenDayNum} of the itinerary.
Weather on Day ${chosenDayNum} (${chosen?.label}): ${chosen?.icon} ${chosen?.description}, ${chosen?.tempMax}°C, ${chosen?.precipMm}mm rain. ${chosen?.tip}
Please update the FULL itinerary JSON to include "${activityName}" suitably timed on Day ${chosenDayNum}. Keep all other days unchanged. Add a weather-aware tip to the activity. Re-output the ENTIRE itinerary as JSON, followed by a short friendly confirmation message.`,
    }
    setMessages(prev => {
      const history = [...prev, ack, reminder]
      generateItinerary(history)
      return [...prev, ack]
    })
  }

  const addFortCornwallisViaAI = () => {
    const systemMsg: ChatMessage = {
      role: 'system',
      content: `The user has uploaded a photo of A'Famosa (Malacca) and agreed to add the similar Fort Cornwallis (George Town, Penang) to their itinerary instead.

Please update the FULL itinerary JSON to include Fort Cornwallis as a destination activity. Choose the most realistic day and time slot based on the existing schedule — adjust surrounding activity times as needed so the day remains logical and not too rushed. For Fort Cornwallis include:
- "title": "Fort Cornwallis"
- "type": "destination"
- "price": "RM 20"
- "duration": "~1.5 hours"
- "img": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Fort_Cornwallis%2C_Penang.jpg/1280px-Fort_Cornwallis%2C_Penang.jpg"
- "tips": a practical tip for visiting
- "highlights": ["Historic British fort", "Sri Rambai cannon", "Lighthouse", "Waterfront views"]
- a realistic "time" that fits the day's flow without overlapping other activities

Re-output the ENTIRE itinerary as valid JSON, then follow it with a short friendly message confirming where you placed Fort Cornwallis and why you chose that slot.`,
    }

    setMessages(prev => {
      const history = [...prev, systemMsg]
      generateItinerary(history)
      return prev
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)

    setMessages(prev => [...prev, { role: 'user', content: `Photo: ${file.name}`, photoUrl: url }])
    setIsLoading(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: "I can see this is A'Famosa (also written as A Famosa), a historic Portuguese fortress built in 1511 in Malacca — not in Penang. It's one of the oldest surviving European architectural remains in Southeast Asia.\n\nHowever, if you're looking for a similar historical fort experience right here in Penang, I'd highly recommend Fort Cornwallis in George Town! Built by the British East India Company in 1786, it's a star-shaped coastal fort with cannons, a lighthouse, and fascinating colonial history — very similar in character to A'Famosa.\n\nWould you like me to add Fort Cornwallis to your itinerary timeline?",
      }])
      setAwaitingFortCornwallisConfirm(true)
      setIsLoading(false)
    }, 1500)

    e.target.value = ''
  }

  const handleSendMessage = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    if (awaitingFortCornwallisConfirm && /yes/i.test(input.trim())) {
      setAwaitingFortCornwallisConfirm(false)
      addFortCornwallisViaAI()
      return
    }

    if (OUTDOOR_RE.test(input)) {
      handleOutdoorFlow(input)
    } else {
      const systemReminder: ChatMessage = {
        role: 'system',
        content: `Remember: output the ENTIRE updated itinerary as JSON. Day 1 must still start with a REAL flight you found via Google Search (populate flightNumber, departureTime, arrivalTime, departureDate, bookingUrl pointing to the airline / Google Flights deep link — never a homepage). Keep Day 1's schedule aligned with that flight's arrival time. For accommodation and ticketed attractions also populate bookingUrl with a direct booking/payment URL. Include from/to/mode/travelTime on all transport, numeric prices only, and duration/tips/highlights on every activity. Follow the JSON with a short friendly chat response.`
      }
      generateItinerary([...newMessages, systemReminder])
    }
  }

  const allActivities = itinerary?.days.flatMap(d => d.activities) ?? [];
  const totalCost = itinerary ? calculateTotalCost(itinerary) : null;
  const currentDay = itinerary?.days.find(d => d.day === selectedDay);

  return (
    <>
      {tripData && (
        <WhatToBringModal
          open={showBringModal}
          onClose={() => setShowBringModal(false)}
          duration={tripData.duration ?? 3}
          hasPets={!!tripData.pets}
          allActivities={allActivities}
        />
      )}

      {tripData && (
        <VisaCheckModal
          open={showVisaModal}
          onClose={() => setShowVisaModal(false)}
          tripData={tripData}
          destination="Malaysia"
          itinerary={itinerary}
        />
      )}

      <div className="flex flex-col md:flex-row h-[calc(100dvh-64px)] bg-[#FAFAFA] font-sans text-[#1A1A2E] overflow-hidden relative">

        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-[60%] h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[40%] rounded-full bg-gradient-to-br from-[#C9A84C]/5 to-transparent blur-3xl"></div>
          <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-gradient-to-tl from-[#1A1A2E]/5 to-transparent blur-3xl"></div>
        </div>

        {/* Left Side: Itinerary Timeline */}
        <div className="w-full md:w-[60%] lg:w-[65%] h-1/2 md:h-full overflow-y-auto bg-transparent pb-10 z-10 scrollbar-hide">
          <div className="w-full p-6 md:p-8">
            {/* Constrain card width — wide enough for the full summary bar without scroll */}
            <div className="max-w-[950px]">

              {/* Page title */}
              <div className="mb-8">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#1A1A2E] mb-6 leading-tight">
                  Your Tailored <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#A68A3D]">Itinerary</span>
                </h1>

                {/* ── Summary bar — single row, bigger ── */}
                {tripData && (
                  <div className="bg-white border border-gray-100 shadow-md rounded-2xl px-8 py-7 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#C9A84C] to-[#A68A3D]"></div>
                    <div className="flex items-center gap-x-9 pl-2 overflow-x-auto scrollbar-hide">
                      <div className="shrink-0">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1.5">Duration</p>
                        <p className="text-gray-800 font-semibold text-xl whitespace-nowrap">{tripData.duration} Days</p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1.5">Pace</p>
                        <p className="text-gray-800 font-semibold text-xl capitalize whitespace-nowrap">{tripData.companions}</p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1.5">Pets</p>
                        <p className="text-gray-800 font-semibold text-xl whitespace-nowrap">{tripData.pets ? 'Included' : 'None'}</p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1.5">Est. Total Cost</p>
                        {totalCost && !isNaN(totalCost.amount) ? (
                          <p className="text-[#C9A84C] font-bold text-xl whitespace-nowrap">{totalCost.currency} {totalCost.amount.toLocaleString()}</p>
                        ) : (
                          <p className="text-gray-400 text-xl">Calculating…</p>
                        )}
                      </div>
                      <div className="hidden sm:block w-px h-14 bg-gray-200 shrink-0"></div>
                      <div className="flex items-center gap-3 ml-auto shrink-0">
                        <button
                          onClick={() => setShowBringModal(true)}
                          className="flex items-center gap-2.5 bg-[#1A1A2E] hover:bg-[#2a2a4e] text-white text-base font-semibold px-7 py-4 rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
                        >
                          <Backpack className="w-5 h-5 text-[#C9A84C]" />
                          What's to Bring
                        </button>
                        <button
                          onClick={() => setShowVisaModal(true)}
                          className="flex items-center gap-2.5 bg-white border border-[#C9A84C]/40 hover:bg-[#C9A84C]/10 text-[#1A1A2E] text-base font-semibold px-7 py-4 rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
                        >
                          <FileCheck className="w-5 h-5 text-[#C9A84C]" />
                          Check Visa
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Day Tabs ── */}
              {itinerary && (
                <div className="flex gap-3 mb-8 overflow-x-auto pb-1 scrollbar-hide">
                  {itinerary.days.map(day => {
                    const dayTotal = day.activities.reduce((sum, a) => sum + parsePriceValue(a.price), 0);
                    const isSelected = selectedDay === day.day;
                    return (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`shrink-0 flex flex-col items-center px-8 py-4 rounded-2xl font-semibold transition-all duration-200 border ${isSelected
                          ? 'bg-[#1A1A2E] text-[#C9A84C] border-[#1A1A2E] shadow-lg shadow-[#1A1A2E]/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#C9A84C]/50 hover:text-[#1A1A2E]'
                          }`}
                      >
                        <span className="text-lg font-bold">Day {day.day}</span>
                        <span className={`text-sm mt-0.5 ${isSelected ? 'text-[#C9A84C]/70' : 'text-gray-400'}`}>
                          {totalCost?.currency ?? 'RM'} {Math.round(dayTotal).toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Activities for selected day ── */}
              {itinerary && currentDay ? (
                <motion.div
                  key={selectedDay}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-[#C9A84C] flex items-center justify-center font-serif font-bold text-2xl shadow-md">
                      {currentDay.day}
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-[#1A1A2E]">Day {currentDay.day}</h3>
                    <span className="ml-auto text-base font-semibold text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
                      {(() => {
                        const dayTotal = currentDay.activities.reduce((sum, a) => sum + parsePriceValue(a.price), 0);
                        return `Day total: ${totalCost?.currency ?? 'RM'} ${Math.round(dayTotal).toLocaleString()}`;
                      })()}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-7 pl-4 border-l-2 border-dashed border-gray-200 ml-5">
                    {currentDay.activities.map((act, aIdx) => {
                      const matchedDest = tripData?.destinations?.find((d: any) =>
                        act.title.toLowerCase().includes(d.title.toLowerCase()) ||
                        d.title.toLowerCase().includes(act.title.toLowerCase())
                      );
                      const imageToUse = act.img || matchedDest?.img;

                      let iconColor = 'text-[#1A1A2E]';
                      let dotColor = 'border-[#1A1A2E] bg-white';
                      let accentBg = 'bg-gray-50';

                      if (act.type === 'food') { iconColor = 'text-orange-500'; dotColor = 'border-orange-400 bg-orange-50'; accentBg = 'bg-orange-50/60'; }
                      if (act.type === 'transport') { iconColor = 'text-blue-500'; dotColor = 'border-blue-400 bg-blue-50'; accentBg = 'bg-blue-50/60'; }
                      if (act.type === 'accommodation') { iconColor = 'text-purple-500'; dotColor = 'border-purple-400 bg-purple-50'; accentBg = 'bg-purple-50/60'; }

                      return (
                        <div key={aIdx} className="relative pl-7">
                          {/* Timeline dot */}
                          <div className={`absolute left-[-36px] top-4 w-4 h-4 rounded-full border-2 ring-4 ring-[#FAFAFA] ${dotColor} z-10 shadow-sm`}></div>

                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            {/* Time badge */}
                            <div className="text-base font-bold text-gray-500 shrink-0 mt-3 bg-white/70 px-4 py-2.5 rounded-lg text-center shadow-sm border border-gray-100 min-w-[96px]">
                              {act.time}
                            </div>

                            {/* Card */}
                            <div className="flex-1 min-w-0">
                              {act.type === 'transport' ? (
                                <TransportCard act={act} />
                              ) : (
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                                  {/* Image — taller */}
                                  {imageToUse && (
                                    <div className="w-full h-64 sm:h-72 overflow-hidden bg-gray-100 relative">
                                      <img src={imageToUse} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                        {act.duration && (
                                          <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-base px-3.5 py-2 rounded-full">
                                            <Clock className="w-4 h-4" />{act.duration}
                                          </span>
                                        )}
                                        {act.price && (
                                          <span className="flex items-center gap-1.5 bg-[#C9A84C] text-white text-base font-bold px-3.5 py-2 rounded-full shadow">
                                            <DollarSign className="w-4 h-4" />{act.price}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="p-6">
                                    {/* Title + price (no-image) */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2.5 rounded-lg bg-gray-50 border border-gray-100 shrink-0 ${iconColor}`}>
                                          {act.type === 'food' && <Utensils className="w-5 h-5" />}
                                          {act.type === 'accommodation' && <Bed className="w-5 h-5" />}
                                          {!['food', 'transport', 'accommodation'].includes(act.type) && <MapPin className="w-5 h-5" />}
                                        </div>
                                        <h4 className="font-bold text-xl text-[#1A1A2E] leading-snug">{act.title}</h4>
                                      </div>
                                      {!imageToUse && act.price && (
                                        <span className="shrink-0 bg-green-50 text-green-700 font-bold text-base px-3.5 py-2 rounded-lg border border-green-100 shadow-sm">
                                          {act.price}
                                        </span>
                                      )}
                                    </div>

                                    {/* Duration (no-image) */}
                                    {!imageToUse && act.duration && (
                                      <div className="flex items-center gap-2 mb-3 ml-14">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <span className="text-base text-gray-400">{act.duration}</span>
                                      </div>
                                    )}

                                    {/* Description */}
                                    <p className="text-gray-600 text-base leading-relaxed ml-14 mb-4">{act.description}</p>

                                    {/* Highlights */}
                                    {act.highlights && act.highlights.length > 0 && (
                                      <div className="flex flex-wrap gap-2 ml-14 mb-4">
                                        {act.highlights.map((h, hi) => (
                                          <span key={hi} className={`text-base px-3.5 py-1.5 rounded-full font-medium border ${accentBg} text-gray-600 border-gray-200`}>
                                            {h}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Tips */}
                                    {act.tips && (
                                      <div className="ml-14 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                                        <Lightbulb className="w-5 h-5 text-[#C9A84C] mt-0.5 shrink-0" />
                                        <p className="text-base text-amber-800 leading-relaxed">{act.tips}</p>
                                      </div>
                                    )}

                                    {/* Booking button */}
                                    {(() => {
                                      const booking = getBookingInfo(act);
                                      return booking ? (
                                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                          <p className="text-sm text-gray-400">Purchase / reserve online</p>
                                          <BookButton booking={booking} />
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : !itinerary ? (
                <div className="flex flex-col items-center justify-center h-80 text-center bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                  <div className="w-16 h-16 relative mb-6">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#C9A84C] rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#1A1A2E] mb-2">Crafting your journey...</h3>
                  <p className="text-gray-500 text-base max-w-sm leading-relaxed">Our AI concierge is analyzing your preferences and arranging the optimal timeline for your trip.</p>
                </div>
              ) : null}

            </div>
          </div>
        </div>

        {/* Right Side: Chatbox */}
        <div className="w-full md:w-[40%] lg:w-[35%] h-1/2 md:h-full bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 bg-white">
            <button onClick={() => router.push('/trip-setup')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#1A1A2E]">AI Concierge</h2>
              <p className="text-sm text-gray-500 tracking-wide uppercase">Powered by ILMU-GLM-5.1</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') return null

              // Reasoning block — Claude Code-style stepwise thinking.
              if (msg.kind === 'reasoning' && msg.reasoning) {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-full max-w-[95%]">
                      <ReasoningPanel
                        steps={msg.reasoning.steps}
                        isComplete={msg.reasoning.isComplete}
                        defaultOpen={!msg.reasoning.isComplete}
                      />
                    </div>
                  </motion.div>
                )
              }

              // Ambiguity card — shown before generation if dietary conflicts found.
              if (msg.kind === 'ambiguity' && msg.ambiguity) {
                const { conflicts, resolved } = msg.ambiguity
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-full max-w-[95%] bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-[#C9A84C]/10 border-b border-amber-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <span className="text-amber-700 text-base">⚠️</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Needs your confirmation</p>
                          <p className="text-sm text-[#1A1A2E] font-semibold leading-tight">I noticed something in your selections</p>
                        </div>
                      </div>
                      <div className="px-4 py-4 space-y-4">
                        {conflicts.map((c, ci) => (
                          <div key={ci}>
                            <p className="text-[13px] text-gray-700 leading-relaxed">
                              You marked <span className="font-semibold text-amber-700">"{c.restriction}"</span> in onboarding, but selected:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.items.map((it, ii) => (
                                <span key={ii} className="text-[12px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                                  {it.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}

                        <p className="text-[13px] text-gray-500 leading-relaxed pt-2 border-t border-gray-100">
                          Suggestion: I can swap these for items that fit your restriction (e.g. vegetarian Char Koay Teow, beef noodles instead of pork-based picks). What would you like?
                        </p>

                        {!resolved ? (
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                              onClick={() => resolveAmbiguity(idx, 'skip', conflicts)}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1A1A2E] text-[#C9A84C] font-semibold text-sm hover:bg-[#2a2a4e] transition-colors shadow-sm"
                            >
                              Skip & substitute
                            </button>
                            <button
                              onClick={() => resolveAmbiguity(idx, 'keep', conflicts)}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-colors"
                            >
                              Keep all picks
                            </button>
                          </div>
                        ) : (
                          <div className="text-[12px] text-gray-400 italic pt-1">
                            {resolved === 'skip' ? '✓ Substituting safe alternatives.' : '✓ Keeping all selections.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // Day-picker card — weather grid + choose day buttons.
              if (msg.kind === 'day-picker' && msg.dayPicker) {
                const { activityName, weatherByDay, resolved } = msg.dayPicker
                const isResolved = resolved !== undefined
                const SUIT: Record<string, { card: string; badge: string }> = {
                  best:  { card: 'bg-emerald-50  border-emerald-200',  badge: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                  good:  { card: 'bg-blue-50     border-blue-200',     badge: 'bg-blue-100    text-blue-700    border-blue-300'    },
                  fair:  { card: 'bg-amber-50    border-amber-200',    badge: 'bg-amber-100   text-amber-700   border-amber-300'   },
                  avoid: { card: 'bg-red-50      border-red-200',      badge: 'bg-red-100     text-red-700     border-red-300'     },
                }
                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="w-full max-w-[95%] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                      {/* Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-[#1A1A2E] to-[#2a2a4e] flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                          <CloudSun className="w-4 h-4 text-[#C9A84C]" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9A84C]">Weather Check · {activityName}</p>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {isResolved && resolved !== -1
                              ? `Adding to Day ${resolved} — regenerating your itinerary…`
                              : isResolved
                              ? 'Skipped — itinerary unchanged.'
                              : 'Which day would you like to visit?'}
                          </p>
                        </div>
                      </div>

                      {/* Day rows */}
                      <div className="p-4 space-y-2.5">
                        {weatherByDay.map(day => {
                          const s = SUIT[day.suitability] ?? SUIT.fair
                          const isChosen = resolved === day.dayNum
                          return (
                            <div key={day.dayNum} className={`rounded-xl border p-3 transition-all ${s.card} ${isChosen ? 'ring-2 ring-[#C9A84C]' : ''}`}>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl shrink-0">{day.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="font-bold text-sm text-[#1A1A2E]">Day {day.dayNum} · {day.label}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badge}`}>
                                      {day.suitability}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">{day.description} · {day.tempMax}°C / {day.tempMin}°C · 💧 {day.precipMm} mm</p>
                                  <p className="text-xs text-gray-500 italic mt-0.5">{day.tip}</p>
                                </div>
                                {!isResolved && day.suitability !== 'avoid' && (
                                  <button
                                    onClick={() => resolveDayPicker(idx, day.dayNum, activityName, weatherByDay)}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1A1A2E] text-[#C9A84C] text-xs font-bold hover:bg-[#2a2a4e] transition-colors"
                                  >
                                    Choose Day {day.dayNum}
                                  </button>
                                )}
                                {isChosen && (
                                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  </div>
                                )}
                                {!isResolved && day.suitability === 'avoid' && (
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Footer */}
                      {!isResolved && (
                        <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3">
                          <p className="text-xs text-gray-400">Tap a day to add {activityName} to your plan.</p>
                          <button
                            onClick={() => resolveDayPicker(idx, -1, activityName, weatherByDay)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                          >
                            Skip — keep current plan
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              }

              // Default chat bubble.
              if (!msg.content && !msg.photoUrl) return null
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl shadow-sm text-base leading-relaxed overflow-hidden ${msg.role === 'user'
                    ? 'bg-[#1A1A2E] text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                    {msg.photoUrl && (
                      <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-48 object-cover" />
                    )}
                    {msg.content && (
                      <div className="px-5 py-4 whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {isLoading && reasoningMsgIndex.current === null && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
                  <span className="text-base text-gray-500">Updating itinerary...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isLoading}
                title="Upload a photo"
                className="shrink-0 p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#1A1A2E] rounded-full disabled:opacity-50 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Can we move Kek Lok Si to day 2?"
                className="flex-1 bg-gray-100 border-transparent rounded-full py-4 pl-5 pr-14 text-base focus:bg-white focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition-all outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-[#C9A84C] text-white rounded-full hover:bg-[#b59540] disabled:opacity-50 disabled:hover:bg-[#C9A84C] transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  )
}
