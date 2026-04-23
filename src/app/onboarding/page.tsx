'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Upload, Paperclip, X, CheckCircle, Circle, ArrowRight, CreditCard, Globe, FileText, Banknote, QrCode, Mic } from 'lucide-react'
import VoiceOrb from '@/components/ui/VoiceOrb'
import { useLanguage } from '@/contexts/LanguageContext'
import GradientBackground from "@/components/backgrounds/GradientBackground"
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  options?: ChatOption[]
  type?: 'text' | 'options' | 'form' | 'checklist' | 'payment-setup' | 'completion'
  files?: File[]
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const welcomeTriggeredRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  // Trigger welcome on mount
  useEffect(() => {
    if (!welcomeTriggeredRef.current) {
      welcomeTriggeredRef.current = true
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: '**Welcome to Zen Travel!** 🌍✈️\n\nI\'m your Travel Onboarding Assistant. I\'ll help you set up your account and get started with your travel planning journey.\n\nWhere are you in your travel journey?',
          sender: 'bot',
          type: 'options',
          options: [
            { id: 'just-starting', text: '🆕 Just starting to plan', icon: <Circle className="w-4 h-4" />, action: () => handleJourneySelection('just-starting') },
            { id: 'have-passport', text: '📋 Have passport ready', icon: <Circle className="w-4 h-4" />, action: () => handleJourneySelection('have-passport') },
            { id: 'frequent-traveller', text: '✈️ Frequent traveller', icon: <Circle className="w-4 h-4" />, action: () => handleJourneySelection('frequent-traveller') },
            { id: 'first-trip', text: '🌟 Planning first trip', icon: <Circle className="w-4 h-4" />, action: () => handleJourneySelection('first-trip') },
          ]
        }
        setMessages([welcomeMessage])
      }, 800)
    }
  }, [])

  const addBotMessage = (text: string, options?: ChatOption[], type?: Message['type']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      options,
      type: type || (options ? 'options' : 'text'),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (text: string, files?: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      files
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleJourneySelection = (journey: string) => {
    const labels: Record<string,string> = {
      'just-starting': '🆕 Just starting to plan',
      'have-passport': '📋 Have passport ready',
      'frequent-traveller': '✈️ Frequent traveller',
      'first-trip': '🌟 Planning first trip'
    }
    addUserMessage(labels[journey] || journey)
    setUserData((prev: any) => ({ ...prev, journey }))

    setTimeout(() => {
      addBotMessage(
        '**Great choice!** 🎉\n\nLet me help you get set up. Here\'s your onboarding checklist. Complete each step to unlock your full travel experience:',
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

  const handlePreferencesSetup = () => {
    addUserMessage('🌍 Set travel preferences')
    setTimeout(() => {
      addBotMessage(
        '**Setting up your travel preferences...**\n\nI\'m configuring your preferred destinations and travel style based on your profile.',
        [], 'text'
      )
    }, 500)
    setTimeout(() => {
      addBotMessage('✅ **Travel preferences saved!** Your AI itinerary planner will now use these preferences.')
      setCompletedSteps(prev => new Set([...prev, 'preferences']))
      setTimeout(() => addBotMessage('Here\'s your updated checklist:', [], 'checklist'), 800)
    }, 2000)
  }

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

    // Simple echo response
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

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'options':
        return (
          <div>
            {message.text && <div className="text-sm leading-relaxed mb-3 [&>ul]:space-y-1 [&>ul>li]:block"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="space-y-2">
              {message.options?.map((option) => (
                <button key={option.id} onClick={option.action}
                  className="w-full text-left p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200 flex items-center space-x-3">
                  {option.icon && <span>{option.icon}</span>}
                  <span className="text-sm text-gray-700">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        )
      case 'form':
        return (
          <div className="mt-3">
            {message.text && <div className="text-sm leading-relaxed mb-4 ml-2"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{l:'Full Name',p:'Your full name'},{l:'Phone',p:'+60 12 345 6789'},{l:'Nationality',p:'Malaysian'},{l:'Passport Number',p:'A12345678'}].map(f=>(
                    <div key={f.l}><label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label><input type="text" placeholder={f.p} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div>
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
        {/* Left Side - Voice Orb Section */}
        <div className="w-1/2 flex flex-col items-center justify-center p-8 gap-0">
          {/* Title — sits above the orb */}
          <h2 className="text-xl md:text-3xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Travel Onboarding Assistant
            </span>
          </h2>

          {/* Voice Orb — replaces the old gradient circle + Bot icon */}
          <div style={{ width: '18em', height: '18em', position: 'relative' }}>
            <VoiceOrb />
          </div>

          {/* Status — sits below the orb */}
          <div className="text-center mt-4">
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
