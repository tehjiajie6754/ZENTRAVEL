'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Search, ChevronLeft, Plane, AlertTriangle, X, ExternalLink, Shield, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the map component so it only loads on the client
// Leaflet requires the window object which isn't available during SSR
const PenangInteractiveMap = dynamic(
  () => import('@/components/map/PenangInteractiveMap'),
  { ssr: false }
)

// --- Types ---
interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: { name: string }
}

interface ConflictData {
  country: string
  countryCode: string
  articles: NewsArticle[]
  aiAnalysis: string
  recommended: boolean
  safetyLevel: string
  lastUpdated: string
}

interface ConflictCountry {
  id: string
  code: string
  name: string
}

// --- Conflict Advisory Modal ---
const ConflictAdvisoryModal = ({ country, onClose }: { country: ConflictCountry; onClose: () => void }) => {
  const [data, setData] = useState<ConflictData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/conflict-news?country=${encodeURIComponent(country.name)}&code=${country.code}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError('ILMU-GLM-5.1 API DISCONNECTED, please try again later')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [country])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return '' }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,46,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl flex flex-col"
        style={{ background: '#1A1A2E', border: '1px solid rgba(201,168,76,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start gap-4 p-6 pb-4 flex-shrink-0"
          style={{
            borderBottom: '1px solid rgba(232,228,223,0.1)',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 100%)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: '#C9A84C' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C9A84C' }}>
                Active Conflict Zone
              </span>
              {/* Small red dot — universally understood live/active status */}
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: '#e74c3c' }} />
            </div>
            <div className="flex items-center gap-3">
              <img
                src={`https://flagcdn.com/w40/${country.code}.png`}
                alt={`${country.name} flag`}
                className="w-8 h-6 object-cover rounded shadow"
              />
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {country.name}
              </h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(232,228,223,0.45)' }}>
              {data ? `Last updated: ${formatDate(data.lastUpdated)}` : 'Loading latest intelligence…'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: 'rgba(232,228,223,0.5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,228,223,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
              <p className="text-sm" style={{ color: 'rgba(232,228,223,0.4)' }}>
                Fetching latest news &amp; AI analysis…
              </p>
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(232,228,223,0.05)', border: '1px solid rgba(232,228,223,0.12)' }}
            >
              <p className="text-sm" style={{ color: '#E8E4DF' }}>{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* AI Safety Analysis */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" style={{ color: '#C9A84C' }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C9A84C' }}>
                    Zen Travel AI Advisory
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.15)',
                      color: '#C9A84C',
                      border: '1px solid rgba(201,168,76,0.4)',
                    }}
                  >
                    ⚠ NOT RECOMMENDED FOR TRAVEL
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'rgba(232,228,223,0.45)' }}>
                    Safety Level: {data.safetyLevel}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#E8E4DF' }}>
                  {data.aiAnalysis}
                </p>
              </div>

              {/* News Feed */}
              <div>
                <h3
                  className="text-xs font-bold tracking-widest uppercase mb-3"
                  style={{ color: 'rgba(232,228,223,0.35)' }}
                >
                  Recent News
                </h3>
                <div className="space-y-3">
                  {data.articles.map((article, i) => (
                    <motion.a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3 p-4 rounded-xl group cursor-pointer block"
                      style={{
                        background: 'rgba(232,228,223,0.04)',
                        border: '1px solid rgba(232,228,223,0.08)',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: 'rgba(201,168,76,0.6)' }}>
                            {article.source.name} · {formatDate(article.publishedAt)}
                          </span>
                          <ExternalLink
                            className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
                            style={{ color: '#C9A84C' }}
                          />
                        </div>
                        <p
                          className="text-sm font-semibold leading-snug mb-1 transition-colors"
                          style={{ color: '#FAFAFA' }}
                        >
                          {article.title}
                        </p>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(232,228,223,0.4)' }}>
                          {article.description}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(232,228,223,0.08)', background: 'rgba(0,0,0,0.15)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(232,228,223,0.25)' }}>
            Powered by Zen Travel AI · News via GNews
          </p>
          <button
            onClick={onClose}
            className="text-sm font-semibold px-5 py-2 rounded-full transition-all"
            style={{
              background: 'rgba(201,168,76,0.12)',
              color: '#C9A84C',
              border: '1px solid rgba(201,168,76,0.25)',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Penang Map Overlay Component ---

const PenangMapOverlay = ({ onClose, originPos }: { onClose: () => void, originPos: {x: string, y: string} | null }) => {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4)); // May 2026
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const handleDayClick = (day: number) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day >= startDate) {
        setEndDate(day);
      } else {
        setStartDate(day);
        setEndDate(null);
      }
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset));
    // Reset selection on month change for simplicity
    setStartDate(null);
    setEndDate(null);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const emptySlots = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const penangLocations = [
    { id: 'hill', name: 'Penang Hill', nameZh: '升旗山', category: 'Nature', img: 'https://tse4.mm.bing.net/th/id/OIP.vEJg1R83B3iDZ-oKXQM_vQHaE8?rs=1&pid=ImgDetMain&o=7&rm=3', lat: 5.4244, lng: 100.2689 },
    { id: 'kekloksi', name: 'Kek Lok Si Temple', nameZh: '极乐寺', category: 'Culture', img: 'https://live.staticflickr.com/65535/51878941270_73246f0794_b.jpg', lat: 5.3685, lng: 100.2422 },
    { id: 'streetart', name: 'George Town Street Art', nameZh: '乔治市壁画', category: 'Arts', img: 'https://tripjive.com/wp-content/uploads/2024/01/Muntri-Street-George-Town-Murals.jpg', lat: 5.4164, lng: 100.3350 },
    { id: 'jetties', name: 'Clan Jetties', nameZh: '姓氏桥', category: 'Heritage', img: 'https://www.wonderfulmalaysia.com/attractions/files/2011/07/clan-jetties-georgetown-7.jpg', lat: 5.4745, lng: 100.2592 },
    { id: 'ckt', name: 'Char Koay Teow', nameZh: '炒粿条', category: 'Local Delicacy', img: 'https://i1.wp.com/thokohmakan.com/wp-content/uploads/2020/04/20200408192454_IMG_6423-scaled.jpg?resize=800%2C530&ssl=1', lat: 5.5130, lng: 100.4320 },
    { id: 'laksa', name: 'Assam Laksa', nameZh: '亚参叻沙', category: 'Local Delicacy', img: 'https://images.deliveryhero.io/image/foodpanda/recipes/asam-laksa-recipe-1.jpg', lat: 5.2954, lng: 100.2589 },
    { id: 'chendul', name: 'Teochew Chendul', nameZh: '潮州煎蕊', category: 'Dessert', img: 'https://livingnomads.com/wp-content/uploads/2023/06/25/teochew-cendol-penang-malaysia-30.jpeg', lat: 5.3626, lng: 100.4651 },
    { id: 'nasikandar', name: 'Nasi Kandar', nameZh: '扁担饭', category: 'Local Delicacy', img: 'https://th.bing.com/th/id/OIP.qLRBw5F_uCk3tPvGDTcI3wHaE8?w=213&h=150&c=6&o=5&dpr=1.4&pid=1.7', lat: 5.2345, lng: 100.4431 },
  ];

  return (
    <motion.div 
      initial={{ 
        opacity: 0, 
        scale: 0.1,
        transformOrigin: originPos ? `${originPos.x} ${originPos.y}` : 'center'
      }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.1,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // smooth, slow zoom effect
      className="absolute inset-0 z-[60] flex items-center justify-center bg-[#FAFAFA] overflow-hidden"
      style={{
        transformOrigin: originPos ? `${originPos.x} ${originPos.y}` : 'center'
      }}
    >
      <div className="absolute inset-0 z-0">
        <PenangInteractiveMap locations={penangLocations} />
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50 pointer-events-auto">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E4DF] shadow-sm hover:shadow-md transition-all text-[#1A1A2E] font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Malaysia
        </button>
      </div>

      {/* Top Left Sector: Text Description */}
      <div className="absolute top-32 left-12 md:left-24 z-40 max-w-md pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm md:text-base font-bold tracking-widest text-[#C9A84C] uppercase mb-3">
            Explore <span className="text-[#A68A3D] font-extrabold text-lg md:text-xl border-b-2 border-[#A68A3D] pb-0.5">Penang</span>
          </h2>
          <h1 className="text-4xl md:text-5xl font-serif text-[#1A1A2E] leading-tight mb-4">
            The Pearl of <br/>the Orient
          </h1>
          <p className="text-sm md:text-base text-gray-700 mb-6 max-w-sm font-sans leading-relaxed">
            Dive into tailored luxury itineraries, vibrant George Town street art, breathtaking landscapes, and a rich cultural heritage. Renowned globally as a food paradise, Penang offers an unforgettable blend of historical charm and modern vibrancy.
          </p>
          
          <div className="relative inline-block">
            <button 
              onClick={() => setShowCalendar(true)}
              className="group relative overflow-hidden flex items-center justify-center gap-3 bg-[#1A1A2E] text-white px-8 py-3.5 rounded-full font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#2A2A4A] pr-10 hover:pr-14"
            >
              <span className="relative z-10 transition-transform duration-300">Start a Trip</span>
              <Plane className="w-6 h-6 absolute right-4 z-10 opacity-0 -translate-x-8 translate-y-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Centralized Calendar Modal Overlay */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              ref={calendarRef}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-[600px]"
            >
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <span className="font-bold text-xl text-[#1A1A2E] tracking-wide">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600 rotate-180" /></button>
              </div>
              <div className="grid grid-cols-7 gap-4 text-center text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-lg">
                {/* Empty slots */}
                {emptySlots.map(slot => (
                  <div key={`empty-${slot}`} className="py-3"></div>
                ))}
                {/* Days */}
                {days.map(day => {
                  const isStart = startDate === day;
                  const isEnd = endDate === day;
                  const inRange = startDate && endDate && day > startDate && day < endDate;

                  let bgClass = "text-gray-700 hover:bg-gray-100";
                  if (isStart && !endDate) bgClass = "bg-[#1A1A2E] text-white font-bold shadow-md rounded-full";
                  else if (isStart && endDate) bgClass = "bg-[#1A1A2E] text-white font-bold rounded-l-full";
                  else if (isEnd) bgClass = "bg-[#1A1A2E] text-white font-bold rounded-r-full shadow-md";
                  else if (inRange) bgClass = "bg-blue-50 text-[#1A1A2E] font-medium";

                  return (
                    <div 
                      key={day} 
                      onClick={() => handleDayClick(day)}
                      className={`py-3 cursor-pointer transition-colors ${bgClass}`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setShowCalendar(false)} 
                  className="flex-1 py-4 rounded-xl text-base font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (startDate) {
                      setShowCalendar(false);
                      // Calculate duration (default to 1 day if no end date selected)
                      const duration = endDate ? (endDate - startDate + 1) : 1;
                      router.push(`/trip-setup?duration=${duration}`);
                    }
                  }} 
                  className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all ${startDate ? 'bg-[#C9A84C] text-white hover:bg-[#b59540] shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// --- Stylized Malaysia Map Component ---
const MalaysiaMapOverlay = ({ onClose, onStateClick }: { onClose: () => void, onStateClick: (state: string, clickEvent: React.MouseEvent) => void }) => {
  // 13 States positioned to match the new Bing map image layout
  const states = [
    { name: 'Perlis', x: '10%', y: '15%' },
    { name: 'Kedah', x: '13%', y: '20%' },
    { name: 'Penang', x: '11%', y: '24%' },
    { name: 'Perak', x: '15%', y: '30%' },
    { name: 'Kelantan', x: '22%', y: '25%' },
    { name: 'Terengganu', x: '28%', y: '27%' },
    { name: 'Pahang', x: '26%', y: '37%' },
    { name: 'Selangor', x: '18%', y: '41%' },
    { name: 'Negeri Sembilan', x: '23%', y: '44%' },
    { name: 'Melaka', x: '24%', y: '49%' },
    { name: 'Johor', x: '30%', y: '51%' },
    { name: 'Sarawak', x: '57%', y: '65%' },
    { name: 'Sabah', x: '78%', y: '42%' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAFAFA] overflow-hidden"
    >
      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E4DF] shadow-sm hover:shadow-md transition-all text-[#1A1A2E] font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Global
        </button>
      </div>

      {/* Left Upper Sector: Text Description */}
      <div className="absolute top-28 left-12 z-40 max-w-sm pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm md:text-base font-bold tracking-widest text-[#C9A84C] uppercase mb-3">
            Explore <span className="text-[#A68A3D] font-extrabold text-lg md:text-xl border-b-2 border-[#A68A3D] pb-0.5">Malaysia</span>
          </h2>
          <h1 className="text-3xl md:text-4xl font-serif text-[#1A1A2E] leading-tight mb-4">
            Thirteen states, <br />
            one peninsula <br />
            and an island heart.
          </h1>
          <p className="text-sm text-gray-500 mb-8 max-w-sm font-sans leading-relaxed">
            Pick a state to dive into tailored luxury itineraries, breathtaking landscapes, and rich cultural heritage.
          </p>
        </motion.div>
      </div>

      {/* Interactive Map Area - Scales larger and uses original image styling */}
      <div className="relative w-full max-w-[95rem] mx-auto px-4 mt-8 flex items-center justify-end pointer-events-auto">
        <div className="relative w-full md:w-[85%] lg:w-[90%] aspect-[4/3] max-h-[95vh]">
          {/* High-res Plain Malaysia Map Image */}
          <img 
            src="https://th.bing.com/th/id/R.603bf8f12aeadf53f8159ef25f609978?rik=Ejdr6LWbgeA1pg&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fmalaysia-png-file-blank-malaysia-map-svg-1280.png&ehk=TtxUWIGptdWeYBIg5n6Z7zoAUMRQPgXt2bcSXKZfktk%3d&risl=&pid=ImgRaw&r=0" 
            alt="Map of Malaysia" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none transform scale-110 md:scale-125"
          />
          
          {/* State Markers */}
          <div className="absolute inset-0 w-full h-full transform scale-110 md:scale-125">
            {states.map((state, idx) => (
              <motion.div
                key={state.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.05) }}
                className="absolute group cursor-pointer"
                style={{ left: state.x, top: state.y, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => {
                  if (state.name === 'Penang') {
                    onStateClick(state.name, e);
                  }
                }}
              >
                <div className="relative flex items-center justify-center">
                  {/* Default State Marker (Black with white border) -> Hover to Gold with white border */}
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-black border-2 border-white rounded-full shadow-md group-hover:bg-[#C9A84C] group-hover:scale-125 transition-all duration-300 z-10" />
                  
                  {/* Ping Animation (Only visible on hover) */}
                  <div className="absolute w-8 h-8 md:w-12 md:h-12 bg-[#C9A84C]/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping z-0 transition-opacity duration-300" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 md:mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap bg-[#1A1A2E] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
                    {state.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A2E]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const [lang, setLang] = useState<'EN' | '中文' | 'BM'>('EN')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMalaysiaMap, setShowMalaysiaMap] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [zoomOrigin, setZoomOrigin] = useState<{x: string, y: string} | null>(null)
  const [conflictCountry, setConflictCountry] = useState<ConflictCountry | null>(null)

  const availableCountries = [
    { id: 'fr', name: 'France', nameZh: '法国', nameBm: 'Perancis' },
    { id: 'it', name: 'Italy', nameZh: '意大利', nameBm: 'Itali' },
    { id: 'uk', name: 'UK', nameZh: '英国', nameBm: 'UK' },
    { id: 'us', name: 'US', nameZh: '美国', nameBm: 'AS' },
    { id: 'jp', name: 'Japan', nameZh: '日本', nameBm: 'Jepun' },
    { id: 'kr', name: 'South Korea', nameZh: '韩国', nameBm: 'Korea Selatan' },
    { id: 'ca', name: 'Canada', nameZh: '加拿大', nameBm: 'Kanada' },
    { id: 'br', name: 'Brazil', nameZh: '巴西', nameBm: 'Brazil' },
    { id: 'in', name: 'India', nameZh: '印度', nameBm: 'India' },
    { id: 'cn', name: 'China', nameZh: '中国', nameBm: 'China' },
    { id: 'my', name: 'Malaysia', nameZh: '马来西亚', nameBm: 'Malaysia' },
    { id: 'th', name: 'Thailand', nameZh: '泰国', nameBm: 'Thailand' },
    { id: 'sg', name: 'Singapore', nameZh: '新加坡', nameBm: 'Singapura' },
    { id: 'id', name: 'Indonesia', nameZh: '印尼', nameBm: 'Indonesia' },
    { id: 'vn', name: 'Vietnam', nameZh: '越南', nameBm: 'Vietnam' },
    { id: 'ph', name: 'Philippines', nameZh: '菲律宾', nameBm: 'Filipina' }
  ];

  const filteredCountries = availableCountries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameZh.includes(searchQuery) ||
    c.nameBm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (country: any) => {
    setSearchQuery(country.name);
    setShowDropdown(false);
    
    // Send command to iframe to zoom into the selected country
    const iframe = document.getElementById('earth-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'FOCUS_COUNTRY', countryId: country.id }, '*');
    }
  };

  const handleStateClick = (stateName: string, event: React.MouseEvent) => {
    // Capture exact mouse coordinates to use as the transform origin for the zoom animation
    setZoomOrigin({
      x: `${event.clientX}px`,
      y: `${event.clientY}px`
    });
    setSelectedState(stateName);
  };

  // Update iframe language whenever `lang` state changes
  useEffect(() => {
    const iframe = document.getElementById('earth-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // Use try-catch to avoid cross-origin issues if it runs too early
      try {
        const win = iframe.contentWindow as any;
        if (typeof win.setEarthLanguage === 'function') {
          // Map "中文" to "ZH" for the internal iframe logic
          const internalLang = lang === '中文' ? 'ZH' : lang;
          win.setEarthLanguage(internalLang);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [lang]);

  // Listen for messages from the Earth iframe (e.g., zoom complete, conflict click)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ZOOM_COMPLETE') {
        if (event.data.country === 'my') {
          setShowMalaysiaMap(true)
        }
      }
      if (event.data && event.data.type === 'CONFLICT_COUNTRY_CLICK') {
        setConflictCountry({
          id: event.data.countryId,
          code: event.data.countryCode,
          name: event.data.countryName,
        })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleCloseMap = () => {
    setShowMalaysiaMap(false);
    setSelectedState(null);
    // Tell iframe to reset
    const iframe = document.getElementById('earth-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'RESET_EARTH' }, '*');
    }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-[#f8f9fa]">
      <AnimatePresence>
        {conflictCountry && (
          <ConflictAdvisoryModal
            key={conflictCountry.id}
            country={conflictCountry}
            onClose={() => setConflictCountry(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMalaysiaMap && !selectedState && (
          <MalaysiaMapOverlay onClose={handleCloseMap} onStateClick={handleStateClick} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedState === 'Penang' && (
          <PenangMapOverlay 
            onClose={() => setSelectedState(null)} 
            originPos={zoomOrigin}
          />
        )}
      </AnimatePresence>

      {/* 3D Earth Background via Iframe */}
      <iframe
        id="earth-iframe"
        src="/earth-plain.html"
        className="absolute inset-0 w-full h-full border-0"
        style={{ zIndex: 0 }}
        title="Earth Explore"
      />

      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-0 right-0 z-10 p-6 md:px-8 md:py-6 flex items-start justify-between pointer-events-none">
        
        {/* Upper Left: Logo + Name */}
        <div className="flex flex-col gap-6 w-full md:w-auto md:flex-1 pointer-events-auto">
          {/* Logo & Name */}
          <button 
            onClick={() => router.push('/home')}
            className="flex items-center gap-3 group cursor-pointer w-fit"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#8C7023] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[#1A1A2E] to-[#4A4A6A] bg-clip-text text-transparent drop-shadow-sm tracking-wide font-sans">
              Zen Travel
            </span>
          </button>
        </div>

        {/* Upper Middle: Search Bar */}
        <div className="hidden md:flex w-full md:flex-[2] justify-center pointer-events-auto">
          <div className="relative w-full max-w-lg group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#C9A84C] transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay to allow click
              className="block w-full pl-12 pr-6 py-3.5 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full text-[#1A1A2E] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:bg-white transition-all shadow-md text-base"
              placeholder="Search a country..."
            />
            {/* Dropdown for Search */}
            <AnimatePresence>
              {showDropdown && searchQuery && filteredCountries.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                >
                  {filteredCountries.map(country => (
                    <div 
                      key={country.id}
                      onClick={() => handleSearchSelect(country)}
                      className="px-6 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 flex items-center justify-between"
                    >
                      <span className="font-semibold text-[#1A1A2E]">{country.name}</span>
                      <span className="text-xs text-gray-500">{country.nameZh} / {country.nameBm}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Upper Right: Language Slider */}
        <div className="hidden md:flex md:flex-1 justify-end pointer-events-auto">
          <div className="flex items-center bg-white/90 backdrop-blur-md rounded-full p-1 border border-gray-200 shadow-md w-fit">
            {['EN', '中文', 'BM'].map((l) => (
              <button
                  key={l}
                  onClick={() => setLang(l as 'EN' | '中文' | 'BM')}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  lang === l 
                    ? 'bg-[#1A1A2E] text-white shadow-md' 
                    : 'text-gray-600 hover:text-[#1A1A2E] hover:bg-gray-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Elements (Shows only on small screens) */}
      <div className="absolute top-28 left-6 right-6 z-10 md:hidden pointer-events-auto flex flex-col gap-4">
        {/* Language Slider Mobile */}
        <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg w-fit">
          {['EN', '中文', 'BM'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as 'EN' | '中文' | 'BM')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                lang === l 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        
        {/* Search Bar Mobile */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all shadow-xl text-sm"
            placeholder="Search a country..."
          />
        </div>
      </div>

    </div>
  )
}
