'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Upload, Paperclip, X, Bot, CheckCircle, ArrowRight, CreditCard, Globe, FileText, Banknote, QrCode, Mic } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import GradientBackground from "@/components/backgrounds/GradientBackground"
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface MultiOption {
  id: string
  text: string
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  options?: ChatOption[]
  type?: 'text' | 'options' | 'form' | 'checklist' | 'payment-setup' | 'completion' | 'multi-select' | 'text-input'
  files?: File[]
  multiOptions?: MultiOption[]
  multiOnSave?: (selectedIds: string[]) => void
  textPlaceholder?: string
  textOnSave?: (input: string) => void
}

interface ChatOption {
  id: string
  text: string
  icon?: React.ReactNode
  action?: () => void
}

export default function OnboardingPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<any>({})
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<string>('')
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [answeredMessageIds, setAnsweredMessageIds] = useState<Set<string>>(new Set())
  const [multiSelectState, setMultiSelectState] = useState<Record<string, Set<string>>>({})
  const [textInputState, setTextInputState] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const welcomeTriggeredRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const genId = (prefix: string = 'm') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // Trigger welcome on mount
  useEffect(() => {
    if (!welcomeTriggeredRef.current) {
      welcomeTriggeredRef.current = true
      setTimeout(() => {
        const msgId = genId('welcome')
        const welcomeMessage: Message = {
          id: msgId,
          text: '🌍✈️ **Welcome to Zen Travel!**\n\nI\'m your Personal Travel Agent — here to craft trips that actually fit you.',
          sender: 'bot',
          type: 'options',
          options: [
            { id: 'get-started', text: '🚀 Get Started', icon: <ArrowRight className="w-4 h-4" />, action: () => handleGetStarted(msgId) },
          ]
        }
        setMessages([welcomeMessage])
      }, 800)
    }
  }, [])

  const addBotMessage = (text: string, options?: ChatOption[], type?: Message['type']) => {
    const newMessage: Message = {
      id: genId('bot'),
      text,
      sender: 'bot',
      options,
      type: type || (options ? 'options' : 'text'),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (text: string, files?: File[]) => {
    const newMessage: Message = {
      id: genId('user'),
      text,
      sender: 'user',
      files
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleGetStarted = (messageId: string) => {
    addUserMessage('🚀 Get Started')
    setAnsweredMessageIds(prev => new Set([...prev, messageId]))
    setTimeout(() => {
      addBotMessage(
        'Let\'s get you set up! Complete the checklist below to unlock your full travel experience:',
        [], 'checklist'
      )
    }, 800)
  }

  const handleProfileSetup = () => {
    addUserMessage('📝 Set up my profile')
    setTimeout(() => {
      addBotMessage(
        '**Let\'s set up your traveller profile!**\n\nPlease fill in your details below:',
        [], 'form'
      )
    }, 500)
  }

  // ============ Travel Preferences Flow ============

  const askSinglePreference = (
    text: string,
    options: { id: string; text: string }[],
    onAnswer: (optionId: string, optionText: string) => void
  ) => {
    const msgId = genId('pref')
    const chatOptions: ChatOption[] = options.map(opt => ({
      id: opt.id,
      text: opt.text,
      action: () => {
        addUserMessage(opt.text)
        setAnsweredMessageIds(prev => new Set([...prev, msgId]))
        setTimeout(() => onAnswer(opt.id, opt.text), 700)
      }
    }))
    const newMessage: Message = {
      id: msgId,
      text,
      sender: 'bot',
      type: 'options',
      options: chatOptions
    }
    setMessages(prev => [...prev, newMessage])
  }

  const askMultiPreference = (
    text: string,
    options: MultiOption[],
    onSave: (selected: MultiOption[]) => void
  ) => {
    const msgId = genId('prefmulti')
    const newMessage: Message = {
      id: msgId,
      text,
      sender: 'bot',
      type: 'multi-select',
      multiOptions: options,
      multiOnSave: (selectedIds: string[]) => {
        const selected = options.filter(o => selectedIds.includes(o.id))
        addUserMessage(selected.map(s => s.text).join(', '))
        setAnsweredMessageIds(prev => new Set([...prev, msgId]))
        setTimeout(() => onSave(selected), 700)
      }
    }
    setMessages(prev => [...prev, newMessage])
  }

  const askTextPreference = (
    text: string,
    placeholder: string,
    onSave: (input: string) => void
  ) => {
    const msgId = genId('preftext')
    const newMessage: Message = {
      id: msgId,
      text,
      sender: 'bot',
      type: 'text-input',
      textPlaceholder: placeholder,
      textOnSave: (input: string) => {
        addUserMessage(input.trim() || 'No restrictions')
        setAnsweredMessageIds(prev => new Set([...prev, msgId]))
        setTimeout(() => onSave(input), 700)
      }
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handlePreferencesSetup = () => {
    addUserMessage('🌍 Set travel preferences')
    setTimeout(() => {
      addBotMessage('Help me understand your travel style so I can plan the perfect trip for you.')
      setTimeout(() => askPrefQ1(), 1000)
    }, 500)
  }

  const askPrefQ1 = () => {
    askSinglePreference(
      '🧭 **1. What\'s your travel pace?**',
      [
        { id: 'packed', text: '🔥 Packed & Explorative — I want to see everything' },
        { id: 'leisure', text: '🌿 Leisure & Flexible — I prefer to take it slow' },
      ],
      (id) => { setUserData((p: any) => ({ ...p, pace: id })); askPrefQ2() }
    )
  }

  const askPrefQ2 = () => {
    askSinglePreference(
      '💰 **2. What\'s your budget style?**',
      [
        { id: 'luxury', text: '💎 Luxury Splurge — I\'m here to treat myself' },
        { id: 'budget', text: '💸 Budget-Friendly — Smart spending all the way' },
      ],
      (id) => { setUserData((p: any) => ({ ...p, budget: id })); askPrefQ3() }
    )
  }

  const askPrefQ3 = () => {
    askMultiPreference(
      '🎯 **3. What attracts you to a destination?**\n\n(Choose all that apply, can choose more than 1)',
      [
        { id: 'scenery', text: '🌄 Natural Scenery' },
        { id: 'landmarks', text: '🗼 Famous Landmarks' },
        { id: 'hidden', text: '🧭 Hidden Gems' },
        { id: 'food', text: '🍜 Famous Food' },
        { id: 'history', text: '🏛️ Historical Sites' },
        { id: 'culture', text: '🎨 Local Culture & Art' },
      ],
      (selected) => { setUserData((p: any) => ({ ...p, attractions: selected.map(s => s.id) })); askPrefQ4() }
    )
  }

  const askPrefQ4 = () => {
    askSinglePreference(
      '⚡ **4. What kind of activities do you prefer?**',
      [
        { id: 'active', text: '🧗 Physically Active — Adventure, movement, excitement' },
        { id: 'relaxing', text: '🧘 Mentally Relaxing — Calm, scenic, and peaceful' },
      ],
      (id) => { setUserData((p: any) => ({ ...p, activities: id })); askPrefQ5() }
    )
  }

  const askPrefQ5 = () => {
    askSinglePreference(
      '🏨 **5. What\'s your accommodation style?**',
      [
        { id: 'simple', text: '🛏️ Just a Place to Sleep — Simple & practical' },
        { id: 'experience', text: '✨ Experience-Focused Stay — Unique hotels & vibes' },
      ],
      (id) => { setUserData((p: any) => ({ ...p, accommodation: id })); askPrefQ6() }
    )
  }

  const askPrefQ6 = () => {
    askSinglePreference(
      '🍽️ **6. How important is food during your trip?**',
      [
        { id: 'fuel', text: '⛽ Food is Fuel — Just something to keep me going' },
        { id: 'destination', text: '🍜 Food is the Destination — I travel for the food' },
      ],
      (id) => { setUserData((p: any) => ({ ...p, food: id })); askPrefQ7() }
    )
  }

  const askPrefQ7 = () => {
    askTextPreference(
      '⚠️ **7. Any dietary restrictions or dislikes?**\n\n(Allergies, preferences, or foods you avoid)',
      'e.g., vegetarian, no seafood, nut allergy...',
      (text) => { setUserData((p: any) => ({ ...p, dietary: text })); finishPreferences() }
    )
  }

  const finishPreferences = () => {
    setTimeout(() => {
      addBotMessage(
        '🎉 **All Set!**\n\n✅ **Travel Preferences Saved!**\n\nYour AI Itinerary Planner will now craft trips tailored exactly to your style, interests, and needs.'
      )
      setCompletedSteps(prev => new Set([...prev, 'preferences']))
      setTimeout(() => {
        addBotMessage('Here\'s your updated checklist:', [], 'checklist')
      }, 1500)
    }, 500)
  }

  // ============ Payment Flow (unchanged) ============

  const handlePaymentSetup = () => {
    addUserMessage('💳 Set up payment')
    setTimeout(() => {
      addBotMessage(
        '**Let\'s set up your payment method.**\n\nChoose your preferred payment option:',
        [], 'payment-setup'
      )
    }, 500)
  }

  const handlePaymentSelection = (payment: string) => {
    const names: Record<string,string> = { 'credit-card': 'Credit Card', 'paypal': 'PayPal', 'bank-transfer': 'Bank Transfer', 'crypto': 'Crypto Wallet' }
    addUserMessage(`Activate ${names[payment] || payment}`)
    setPendingPayment(payment)
    setShowConsentModal(true)
  }

  const handleConsentAgreed = () => {
    setTimeout(() => {
      addBotMessage('✅ **Payment method activated!** You\'re all set to book your first trip.')
      setCompletedSteps(prev => new Set([...prev, 'payment']))
      setTimeout(() => showOnboardingCompletion(), 2000)
    }, 1000)
  }

  const showOnboardingCompletion = () => {
    setTimeout(() => {
      addBotMessage('🎉 **Congratulations!** Your Zen Travel account is fully set up and ready to go!\n\nYou can now explore destinations, create AI-powered itineraries, and book seamless travel experiences.')
    }, 500)
    setTimeout(() => {
      addBotMessage(
        'Ready to explore? Click below to start your journey!',
        [{ id: 'go-home', text: '🚀 Start Exploring', icon: <ArrowRight className="w-4 h-4" />, action: () => { setTimeout(() => router.push('/home'), 1000) } }],
        'completion'
      )
    }, 1500)
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = String(messageText || inputMessage || '').trim()
    if (!textToSend && selectedFiles.length === 0) return
    addUserMessage(textToSend, selectedFiles.length > 0 ? [...selectedFiles] : undefined)
    setInputMessage('')
    setSelectedFiles([])
    setIsLoading(true)

    setTimeout(() => {
      addBotMessage(`I received your message: "${textToSend}". Let me help you with that!`)
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleMultiSelect = (messageId: string, optionId: string) => {
    setMultiSelectState(prev => {
      const current = new Set(prev[messageId] || [])
      if (current.has(optionId)) current.delete(optionId)
      else current.add(optionId)
      return { ...prev, [messageId]: current }
    })
  }

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'options': {
        const isAnswered = answeredMessageIds.has(message.id)
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-3 [&>ul]:space-y-1 [&>ul>li]:block"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="space-y-2">
              {message.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={isAnswered ? undefined : option.action}
                  disabled={isAnswered}
                  className={`w-full text-left p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 transition-all duration-200 flex items-center space-x-3 ${
                    isAnswered
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white hover:border-blue-300'
                  }`}
                >
                  {option.icon && <span>{option.icon}</span>}
                  <span className="text-sm text-gray-700">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }
      case 'multi-select': {
        const isAnswered = answeredMessageIds.has(message.id)
        const selected = multiSelectState[message.id] || new Set<string>()
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-3"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="space-y-2">
              {message.multiOptions?.map(opt => {
                const isSelected = selected.has(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={isAnswered ? undefined : () => toggleMultiSelect(message.id, opt.id)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3 bg-white/80 backdrop-blur-sm rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                      isSelected
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${isAnswered ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </span>
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </button>
                )
              })}
            </div>
            {!isAnswered && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => message.multiOnSave?.(Array.from(selected))}
                  disabled={selected.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Save & Continue
                </button>
              </div>
            )}
          </div>
        )
      }
      case 'text-input': {
        const isAnswered = answeredMessageIds.has(message.id)
        const currentText = textInputState[message.id] || ''
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-3"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <textarea
              value={currentText}
              onChange={(e) => setTextInputState(prev => ({ ...prev, [message.id]: e.target.value }))}
              placeholder={message.textPlaceholder}
              disabled={isAnswered}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm ${
                isAnswered ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'
              }`}
            />
            {!isAnswered && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => message.textOnSave?.(currentText)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Save & Continue
                </button>
              </div>
            )}
          </div>
        )
      }
      case 'form':
        return (
          <div className="mt-3">
            {message.text && <div className="text-sm leading-relaxed mb-4 ml-2"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { l: 'Full Name', p: 'Your full name' },
                    { l: 'Phone', p: '+60 12 345 6789' },
                    { l: 'Nationality', p: 'Malaysian' },
                    { l: 'Passport Number', p: 'A12345678' },
                    { l: 'MBTI', p: 'e.g., INFJ, ENTP' },
                    { l: 'Email Address', p: 'you@example.com' },
                  ].map(f => (
                    <div key={f.l}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>
                      <input type="text" placeholder={f.p} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => { setCompletedSteps(prev => new Set([...prev, 'profile'])); addBotMessage('✅ **Profile saved!** Here\'s your updated checklist:', [], 'checklist') }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Save & Continue</button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'checklist':
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-4"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="space-y-4 mt-3 w-full">
              {[
                { id: 'profile', title: '📝 Step 1: Traveller Profile', description: 'Set up your personal details', completed: completedSteps.has('profile'), action: () => handleProfileSetup() },
                { id: 'preferences', title: '🌍 Step 2: Travel Preferences', description: 'Configure your travel style', completed: completedSteps.has('preferences'), action: () => handlePreferencesSetup() },
                { id: 'payment', title: '💳 Step 3: Payment Setup', description: 'Add your payment method', completed: completedSteps.has('payment'), action: () => handlePaymentSetup() },
              ].map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200">
                  <div className="flex flex-col mb-2 sm:mb-0">
                    <span className="text-base font-semibold text-gray-800">{item.title}</span>
                    <span className="text-sm text-gray-600">{item.description}</span>
                  </div>
                  {!item.completed ? (
                    <button onClick={item.action} className="ml-6 px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-fit">Start Now</button>
                  ) : (
                    <div className="ml-6 px-5 py-2 bg-gray-400 text-white text-sm rounded-md w-fit font-medium">Done ✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      case 'payment-setup':
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-4"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {[
                { id: 'credit-card', name: '💳 Credit Card', description: 'Visa, Mastercard, Amex', icon: <CreditCard className="w-6 h-6" /> },
                { id: 'paypal', name: '🅿️ PayPal', description: 'Fast online payments', icon: <Globe className="w-6 h-6" /> },
                { id: 'bank-transfer', name: '🏦 Bank Transfer', description: 'Direct bank payment', icon: <Banknote className="w-6 h-6" /> },
                { id: 'crypto', name: '₿ Crypto Wallet', description: 'Bitcoin, Ethereum', icon: <QrCode className="w-6 h-6" /> },
              ].map(opt => (
                <div key={opt.id} className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-blue-600">{opt.icon}</span>
                    <h4 className="font-medium text-gray-800">{opt.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{opt.description}</p>
                  <button onClick={() => handlePaymentSelection(opt.id)} className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">Activate</button>
                </div>
              ))}
            </div>
          </div>
        )
      case 'completion':
        return (
          <div className="space-y-3 mt-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Onboarding Complete!</span>
              </div>
              <p className="text-sm text-green-700">Your Zen Travel account is fully set up.</p>
            </div>
            {message.options?.map(option => (
              <button key={option.id} onClick={option.action}
                className="w-full text-left p-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-3 font-medium">
                {option.icon && <span>{option.icon}</span>}
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        )
      default:
        return (
          <div>
            <div className="text-sm leading-relaxed"><ReactMarkdown>{message.text}</ReactMarkdown></div>
            {message.files && message.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.files.map((file, i) => (
                  <div key={i} className={`flex items-center space-x-2 p-2 rounded-lg ${message.sender === 'user' ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <Paperclip className="w-4 h-4" /><span className="text-xs truncate">{file.name}</span>
                    <span className="text-xs opacity-70">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground />

      {/* Skip Onboarding Button */}
      <div className="absolute top-6 left-16 z-20">
        <button onClick={() => router.push('/home')} className="bg-white/30 backdrop-blur-md text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-white/50 transition-colors">
          Skip Onboarding
        </button>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Side - Avatar Section */}
        <div className="w-1/2 flex flex-col items-center justify-center p-8">
          <h2 className="text-xl md:text-3xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Travel Onboarding Assistant
            </span>
          </h2>
          {/* Avatar Container - Robot Fallback */}
          <div className="relative mb-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <div className="w-44 h-44 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-20 h-20 text-white" />
              </div>
            </div>
            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-300/30 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-3 rounded-full border border-blue-300/20 animate-ping" style={{ animationDuration: '4s' }} />
          </div>

          {/* Avatar Status */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Assistant Ready</span>
            </div>
            {isAvatarSpeaking && (
              <div className="mt-2 px-4 py-1 bg-purple-100 rounded-full text-xs text-purple-700">
                Speaking...
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Interface */}
        <div className="w-1/2 flex flex-col px-8 py-6">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200'
                    }`}>
                      {renderMessageContent(message)}
                      <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-6">
            {selectedFiles.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700 truncate max-w-32">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors" title="Attach file">
                  <Upload className="w-5 h-5" />
                </button>
                <button className="p-3 text-gray-300 rounded-full cursor-not-allowed" title="Voice (coming soon)">
                  <Mic className="w-5 h-5" />
                </button>
                <button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() && selectedFiles.length === 0}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105" title="Send message">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="*/*" />
            <p className="text-xs text-gray-500 mt-2 text-center">Type your message or select an option above</p>
          </div>
        </div>
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 mb-6">By activating this payment method, you agree to our terms of service and privacy policy.</p>
              <div className="flex space-x-3">
                <button onClick={() => { setShowConsentModal(false); setPendingPayment('') }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Decline</button>
                <button onClick={() => { setShowConsentModal(false); handleConsentAgreed() }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">I Agree</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for avatar animation */}
      <style jsx>{`
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          50% { transform: scale(1.1); box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.5); }
        }
        .animate-avatar-pulse { animation: avatarPulse 3s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
