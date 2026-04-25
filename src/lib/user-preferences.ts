// User travel preferences captured during onboarding.
// Persisted in localStorage so the Itinerary planner can reason over them.

export interface UserPreferences {
  pace?: 'packed' | 'leisure'
  budget?: 'luxury' | 'budget'
  attractions?: string[]
  activities?: 'active' | 'relaxing'
  accommodation?: 'simple' | 'experience'
  food?: 'fuel' | 'destination'
  dietary?: string
  flightClass?: 'economy' | 'business'
  updatedAt?: string
}

const KEY = 'zentravel_user_preferences'

export const saveUserPreferences = (prefs: UserPreferences): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...prefs, updatedAt: new Date().toISOString() }))
  } catch {}
}

export const loadUserPreferences = (): UserPreferences | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserPreferences
  } catch {
    return null
  }
}

const PACE_LABEL: Record<string, string> = {
  packed: 'Packed & Explorative',
  leisure: 'Leisure & Flexible',
}
const BUDGET_LABEL: Record<string, string> = {
  luxury: 'Luxury Splurge',
  budget: 'Budget-Friendly',
}
const ATTRACTION_LABEL: Record<string, string> = {
  scenery: 'Natural Scenery',
  landmarks: 'Famous Landmarks',
  hidden: 'Hidden Gems',
  food: 'Famous Food',
  history: 'Historical Sites',
  culture: 'Local Culture & Art',
}
const ACTIVITIES_LABEL: Record<string, string> = {
  active: 'Physically Active',
  relaxing: 'Mentally Relaxing',
}
const ACCOMMODATION_LABEL: Record<string, string> = {
  simple: 'Simple & practical',
  experience: 'Experience-focused stay',
}
const FOOD_LABEL: Record<string, string> = {
  fuel: 'Food is Fuel',
  destination: 'Food is the Destination',
}
const FLIGHT_CLASS_LABEL: Record<string, string> = {
  economy: 'Economy',
  business: 'Business',
}

export const formatPreferences = (p: UserPreferences | null): { label: string; value: string }[] => {
  if (!p) return []
  const rows: { label: string; value: string }[] = []
  if (p.pace) rows.push({ label: 'Pace', value: PACE_LABEL[p.pace] ?? p.pace })
  if (p.budget) rows.push({ label: 'Budget', value: BUDGET_LABEL[p.budget] ?? p.budget })
  if (p.attractions?.length) {
    rows.push({ label: 'Interests', value: p.attractions.map(a => ATTRACTION_LABEL[a] ?? a).join(', ') })
  }
  if (p.activities) rows.push({ label: 'Activity Level', value: ACTIVITIES_LABEL[p.activities] ?? p.activities })
  if (p.accommodation) rows.push({ label: 'Stay Style', value: ACCOMMODATION_LABEL[p.accommodation] ?? p.accommodation })
  if (p.food) rows.push({ label: 'Food Mindset', value: FOOD_LABEL[p.food] ?? p.food })
  if (p.dietary && p.dietary.trim()) rows.push({ label: 'Dietary', value: p.dietary.trim() })
  if (p.flightClass) rows.push({ label: 'Flight Class', value: FLIGHT_CLASS_LABEL[p.flightClass] ?? p.flightClass })
  return rows
}

// ── Ambiguity / conflict detection ────────────────────────────────────────────
// Each rule maps a dietary keyword (matched in p.dietary, case-insensitive)
// to keywords found in destination titles/descriptions that should flag a
// confirmation prompt before the itinerary is generated.

interface DietaryRule {
  match: RegExp
  label: string
  conflicts: RegExp
}

const DIETARY_RULES: DietaryRule[] = [
  {
    match: /no\s*seafood|seafood\s*(allergy|free|intolerant)|shellfish/i,
    label: 'no seafood',
    conflicts: /oyster|prawn|shrimp|fish|seafood|laksa|char\s*koay\s*teow|oh\s*chien/i,
  },
  {
    match: /vegetarian|vegan|no\s*meat/i,
    label: 'vegetarian',
    conflicts: /chicken|pork|beef|lamb|prawn|shrimp|fish|oyster|hokkien\s*mee|char\s*koay\s*teow|nasi\s*kandar/i,
  },
  {
    match: /no\s*pork|halal|pork\s*free/i,
    label: 'no pork',
    conflicts: /pork|char\s*siu|bak\s*kut\s*teh|hokkien\s*mee|char\s*koay\s*teow/i,
  },
  {
    match: /nut\s*allergy|peanut\s*allergy|no\s*nuts/i,
    label: 'nut allergy',
    conflicts: /satay|peanut|rojak|chendul/i,
  },
  {
    match: /gluten\s*free|no\s*gluten|celiac/i,
    label: 'gluten-free',
    conflicts: /mee|noodle|roti|prata|bread|apom/i,
  },
]

export interface DietaryConflict {
  restriction: string
  items: { id?: string; title: string }[]
}

export const detectDietaryConflicts = (
  prefs: UserPreferences | null,
  destinations: { id?: string; title: string; category?: string; description?: string }[],
): DietaryConflict[] => {
  if (!prefs?.dietary?.trim() || !destinations?.length) return []
  const dietary = prefs.dietary
  const conflicts: DietaryConflict[] = []

  for (const rule of DIETARY_RULES) {
    if (!rule.match.test(dietary)) continue
    const hits = destinations.filter(d => {
      const haystack = `${d.title} ${d.description ?? ''}`
      return rule.conflicts.test(haystack)
    })
    if (hits.length) {
      conflicts.push({
        restriction: rule.label,
        items: hits.map(h => ({ id: h.id, title: h.title })),
      })
    }
  }
  return conflicts
}
