'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Upload, Paperclip, X, Compass, CheckCircle, ArrowRight, CreditCard, Globe, FileText, Banknote, QrCode, Mic, MicOff } from 'lucide-react'
import { useLanguage, Language } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { saveUserPreferences } from '@/lib/user-preferences'
import { OnboardingStorage } from '@/lib/onboarding-storage'

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
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [, setUserData] = useState<any>({})
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [, setPendingPayment] = useState<string>('')
  const [answeredMessageIds, setAnsweredMessageIds] = useState<Set<string>>(new Set())
  const [multiSelectState, setMultiSelectState] = useState<Record<string, Set<string>>>({})
  const [textInputState, setTextInputState] = useState<Record<string, string>>({})
  const [profileFormState, setProfileFormState] = useState<Record<string, string>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false)
  const [showCreditCardModal, setShowCreditCardModal] = useState(false)
  const [creditCard, setCreditCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [showLangPicker, setShowLangPicker] = useState(false)

  const LANGUAGES: { code: Language | string; flag: string; label: string; available: boolean }[] = [
    { code: 'en', flag: '🇬🇧', label: 'English',           available: true  },
    { code: 'ms', flag: '🇲🇾', label: 'Bahasa Melayu',     available: true  },
    { code: 'zh', flag: '🇨🇳', label: '中文',               available: true  },
    { code: 'ja', flag: '🇯🇵', label: '日本語',              available: false },
    { code: 'ko', flag: '🇰🇷', label: '한국어',              available: false },
    { code: 'fr', flag: '🇫🇷', label: 'Français',           available: false },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch',            available: false },
    { code: 'es', flag: '🇪🇸', label: 'Español',            available: false },
    { code: 'id', flag: '🇮🇩', label: 'Bahasa Indonesia',   available: false },
    { code: 'ar', flag: '🇸🇦', label: 'العربية',            available: false },
  ]

  const LANG_META: Record<string, { flag: string; short: string }> = {
    en: { flag: '🇬🇧', short: 'EN'   },
    ms: { flag: '🇲🇾', short: 'BM'   },
    zh: { flag: '🇨🇳', short: '中文' },
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const welcomeTriggeredRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const voiceTranscriptRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const genId = (prefix: string = 'm') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // When language toggles, reset the whole conversation so every stored string re-renders in the new language
  useEffect(() => {
    if (!welcomeTriggeredRef.current) return // skip initial mount — handled by the welcome effect below
    welcomeTriggeredRef.current = false
    setMessages([])
    setCompletedSteps(new Set())
    setAnsweredMessageIds(new Set())
    setMultiSelectState({})
    setTextInputState({})
    setProfileFormState({})
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show welcome message on mount and after every language reset
  useEffect(() => {
    if (welcomeTriggeredRef.current) return
    welcomeTriggeredRef.current = true
    const timer = setTimeout(() => {
      const msgId = genId('welcome')
      setMessages([{
        id: msgId,
        text: t('onboarding.welcome'),
        sender: 'bot',
        type: 'options',
        options: [
          { id: 'get-started', text: t('onboarding.begin_journey'), icon: <ArrowRight className="w-4 h-4" />, action: () => handleGetStarted(msgId) },
        ]
      }])
    }, 300)
    return () => clearTimeout(timer)
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

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
    addUserMessage(t('onboarding.begin_journey'))
    setAnsweredMessageIds(prev => new Set([...prev, messageId]))
    setTimeout(() => {
      addBotMessage(t('onboarding.get_started'), [], 'checklist')
    }, 800)
  }

  const handleProfileSetup = () => {
    addUserMessage(t('onboarding.profile.cta'))
    setTimeout(() => {
      addBotMessage(t('onboarding.profile.intro'), [], 'form')
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
    addUserMessage(t('onboarding.pref.cta'))
    setTimeout(() => {
      addBotMessage(t('onboarding.pref.intro'))
      setTimeout(() => askPrefQ1(), 1000)
    }, 500)
  }

  const askPrefQ1 = () => {
    askSinglePreference(
      t('onboarding.pref.q1'),
      [
        { id: 'packed', text: t('onboarding.pref.q1.packed') },
        { id: 'leisure', text: t('onboarding.pref.q1.leisure') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, pace: id })); askPrefQ2() }
    )
  }

  const askPrefQ2 = () => {
    askSinglePreference(
      t('onboarding.pref.q2'),
      [
        { id: 'luxury', text: t('onboarding.pref.q2.luxury') },
        { id: 'budget', text: t('onboarding.pref.q2.budget') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, budget: id })); askPrefQ3() }
    )
  }

  const askPrefQ3 = () => {
    askMultiPreference(
      t('onboarding.pref.q3'),
      [
        { id: 'scenery', text: t('onboarding.pref.q3.scenery') },
        { id: 'landmarks', text: t('onboarding.pref.q3.landmarks') },
        { id: 'hidden', text: t('onboarding.pref.q3.hidden') },
        { id: 'food', text: t('onboarding.pref.q3.food') },
        { id: 'history', text: t('onboarding.pref.q3.history') },
        { id: 'culture', text: t('onboarding.pref.q3.culture') },
      ],
      (selected) => { setUserData((p: any) => ({ ...p, attractions: selected.map(s => s.id) })); askPrefQ4() }
    )
  }

  const askPrefQ4 = () => {
    askSinglePreference(
      t('onboarding.pref.q4'),
      [
        { id: 'active', text: t('onboarding.pref.q4.active') },
        { id: 'relaxing', text: t('onboarding.pref.q4.relaxing') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, activities: id })); askPrefQ5() }
    )
  }

  const askPrefQ5 = () => {
    askSinglePreference(
      t('onboarding.pref.q5'),
      [
        { id: 'simple', text: t('onboarding.pref.q5.simple') },
        { id: 'experience', text: t('onboarding.pref.q5.experience') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, accommodation: id })); askPrefQ6() }
    )
  }

  const askPrefQ6 = () => {
    askSinglePreference(
      t('onboarding.pref.q6'),
      [
        { id: 'fuel', text: t('onboarding.pref.q6.fuel') },
        { id: 'destination', text: t('onboarding.pref.q6.destination') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, food: id })); askPrefQ7() }
    )
  }

  const askPrefQ7 = () => {
    askTextPreference(
      t('onboarding.pref.q7'),
      t('onboarding.pref.q7.placeholder'),
      (text) => { setUserData((p: any) => ({ ...p, dietary: text })); askPrefQ8() }
    )
  }

  const askPrefQ8 = () => {
    askSinglePreference(
      t('onboarding.pref.q8'),
      [
        { id: 'economy', text: t('onboarding.pref.q8.economy') },
        { id: 'business', text: t('onboarding.pref.q8.business') },
      ],
      (id) => { setUserData((p: any) => ({ ...p, flightClass: id })); finishPreferences() }
    )
  }

  const finishPreferences = () => {
    setUserData((p: any) => {
      const next = { ...p }
      saveUserPreferences({
        pace: next.pace,
        budget: next.budget,
        attractions: next.attractions,
        activities: next.activities,
        accommodation: next.accommodation,
        food: next.food,
        dietary: next.dietary,
        flightClass: next.flightClass,
      })
      return next
    })
    setTimeout(() => {
      addBotMessage(t('onboarding.pref.done'))
      setCompletedSteps(prev => new Set([...prev, 'preferences']))
      setTimeout(() => {
        addBotMessage(t('onboarding.checklist.updated'), [], 'checklist')
      }, 1500)
    }, 500)
  }

  // ============ Payment Flow ============

  const handlePaymentSetup = () => {
    addUserMessage(t('onboarding.payment.cta'))
    setTimeout(() => {
      addBotMessage(t('onboarding.payment.intro'), [], 'payment-setup')
    }, 500)
  }

  // ============ Credit Card Helpers ============

  const fmtCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const fmtExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const cardDisplayNumber = (num: string) => {
    const digits = num.replace(/\D/g, '').padEnd(16, '•')
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`
  }

  const creditCardComplete =
    creditCard.number.replace(/\D/g, '').length === 16 &&
    creditCard.name.trim().length >= 2 &&
    creditCard.expiry.length === 5 &&
    creditCard.cvv.replace(/\D/g, '').length >= 3

  const handlePaymentSelection = (payment: string) => {
    const names: Record<string, string> = {
      'credit-card': t('onboarding.payment.credit_card'),
      'paypal': t('onboarding.payment.paypal'),
      'bank-transfer': t('onboarding.payment.bank'),
      'crypto': t('onboarding.payment.crypto'),
    }
    addUserMessage(`${t('onboarding.payment.activate')} ${names[payment] || payment}`)
    setPendingPayment(payment)
    if (payment === 'credit-card') {
      setCreditCard({ number: '', name: '', expiry: '', cvv: '' })
      setShowCreditCardModal(true)
    } else {
      setShowConsentModal(true)
    }
  }

  const handleConsentAgreed = () => {
    setTimeout(() => {
      addBotMessage(t('onboarding.payment.done'))
      setCompletedSteps(prev => new Set([...prev, 'payment']))
      setTimeout(() => showOnboardingCompletion(), 2000)
    }, 1000)
  }

  const showOnboardingCompletion = () => {
    setTimeout(() => {
      addBotMessage(t('onboarding.complete.msg'))
    }, 500)
    setTimeout(() => {
      addBotMessage(
        t('onboarding.complete.cta_msg'),
        [{ id: 'go-home', text: t('onboarding.complete.cta'), icon: <ArrowRight className="w-4 h-4" />, action: () => { setTimeout(() => router.push('/home'), 1000) } }],
        'completion'
      )
    }, 1500)
  }

  // ============ Voice Input ============

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopVoiceInput()
    } else {
      startVoiceInput()
    }
  }

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      addBotMessage(t('onboarding.voice.unsupported'))
      return
    }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    voiceTranscriptRef.current = ''

    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript
        } else {
          interimText += event.results[i][0].transcript
        }
      }
      voiceTranscriptRef.current = voiceTranscriptRef.current + finalText
      setInputMessage(voiceTranscriptRef.current + interimText)
    }

    recognition.onend = () => {
      setIsRecording(false)
      const transcript = voiceTranscriptRef.current.trim()
      if (transcript) {
        analyzeVoicePreferences(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setInputMessage('')
  }

  const stopVoiceInput = () => {
    recognitionRef.current?.stop()
  }

  const analyzeVoicePreferences = async (transcript: string) => {
    addUserMessage(`🎤 "${transcript}"`)
    setInputMessage('')
    setIsAnalyzingVoice(true)
    setIsLoading(true)

    try {
      const res = await fetch('/api/voice-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()

      setUserData((prev: any) => {
        const next = { ...prev }
        if (data.pace) next.pace = data.pace
        if (data.budget) next.budget = data.budget
        if (data.attractions?.length) next.attractions = data.attractions
        if (data.activities) next.activities = data.activities
        if (data.food) next.food = data.food
        if (typeof data.dietary === 'string' && data.dietary) next.dietary = data.dietary
        saveUserPreferences({
          pace: next.pace, budget: next.budget, attractions: next.attractions,
          activities: next.activities, accommodation: next.accommodation,
          food: next.food, dietary: next.dietary, flightClass: next.flightClass,
        })
        return next
      })

      const summary = data.summary || 'Your travel profile has been updated.'
      addBotMessage(`${t('onboarding.voice.saved')}\n\n${summary}\n\n${t('onboarding.voice.continue')}`)
    } catch {
      addBotMessage(t('onboarding.voice.error'))
    } finally {
      setIsLoading(false)
      setIsAnalyzingVoice(false)
    }
  }

  // ============ General Chat ============

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
                  className={`w-full text-left p-3 bg-white/80 backdrop-blur-sm rounded-lg border transition-all duration-200 flex items-center space-x-3 ${
                    isAnswered
                      ? 'opacity-50 cursor-not-allowed border-gray-200'
                      : 'border-gray-200 hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/5'
                  }`}
                >
                  {option.icon && <span className="text-[#C9A84C]">{option.icon}</span>}
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
                        : 'border-gray-200 hover:border-[#C9A84C]/40'
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
                  className="px-6 py-2 bg-[#C9A84C] text-white rounded-lg hover:bg-[#b8973e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {t('onboarding.save_continue')}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent resize-none text-sm ${
                isAnswered ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'
              }`}
            />
            {!isAnswered && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => message.textOnSave?.(currentText)}
                  className="px-6 py-2 bg-[#C9A84C] text-white rounded-lg hover:bg-[#b8973e] transition-colors font-medium text-sm"
                >
                  Save & Continue
                </button>
              </div>
            )}
          </div>
        )
      }
      case 'form': {
        const isAnswered = answeredMessageIds.has(message.id)
        const fields = [
          { key: 'Full Name',      l: t('onboarding.profile.field.full_name'),   p: t('onboarding.profile.field.full_name.placeholder') },
          { key: 'Phone',          l: t('onboarding.profile.field.phone'),        p: t('onboarding.profile.field.phone.placeholder') },
          { key: 'Nationality',    l: t('onboarding.profile.field.nationality'),  p: t('onboarding.profile.field.nationality.placeholder') },
          { key: 'Passport Number',l: t('onboarding.profile.field.passport'),     p: t('onboarding.profile.field.passport.placeholder') },
          { key: 'MBTI',           l: t('onboarding.profile.field.mbti'),         p: t('onboarding.profile.field.mbti.placeholder') },
          { key: 'Email Address',  l: t('onboarding.profile.field.email'),        p: t('onboarding.profile.field.email.placeholder') },
        ]
        const isFormComplete = fields.every(f => (profileFormState[message.id + f.key] || '').trim() !== '')
        return (
          <div className="mt-3">
            {message.text && <div className="text-sm leading-relaxed mb-4 ml-2"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.l} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder={f.p}
                        value={profileFormState[message.id + f.key] || ''}
                        onChange={(e) => setProfileFormState(prev => ({ ...prev, [message.id + f.key]: e.target.value }))}
                        disabled={isAnswered}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent ${isAnswered ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  ))}
                </div>
                {!isAnswered && (
                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!isFormComplete}
                      onClick={() => {
                        const profileData: Record<string, string> = {}
                        fields.forEach(f => { profileData[f.key] = profileFormState[message.id + f.key] || '' })
                        const existing = OnboardingStorage.load()
                        OnboardingStorage.save({
                          data: { ...(existing?.data ?? {}), ...profileData },
                          currentStep: existing?.currentStep ?? 2,
                          lastUpdated: new Date().toISOString(),
                          completedSteps: [...new Set([...(existing?.completedSteps ?? []), 1])],
                        })
                        setAnsweredMessageIds(prev => new Set([...prev, message.id]))
                        setCompletedSteps(prev => new Set([...prev, 'profile']))
                        addBotMessage(t('onboarding.profile.saved'), [], 'checklist')
                      }}
                      className={`px-6 py-2 rounded-lg transition-colors font-medium text-sm ${isFormComplete ? 'bg-[#C9A84C] text-white hover:bg-[#b8973e]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                      {t('onboarding.save_continue')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
      case 'checklist':
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-4"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="space-y-4 mt-3 w-full">
              {[
                { id: 'profile', title: t('onboarding.checklist.step1.title'), description: t('onboarding.checklist.step1.desc'), completed: completedSteps.has('profile'), locked: false, action: () => handleProfileSetup() },
                { id: 'preferences', title: t('onboarding.checklist.step2.title'), description: t('onboarding.checklist.step2.desc'), completed: completedSteps.has('preferences'), locked: !completedSteps.has('profile'), action: () => handlePreferencesSetup() },
                { id: 'payment', title: t('onboarding.checklist.step3.title'), description: t('onboarding.checklist.step3.desc'), completed: completedSteps.has('payment'), locked: !completedSteps.has('preferences'), action: () => handlePaymentSetup() },
              ].map(item => (
                <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 ${item.locked ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col mb-2 sm:mb-0">
                    <span className="text-base font-semibold text-gray-800">{item.title}</span>
                    <span className="text-sm text-gray-600">{item.description}</span>
                  </div>
                  {!item.completed ? (
                    <button
                      onClick={item.action}
                      disabled={item.locked}
                      className={`ml-6 px-6 py-2 text-sm rounded-md transition-colors w-fit ${item.locked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#C9A84C] text-white hover:bg-[#b8973e]'}`}
                    >
                      {item.locked ? t('onboarding.checklist.locked') : t('onboarding.checklist.start')}
                    </button>
                  ) : (
                    <div className="ml-6 px-5 py-2 bg-emerald-500 text-white text-sm rounded-md w-fit font-medium">{t('onboarding.checklist.done')}</div>
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
                { id: 'credit-card', name: t('onboarding.payment.credit_card'), description: t('onboarding.payment.credit_card.desc'), icon: <CreditCard className="w-6 h-6" /> },
                { id: 'paypal', name: t('onboarding.payment.paypal'), description: t('onboarding.payment.paypal.desc'), icon: <Globe className="w-6 h-6" /> },
                { id: 'bank-transfer', name: t('onboarding.payment.bank'), description: t('onboarding.payment.bank.desc'), icon: <Banknote className="w-6 h-6" /> },
                { id: 'crypto', name: t('onboarding.payment.crypto'), description: t('onboarding.payment.crypto.desc'), icon: <QrCode className="w-6 h-6" /> },
              ].map(opt => (
                <div key={opt.id} className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-[#C9A84C]">{opt.icon}</span>
                    <h4 className="font-medium text-gray-800">{opt.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{opt.description}</p>
                  <button onClick={() => handlePaymentSelection(opt.id)} className="w-full px-3 py-2 bg-[#C9A84C] text-white text-sm rounded-md hover:bg-[#b8973e] transition-colors">{t('onboarding.payment.activate')}</button>
                </div>
              ))}
            </div>
          </div>
        )
      case 'completion':
        return (
          <div className="space-y-3 mt-3">
            <div className="p-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#C9A84C]" />
                <span className="font-medium text-[#1A1A2E]">{t('onboarding.complete.done')}</span>
              </div>
              <p className="text-sm text-gray-700">{t('onboarding.complete.done_msg')}</p>
            </div>
            {message.options?.map(option => (
              <button key={option.id} onClick={option.action}
                className="w-full text-left p-4 bg-gradient-to-r from-[#1A1A2E] to-[#2D2D3D] text-[#F5F0EB] rounded-lg hover:from-[#2D2D3D] hover:to-[#3D3D4D] transition-all duration-200 flex items-center justify-center space-x-3 font-medium border border-[#C9A84C]/30">
                {option.icon && <span className="text-[#C9A84C]">{option.icon}</span>}
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
                  <div key={i} className={`flex items-center space-x-2 p-2 rounded-lg ${message.sender === 'user' ? 'bg-white/10' : 'bg-gray-50'}`}>
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
    <div className="relative h-[calc(100dvh-64px)] overflow-hidden">
      {/* Luxury cream/gold background */}
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(150deg, #F5F0EB 0%, #FAFAFA 55%, #F0EBE3 100%)' }}>
        {/* Left gold radial glow — echoes the avatar */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 25% 50%, rgba(201,168,76,0.13) 0%, transparent 50%)' }} />
        {/* Top-right warm shimmer */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 10%, rgba(201,168,76,0.08) 0%, transparent 40%)' }} />
        {/* Bottom-right subtle depth */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 90% 90%, rgba(26,26,46,0.04) 0%, transparent 45%)' }} />
        {/* Fine dot texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #1A1A2E 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Top bar: Skip + Language toggle */}
      <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(26,26,46,0.07)', color: '#1A1A2E', border: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,26,46,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(26,26,46,0.07)')}
        >
          {t('onboarding.skip')}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{ background: 'rgba(26,26,46,0.07)', color: '#1A1A2E', border: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(8px)' }}
          >
            <span>{LANG_META[language]?.flag ?? '🌐'}</span>
            <span>{LANG_META[language]?.short ?? language.toUpperCase()}</span>
            <svg className={`w-3 h-3 transition-transform duration-200 ${showLangPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>

          <AnimatePresence>
            {showLangPicker && (
              <>
                {/* backdrop to close on outside click */}
                <div className="fixed inset-0 z-30" onClick={() => setShowLangPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-40 w-56 rounded-2xl shadow-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(201,168,76,0.25)', backdropFilter: 'blur(16px)' }}
                >
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Language</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {LANGUAGES.map(lang => {
                      const isActive = language === lang.code
                      return (
                        <button
                          key={lang.code}
                          disabled={!lang.available}
                          onClick={() => {
                            if (lang.available) {
                              setLanguage(lang.code as Language)
                              setShowLangPicker(false)
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isActive
                              ? 'bg-[#1A1A2E] text-white'
                              : 'hover:bg-[#C9A84C]/10 text-[#1A1A2E]'
                          }`}
                        >
                          <span className="text-base leading-none">{lang.flag}</span>
                          <span className="flex-1 text-xs font-semibold">{lang.label}</span>
                          {isActive && (
                            <span className="text-[#C9A84C] text-xs">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex h-full">
        {/* Vertical gold divider between panels */}
        <div className="absolute left-1/2 top-8 bottom-8 w-px pointer-events-none z-20"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.25) 20%, rgba(201,168,76,0.25) 80%, transparent)' }} />

        {/* Left Side — Luxury Avatar */}
        <div className="w-1/2 flex flex-col items-center justify-center p-6 min-h-0 relative">
          {/* Subtle glass panel behind avatar area */}
          <div className="absolute inset-6 rounded-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(201,168,76,0.15)', backdropFilter: 'blur(4px)' }} />
          <h2 className="relative z-10 text-xl md:text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--font-heading, serif)' }}>
            <span style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c96c, #C9A84C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Travel Concierge
            </span>
          </h2>

          {/* Avatar */}
          <div className="relative mb-8" style={{ width: '176px', height: '176px' }}>
            {/* Slow counter-rotating outer ring */}
            <div
              className="absolute animate-orbit pointer-events-none"
              style={{
                inset: '-22px', borderRadius: '50%',
                border: '1px solid transparent',
                borderTopColor: 'rgba(201,168,76,0.25)',
                borderBottomColor: 'rgba(201,168,76,0.12)',
                animationDuration: '14s',
                animationDirection: 'reverse',
              }}
            />
            {/* Fast inner orbital arc */}
            <div
              className="absolute animate-orbit pointer-events-none"
              style={{
                inset: '-10px', borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#C9A84C',
                borderRightColor: 'rgba(201,168,76,0.45)',
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
                animationDuration: '7s',
              }}
            />

            {/* Main avatar circle */}
            <div
              className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden animate-breathe"
              style={{ background: '#1A1A2E', border: '2px solid rgba(201,168,76,0.35)' }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 35% 35%, rgba(201,168,76,0.12) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
              <Compass
                className="w-20 h-20 relative z-10"
                style={{ color: '#C9A84C', filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.65))' }}
              />
            </div>

            {/* Floating particles */}
            <div className="absolute animate-float pointer-events-none" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(201,168,76,0.85)', top: '-5px', left: 'calc(50% - 5px)', animationDelay: '0s', animationDuration: '3s' }} />
            <div className="absolute animate-float pointer-events-none" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(201,168,76,0.55)', bottom: '4px', right: '-3px', animationDelay: '0.9s', animationDuration: '3.5s' }} />
            <div className="absolute animate-float pointer-events-none" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(201,168,76,0.45)', top: '28%', left: '-5px', animationDelay: '1.8s', animationDuration: '2.8s' }} />
            <div className="absolute animate-float pointer-events-none" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(201,168,76,0.3)', bottom: '22%', right: '1px', animationDelay: '2.7s', animationDuration: '3.2s' }} />
          </div>

          {/* Status / Waveform */}
          {isRecording ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-end justify-center space-x-1" style={{ height: '40px' }}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full animate-wave"
                    style={{
                      background: '#C9A84C',
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${0.5 + (i % 3) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: '#C9A84C', animation: 'pulse 1.5s ease-in-out infinite' }}>
                {t('onboarding.voice.listening')}
              </span>
              <span className="text-xs text-gray-400">{t('onboarding.voice.click_stop')}</span>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
                <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">{t('onboarding.voice.ready')}</span>
              </div>
              {isAnalyzingVoice && (
                <p className="text-xs" style={{ color: '#C9A84C' }}>{t('onboarding.voice.analyzing')}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side — Chat Interface */}
        <div className="w-1/2 flex flex-col px-6 py-4 min-h-0 relative">
          {/* Messages */}
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
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'text-[#F5F0EB]'
                          : 'bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200'
                      }`}
                      style={message.sender === 'user' ? { background: '#1A1A2E', border: '1px solid rgba(201,168,76,0.25)' } : {}}
                    >
                      {renderMessageContent(message)}
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-[#F5F0EB]/40' : 'text-gray-400'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#C9A84C', animationDelay: `${delay}s` }} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 p-4">
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

            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={isRecording ? undefined : (e) => setInputMessage(e.target.value)}
                  onKeyDown={isRecording ? undefined : handleKeyDown}
                  readOnly={isRecording}
                  placeholder={isRecording ? t('onboarding.voice.listening') : t('onboarding.voice.type_or_speak')}
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  className={`w-full resize-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    isRecording
                      ? 'border border-red-400 focus:ring-red-300 bg-red-50/40 italic text-gray-600'
                      : 'border border-gray-300 focus:ring-[#C9A84C]'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/8 rounded-full transition-colors"
                  title="Attach file"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleVoiceInput}
                  disabled={isAnalyzingVoice}
                  title={isRecording ? 'Stop recording' : 'Voice input — speak your preferences'}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isRecording
                      ? 'text-white shadow-lg'
                      : isAnalyzingVoice
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-[#C9A84C]/10'
                  }`}
                  style={
                    isRecording
                      ? { background: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }
                      : !isAnalyzingVoice
                        ? { color: '#C9A84C' }
                        : {}
                  }
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() && selectedFiles.length === 0}
                  className="p-2.5 text-white rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: '#C9A84C', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }}
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" accept="*/*" />
          </div>
        </div>
      </div>

      {/* Credit Card Setup Modal */}
      {showCreditCardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: '#1A1A2E', fontFamily: 'var(--font-heading, serif)' }}>{t('onboarding.card.title')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('onboarding.card.subtitle')}</p>
              </div>
              <button
                onClick={() => setShowCreditCardModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Visual card preview */}
              <div
                className="rounded-2xl p-5 relative overflow-hidden select-none"
                style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #252040 50%, #1E1A10 100%)', minHeight: '168px' }}
              >
                {/* Gold shimmer */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 75% 25%, rgba(201,168,76,0.18) 0%, transparent 65%)' }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)' }} />

                {/* Top row: chip + brand */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  {/* EMV chip */}
                  <div className="w-10 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e8c96c 50%, #C9A84C 100%)', boxShadow: '0 2px 6px rgba(201,168,76,0.4)' }}>
                    <div className="w-full h-full rounded-md opacity-40" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)' }} />
                  </div>
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(201,168,76,0.85)' }}>ZEN TRAVEL</span>
                </div>

                {/* Card number */}
                <p className="font-mono text-base tracking-[0.18em] mb-5 relative z-10" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  {cardDisplayNumber(creditCard.number)}
                </p>

                {/* Bottom row: name + expiry */}
                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('onboarding.card.cardholder')}</p>
                    <p className="text-sm tracking-wide font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {creditCard.name.toUpperCase() || 'YOUR NAME'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('onboarding.card.expires')}</p>
                    <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {creditCard.expiry || 'MM/YY'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                {/* Card number */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('onboarding.card.number')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={creditCard.number}
                    onChange={e => setCreditCard(p => ({ ...p, number: fmtCardNumber(e.target.value) }))}
                    maxLength={19}
                    className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: 'rgba(201,168,76,0.3)', '--tw-ring-color': '#C9A84C' } as any}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                  />
                </div>

                {/* Cardholder name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('onboarding.card.name')}</label>
                  <input
                    type="text"
                    placeholder={t('onboarding.card.name_placeholder')}
                    value={creditCard.name}
                    onChange={e => setCreditCard(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('onboarding.card.expiry')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={creditCard.expiry}
                      onChange={e => setCreditCard(p => ({ ...p, expiry: fmtExpiry(e.target.value) }))}
                      maxLength={5}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono focus:outline-none transition-all"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{t('onboarding.card.cvv')}</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="•••"
                      value={creditCard.cvv}
                      onChange={e => setCreditCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      maxLength={4}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono focus:outline-none transition-all"
                      style={{ borderColor: 'rgba(201,168,76,0.3)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreditCardModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('onboarding.card.cancel')}
                </button>
                <button
                  disabled={!creditCardComplete}
                  onClick={() => {
                    setShowCreditCardModal(false)
                    setShowConsentModal(true)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#C9A84C' }}
                  onMouseEnter={e => { if (creditCardComplete) e.currentTarget.style.background = '#b8973e' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C' }}
                >
                  {t('onboarding.card.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.1)' }}>
                <FileText className="w-8 h-8" style={{ color: '#C9A84C' }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('onboarding.consent.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">{t('onboarding.consent.body')}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowConsentModal(false); setPendingPayment('') }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('onboarding.consent.decline')}
                </button>
                <button
                  onClick={() => { setShowConsentModal(false); handleConsentAgreed() }}
                  className="flex-1 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: '#C9A84C' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#b8973e')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
                >
                  {t('onboarding.consent.agree')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.75; }
          50%       { transform: translateY(-9px); opacity: 1; }
        }
        @keyframes wave {
          0%, 100% { height: 4px; }
          50%       { height: 28px; }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.18), 0 20px 40px rgba(0,0,0,0.35); }
          50%       { box-shadow: 0 0 42px rgba(201,168,76,0.42), 0 20px 40px rgba(201,168,76,0.18); }
        }
        .animate-orbit   { animation: orbit linear infinite; }
        .animate-float   { animation: float ease-in-out infinite; }
        .animate-wave    { animation: wave ease-in-out infinite; }
        .animate-breathe { animation: breathe 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
