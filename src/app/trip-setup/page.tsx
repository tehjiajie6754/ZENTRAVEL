'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Compass, Check, Utensils, MapPin, Plane, Sparkles, Loader2 } from 'lucide-react'
import { loadUserPreferences } from '@/lib/user-preferences'

// Mock Data for Step 1
const companions = [
  { id: 'solo', title: 'Solo', img: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800&auto=format&fit=crop' }, // A single person traveling with a backpack
  { id: 'partner', title: 'Partner', img: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop' },
  { id: 'friends', title: 'Friends', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop' },
  { id: 'family', title: 'Family', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop' },
]

// Mock Data for Step 2
const RECOMMENDED_CATEGORY = 'Recommended for You'

const categories = [
  RECOMMENDED_CATEGORY,
  'Must See',
  'Great Food',
  'Hidden Gem',
  'Adventure',
  'Local Culture',
  'Instagrammable',
  'Shopping',
  'Relax & Wellness'
];

const activities = [
  // Must See
  { id: 'ms1', title: 'Penang Hill', category: 'Must See', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms2', title: 'Kek Lok Si Temple', category: 'Must See', img: 'https://live.staticflickr.com/65535/51878941270_73246f0794_b.jpg' },
  { id: 'ms3', title: 'Fort Cornwallis', category: 'Must See', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms4', title: 'Penang National Park', category: 'Must See', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms5', title: 'Cheong Fatt Tze Mansion', category: 'Must See', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms6', title: 'Komtar Tower', category: 'Must See', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms7', title: 'Batu Ferringhi Beach', category: 'Must See', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms8', title: 'Penang Bridge', category: 'Must See', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'ms9', title: 'Snake Temple', category: 'Must See', img: 'https://live.staticflickr.com/65535/51878941270_73246f0794_b.jpg' },
  { id: 'ms10', title: 'Kapitan Keling Mosque', category: 'Must See', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },

  // Great Food
  { id: 'gf1', title: 'Char Koay Teow', category: 'Great Food', img: 'https://i1.wp.com/thokohmakan.com/wp-content/uploads/2020/04/20200408192454_IMG_6423-scaled.jpg?resize=800%2C530&ssl=1' },
  { id: 'gf2', title: 'Assam Laksa', category: 'Great Food', img: 'https://images.deliveryhero.io/image/foodpanda/recipes/asam-laksa-recipe-1.jpg' },
  { id: 'gf3', title: 'Teochew Chendul', category: 'Great Food', img: 'https://livingnomads.com/wp-content/uploads/2023/06/25/teochew-cendol-penang-malaysia-30.jpeg' },
  { id: 'gf4', title: 'Nasi Kandar', category: 'Great Food', img: 'https://th.bing.com/th/id/OIP.qLRBw5F_uCk3tPvGDTcI3wHaE8?w=213&h=150&c=6&o=5&dpr=1.4&pid=1.7' },
  { id: 'gf5', title: 'Hokkien Mee', category: 'Great Food', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'gf6', title: 'Penang Rojak', category: 'Great Food', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'gf7', title: 'Curry Mee', category: 'Great Food', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'gf8', title: 'Mee Goreng Mamak', category: 'Great Food', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'gf9', title: 'Apom Balik', category: 'Great Food', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'gf10', title: 'Oh Chien (Oyster Omelette)', category: 'Great Food', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },

  // Hidden Gem
  { id: 'hg1', title: 'Tropical Spice Garden', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg2', title: 'Avatar Secret Garden', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg3', title: 'Pantai Kerachut', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg4', title: 'Frog Hill', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg5', title: 'Air Itam Dam', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg6', title: 'Gertak Sanggul', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg7', title: 'Bukit Genting', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg8', title: 'Balik Pulau Farms', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg9', title: 'Penang Turf Club', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'hg10', title: 'Bao Sheng Fruit Farm', category: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },

  // Adventure
  { id: 'ad1', title: 'ESCAPE Theme Park', category: 'Adventure', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad2', title: 'Entopia Butterfly Farm', category: 'Adventure', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad3', title: 'The Habitat', category: 'Adventure', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad4', title: 'The Gravityz', category: 'Adventure', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad5', title: 'Penang Hill Funicular', category: 'Adventure', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad6', title: 'ATV Penang', category: 'Adventure', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad7', title: 'Canopy Walk', category: 'Adventure', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad8', title: 'Zip Line Penang', category: 'Adventure', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad9', title: 'Hiking National Park', category: 'Adventure', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'ad10', title: 'Water Sports', category: 'Adventure', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },

  // Local Culture
  { id: 'lc1', title: 'Clan Jetties', category: 'Local Culture', img: 'https://www.wonderfulmalaysia.com/attractions/files/2011/07/clan-jetties-georgetown-7.jpg' },
  { id: 'lc2', title: 'Pinang Peranakan Mansion', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc3', title: 'Khoo Kongsi', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc4', title: 'Little India', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc5', title: 'Chinatown Penang', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc6', title: 'Reclining Buddha Temple', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc7', title: 'Dhammikarama Temple', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc8', title: 'Sri Mariamman Temple', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc9', title: "St. George's Church", category: 'Local Culture', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'lc10', title: 'Penang State Museum', category: 'Local Culture', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },

  // Instagrammable
  { id: 'ig1', title: 'George Town Street Art', category: 'Instagrammable', img: 'https://tripjive.com/wp-content/uploads/2024/01/Muntri-Street-George-Town-Murals.jpg' },
  { id: 'ig2', title: 'Hin Bus Depot', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig3', title: 'Chew Jetty Bridge', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig4', title: 'Penang Hill Skywalk', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig5', title: 'Umbrella Alley', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig6', title: 'Tan Jetty', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig7', title: 'Street Art Cafe', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig8', title: 'Blue Mansion', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig9', title: 'Rainbow Skywalk', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'ig10', title: 'Chulia Street', category: 'Instagrammable', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },

  // Shopping
  { id: 'sh1', title: 'Gurney Plaza', category: 'Shopping', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh2', title: 'Design Village', category: 'Shopping', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh3', title: 'Queensbay Mall', category: 'Shopping', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh4', title: '1st Avenue Mall', category: 'Shopping', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh5', title: 'Sunway Carnival', category: 'Shopping', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh6', title: 'Penang Times Square', category: 'Shopping', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh7', title: 'Prangin Mall', category: 'Shopping', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh8', title: 'Straits Quay', category: 'Shopping', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh9', title: 'Batu Ferringhi Market', category: 'Shopping', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },
  { id: 'sh10', title: 'Chowrasta Market', category: 'Shopping', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },

  // Relax & Wellness
  { id: 'rw1', title: 'Batu Ferringhi Beach', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw2', title: 'Tanjung Bungah Beach', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw3', title: 'Teluk Bahang Beach', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw4', title: 'Monkey Beach', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw5', title: 'Penang Botanic Gardens', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw6', title: 'Tropical Fruit Farm', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw7', title: 'Penang Hill Spa', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw8', title: 'Eastin Hotel Spa', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw9', title: 'Hard Rock Resort', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?q=80&w=800&auto=format&fit=crop' },
  { id: 'rw10', title: 'Chi The Spa', category: 'Relax & Wellness', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
]

function TripSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [step, setStep] = useState<1 | 2>(1)

  // Calculate recommended counts based on duration from URL
  const durationParam = searchParams.get('duration');
  const days = durationParam ? parseInt(durationParam, 10) : 3; // Default to 3 days if not found

  // Day 1 is an evening arrival (~6 PM) so only dinner is realistic — treat it as half a day.
  // Last day departs in the evening but activities must end by ~5 PM, so it counts as a full day.
  // Effective touring days = days - 1 (one day lost to evening arrival).
  const effectiveDays = Math.max(1, days - 1);
  const recommendedFood = effectiveDays * 3;
  const recommendedDestinations = effectiveDays * 3;

  // Step 1 selections
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null)
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string>('')

  // Step 2 selections
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>(RECOMMENDED_CATEGORY)

  // Recommendations state
  const [recIds, setRecIds] = useState<string[]>([])         // IDs that are AI-recommended
  const [recReasoning, setRecReasoning] = useState<string>('')
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState('')
  const recFetchedRef = useRef(false)

  // Fetch AI recommendations once when the user lands on Step 2.
  const fetchRecommendations = async () => {
    if (recFetchedRef.current || recLoading) return
    recFetchedRef.current = true
    setRecLoading(true)
    setRecError('')
    try {
      const prefs = loadUserPreferences()
      const payload = {
        preferences: prefs ?? {},
        activities: activities.map(a => ({ id: a.id, title: a.title, category: a.category })),
        foodCount: recommendedFood,
        destCount: recommendedDestinations,
      }
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const ids = [...(data.foodIds ?? []), ...(data.destinationIds ?? [])]
      setRecIds(ids)
      setRecReasoning(data.reasoning ?? '')
      // Auto-select these so the counter immediately reflects the target counts.
      setSelectedActivities(prev => {
        const existing = new Set(prev)
        ids.forEach((id: string) => existing.add(id))
        return Array.from(existing)
      })
    } catch (err: any) {
      recFetchedRef.current = false  // allow retry
      setRecError('ILMU-GLM-5.1 API DISCONNECTED, please try again later')
    }
    setRecLoading(false)
  }

  // Trigger fetch when the user reaches Step 2.
  useEffect(() => {
    if (step === 2) fetchRecommendations()
  }, [step])

  const toggleActivity = (id: string) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter(a => a !== id))
    } else {
      setSelectedActivities([...selectedActivities, id])
    }
  }

  // Calculate current counts
  const selectedFoodCount = selectedActivities.filter(id => {
    const act = activities.find(a => a.id === id);
    return act?.category === 'Great Food';
  }).length;

  const selectedDestCount = selectedActivities.length - selectedFoodCount;

  // Helper for color coding the tracker
  const getTrackerColor = (current: number, recommended: number) => {
    if (current === 0) return 'text-gray-400 bg-gray-100';
    if (current <= recommended + 1) return 'text-emerald-700 bg-emerald-100 border border-emerald-200'; // Optimal or slightly over
    if (current <= recommended + 3) return 'text-amber-700 bg-amber-100 border border-amber-200'; // Getting too packed
    return 'text-red-700 bg-red-100 border border-red-200'; // Way too packed
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A2E] font-sans overflow-x-hidden pb-20">
      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between sticky z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <button onClick={() => router.push('/explore')} className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#8C7023] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#1A1A2E] to-[#4A4A6A] bg-clip-text text-transparent tracking-wide">
            Zen Travel
          </span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-400">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#1A1A2E]' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 1 ? 'bg-[#1A1A2E] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <span>Travelers</span>
          </div>
          <div className="w-8 h-[2px] bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#1A1A2E]' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 2 ? 'bg-[#1A1A2E] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span>Activities</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative min-h-[calc(100vh-100px)] flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* STEP 1: Companions & Pets */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full flex flex-col items-center"
            >
              {/* Companions */}
              <div className="w-full mb-16">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1A1A2E] text-center mb-12">Who are you traveling with?</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {companions.map(comp => {
                    const isSelected = selectedCompanion === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => setSelectedCompanion(comp.id)}
                        className={`group relative h-80 md:h-96 rounded-[2rem] overflow-hidden shadow-lg transition-all duration-300 transform ${isSelected ? 'ring-4 ring-[#C9A84C] scale-105 shadow-2xl' : 'hover:scale-105 hover:shadow-xl'}`}
                      >
                        <div className="absolute inset-0 z-0">
                          <img src={comp.img} alt={comp.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className={`absolute inset-0 z-10 transition-colors duration-300 ${isSelected ? 'bg-black/30' : 'bg-gradient-to-t from-[#1A1A2E]/90 via-[#1A1A2E]/30 to-transparent'}`}></div>
                        <div className="absolute bottom-8 left-0 w-full text-center z-20">
                          <h3 className="text-2xl font-serif font-bold text-white tracking-wide">{comp.title}</h3>
                        </div>
                        {isSelected && (
                          <div className="absolute top-5 right-5 z-20 bg-[#C9A84C] text-white p-2 rounded-full shadow-lg">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md mx-auto text-center"
              >
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A2E] mb-8">Bringing any pets?</h2>
                <div className="flex justify-center gap-6">
                  <button
                    onClick={() => setHasPets(true)}
                    className={`flex-1 py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${hasPets === true ? 'bg-[#C9A84C] text-white shadow-lg scale-105 border-transparent' : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasPets(false)}
                    className={`flex-1 py-4 md:py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${hasPets === false ? 'bg-[#1A1A2E] text-white shadow-lg scale-105 border-transparent' : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-[#1A1A2E] hover:text-[#1A1A2E]'}`}
                  >
                    No
                  </button>
                </div>
              </motion.div>

              {/* Current Location — always visible */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
                className="w-full max-w-lg mx-auto mt-12"
              >
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 px-8 py-8 relative overflow-hidden">
                  {/* Gold left stripe */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#C9A84C] to-[#A68A3D] rounded-l-3xl" />

                  <div className="flex items-center gap-3 mb-2 pl-2">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center shadow-sm">
                      <Plane className="w-5 h-5 text-[#C9A84C]" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A1A2E] leading-tight">
                        Where are you flying from?
                      </h2>
                      <p className="text-sm text-gray-400 mt-0.5">
                        We'll find the best flight to Penang for you.
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-6 pl-2">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. Kuala Lumpur, Malaysia"
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-gray-200 bg-[#FAFAFA] text-[#1A1A2E] font-medium text-base focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Confirmation hint */}
                  <AnimatePresence>
                    {currentLocation.trim().length >= 2 && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 pl-2 text-sm text-[#C9A84C] font-semibold flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Searching flights from {currentLocation.trim()}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Continue button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-10"
              >
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedCompanion || hasPets === null || currentLocation.trim().length < 2}
                  className={`px-14 py-5 rounded-full font-bold text-lg tracking-wide transition-all duration-300 ${selectedCompanion && hasPets !== null && currentLocation.trim().length >= 2
                    ? 'bg-[#C9A84C] text-white hover:bg-[#A68A3D] shadow-xl hover:-translate-y-1 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Continue to Activities →
                </button>
                {(!selectedCompanion || hasPets === null || currentLocation.trim().length < 2) && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    Please complete all fields above to continue
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: Activities */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full mb-12">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1A1A2E] text-center mb-4">Activities that Interest You</h1>
                <p className="text-center text-gray-600 max-w-xl mx-auto mb-12 text-lg">Select the types of destinations and food places you'd like us to include in your personalized itinerary.</p>

                {/* Category Selection Bar */}
                <div className="w-full flex overflow-x-auto pb-2 mb-6 scrollbar-hide snap-x justify-start md:justify-center">
                  <div className="flex gap-2 md:gap-3 px-4 md:px-0">
                    {categories.map(cat => {
                      const isActive = activeCategory === cat;
                      const isRec = cat === RECOMMENDED_CATEGORY;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`snap-center whitespace-nowrap px-4 py-1.5 md:px-5 md:py-2 rounded-full font-medium text-xs md:text-sm transition-all duration-300 flex items-center gap-1.5 ${
                            isActive
                              ? isRec
                                ? 'bg-gradient-to-r from-[#C9A84C] to-[#A68A3D] text-white shadow-lg shadow-[#C9A84C]/30'
                                : 'bg-[#1A1A2E] text-white shadow-md'
                              : isRec
                                ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/40 text-[#A68A3D] hover:bg-[#C9A84C]/20'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-[#1A1A2E] hover:text-[#1A1A2E]'
                          }`}
                        >
                          {isRec && <Sparkles className="w-3.5 h-3.5" />}
                          {cat}
                          {isRec && recIds.length > 0 && (
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#C9A84C] text-white'}`}>
                              {recIds.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 px-4">
                  <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-colors duration-500 ${getTrackerColor(selectedDestCount, recommendedDestinations)}`}>
                    <MapPin className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">Destinations</span>
                      <span className="text-sm font-semibold">{selectedDestCount} / {recommendedDestinations} selected</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-colors duration-500 ${getTrackerColor(selectedFoodCount, recommendedFood)}`}>
                    <Utensils className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">Food & Dining</span>
                      <span className="text-sm font-semibold">{selectedFoodCount} / {recommendedFood} selected</span>
                    </div>
                  </div>
                </div>

                {/* Recommended for You — loading / error / results */}
                {activeCategory === RECOMMENDED_CATEGORY && (
                  <>
                    {recLoading && (
                      <div className="flex flex-col items-center justify-center py-20 gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#1A1A2E]/10 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-serif font-semibold text-[#1A1A2E]">AI is curating your picks…</p>
                          <p className="text-sm text-gray-500 mt-1">Matching destinations to your travel style</p>
                        </div>
                      </div>
                    )}

                    {recError && !recLoading && (
                      <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <p className="text-sm text-red-500">{recError}</p>
                        <button
                          onClick={() => { recFetchedRef.current = false; fetchRecommendations() }}
                          className="px-6 py-2.5 rounded-full bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-[#2a2a4e] transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {!recLoading && recIds.length > 0 && (
                      <>
                        {/* AI reasoning banner */}
                        {recReasoning && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 bg-gradient-to-r from-[#1A1A2E] to-[#2a2a4e] rounded-2xl px-5 py-4 flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9A84C] mb-1">AI Curator · Why these picks</p>
                              <p className="text-sm text-white/80 leading-relaxed">{recReasoning}</p>
                            </div>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                          <AnimatePresence mode="popLayout">
                            {activities.filter(act => recIds.includes(act.id)).map((act, i) => {
                              const isSelected = selectedActivities.includes(act.id);
                              const isFood = act.category === 'Great Food';
                              return (
                                <motion.button
                                  layout
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.85 }}
                                  transition={{ duration: 0.3, delay: i * 0.04 }}
                                  key={act.id}
                                  onClick={() => toggleActivity(act.id)}
                                  className={`group relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-md transition-all duration-300 transform ${isSelected ? 'ring-4 ring-[#C9A84C] scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-xl'}`}
                                >
                                  <div className="absolute inset-0 z-0">
                                    <img src={act.img} alt={act.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                  </div>
                                  <div className={`absolute inset-0 z-10 transition-colors duration-300 ${isSelected ? 'bg-black/40' : 'bg-gradient-to-t from-[#1A1A2E]/90 via-[#1A1A2E]/30 to-transparent'}`}></div>

                                  {/* AI Pick badge */}
                                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#C9A84C] text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                                    <Sparkles className="w-3 h-3" />
                                    {isFood ? 'AI Food Pick' : 'AI Pick'}
                                  </div>

                                  {/* Category label */}
                                  <div className="absolute top-4 right-4 z-20">
                                    {isSelected ? (
                                      <div className="bg-[#C9A84C] text-white p-2 rounded-full shadow-lg">
                                        <Check className="w-5 h-5" />
                                      </div>
                                    ) : (
                                      <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                                        {act.category}
                                      </span>
                                    )}
                                  </div>

                                  <div className="absolute bottom-6 left-0 w-full text-center z-20 px-6">
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide leading-tight">{act.title}</h3>
                                  </div>
                                </motion.button>
                              )
                            })}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Regular category grid (hidden when on Recommended tab) */}
                {activeCategory !== RECOMMENDED_CATEGORY && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                      {activities.filter(act => act.category === activeCategory).map(act => {
                        const isSelected = selectedActivities.includes(act.id);
                        const isRec = recIds.includes(act.id);
                        return (
                          <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            key={act.id}
                            onClick={() => toggleActivity(act.id)}
                            className={`group relative h-64 md:h-72 rounded-[2rem] overflow-hidden shadow-md transition-all duration-300 transform ${isSelected ? 'ring-4 ring-[#C9A84C] scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-xl'}`}
                          >
                            <div className="absolute inset-0 z-0">
                              <img src={act.img} alt={act.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                            <div className={`absolute inset-0 z-10 transition-colors duration-300 ${isSelected ? 'bg-black/40' : 'bg-gradient-to-t from-[#1A1A2E]/90 via-[#1A1A2E]/30 to-transparent'}`}></div>

                            {/* Subtle "AI Pick" indicator on non-recommended tabs */}
                            {isRec && (
                              <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-[#C9A84C]/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                <Sparkles className="w-2.5 h-2.5" /> AI Pick
                              </div>
                            )}

                            <div className="absolute bottom-6 left-0 w-full text-center z-20 px-6">
                              <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide leading-tight">{act.title}</h3>
                            </div>
                            {isSelected && (
                              <div className="absolute top-4 right-4 z-20 bg-[#C9A84C] text-white p-2 rounded-full shadow-lg">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => {
                  const tripData = {
                    duration: days,
                    companions: selectedCompanion,
                    pets: hasPets,
                    currentLocation: currentLocation.trim(),
                    activities: selectedActivities,
                    destinations: activities.filter(a => selectedActivities.includes(a.id))
                  };
                  sessionStorage.setItem('tripData', JSON.stringify(tripData));
                  router.push('/itinerary');
                }}
                disabled={selectedActivities.length === 0}
                className={`px-14 py-5 rounded-full font-bold text-lg tracking-wide transition-all duration-300 ${selectedActivities.length > 0 ? 'bg-[#C9A84C] text-white hover:bg-[#A68A3D] shadow-xl hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Build My Itinerary
              </motion.button>

              <button
                onClick={() => setStep(1)}
                className="mt-8 text-sm font-semibold text-gray-500 hover:text-[#C9A84C] underline underline-offset-4 transition-colors"
              >
                Back to previous step
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function TripSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">Loading...</div>}>
      <TripSetupContent />
    </Suspense>
  )
}