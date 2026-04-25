'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'ms' | 'zh'

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.plan-trip': 'Plan Trip',
    'nav.onboarding': 'Get Started',
    'nav.profile': 'Profile',
    'nav.logout': 'Sign Out',

    // Hero
    'hero.badge': 'AI-Powered Travel Planning',
    'hero.title.main': 'Your Journey,',
    'hero.title.sub': 'Perfectly Crafted.',
    'hero.description.main': 'Discover the world with personalised AI itineraries, expert curation, and seamless booking.',
    'hero.description.sub': 'Every trip, an unforgettable story.',
    'hero.button': 'Start Planning',
    'hero.benefit.ai': 'AI Itinerary Builder',
    'hero.benefit.secure': 'Secure Face Check-in',

    // Features
    'features.title': 'Travel Smarter, Travel Better',
    'features.subtitle': 'Everything you need to plan and experience the perfect journey.',
    'features.ai.title': 'AI Itinerary Planning',
    'features.ai.desc': 'Tell us your dream and our AI crafts a bespoke day-by-day itinerary tailored to your style.',
    'features.face.title': 'Face Recognition Check-in',
    'features.face.desc': 'Secure, instant identity verification powered by AWS Rekognition — no queues, no hassle.',
    'features.booking.title': 'Smart Booking',
    'features.booking.desc': 'Hotels, flights, experiences — book everything in one place with real-time availability.',
    'features.concierge.title': '24/7 Travel Concierge',
    'features.concierge.desc': 'Our AI travel assistant is always on hand to answer questions and refine your plans.',

    // CTA
    'cta.title': 'Ready to Explore?',
    'cta.subtitle': 'Join thousands of travellers who plan smarter with Zen Travel.',
    'cta.button': 'Begin Your Journey',

    // Testimonials
    'testimonials.title': 'Stories from Our Travellers',
    'testimonials.subtitle': 'Real experiences from real people who discovered the world with Zen Travel.',

    // Onboarding
    'onboarding.business_setup': 'Traveller Onboarding',
    'onboarding.step_of': 'Step {current} of {total}',
    'onboarding.step1.title': 'Your Profile',
    'onboarding.step1.subtitle': 'Identity',
    'onboarding.step1.description': 'Tell us about yourself',
    'onboarding.step2.title': 'Preferences',
    'onboarding.step2.subtitle': 'Travel Style',
    'onboarding.step2.description': 'Your dream destinations',
    'onboarding.step3.title': 'Verification',
    'onboarding.step3.subtitle': 'Identity Check',
    'onboarding.step3.description': 'Secure your account',
    'onboarding.step4.title': 'Payment',
    'onboarding.step4.subtitle': 'Billing Setup',
    'onboarding.step4.description': 'Set up payment method',
    'onboarding.reset': 'Reset',
    'onboarding.save': 'Save',
    'onboarding.check': 'Check',
    'onboarding.click_any_step': 'Click any step to navigate',

    // Onboarding chat flow
    'onboarding.skip': 'Skip Onboarding',
    'onboarding.welcome': '🌍✈️ **Welcome to Zen Travel!**\n\nI\'m your Personal Travel Concierge — here to craft journeys that truly fit you.',
    'onboarding.begin_journey': '✨ Begin My Journey',
    'onboarding.get_started': 'Let\'s get you set up! Complete the checklist below to unlock your full travel experience:',
    'onboarding.save_continue': 'Save & Continue',

    // Profile
    'onboarding.profile.cta': '📝 Set up my profile',
    'onboarding.profile.intro': '**Let\'s set up your traveller profile!**\n\nPlease fill in your details below:',
    'onboarding.profile.saved': '✅ **Profile saved!** Here\'s your updated checklist:',
    'onboarding.profile.field.full_name': 'Full Name',
    'onboarding.profile.field.phone': 'Phone',
    'onboarding.profile.field.nationality': 'Nationality',
    'onboarding.profile.field.passport': 'Passport Number',
    'onboarding.profile.field.mbti': 'MBTI',
    'onboarding.profile.field.email': 'Email Address',
    'onboarding.profile.field.full_name.placeholder': 'Your full name',
    'onboarding.profile.field.phone.placeholder': '+60 12 345 6789',
    'onboarding.profile.field.nationality.placeholder': 'Malaysian',
    'onboarding.profile.field.passport.placeholder': 'A12345678',
    'onboarding.profile.field.mbti.placeholder': 'e.g., INFJ, ENTP',
    'onboarding.profile.field.email.placeholder': 'you@example.com',

    // Checklist
    'onboarding.checklist.step1.title': '📝 Step 1: Traveller Profile',
    'onboarding.checklist.step1.desc': 'Set up your personal details',
    'onboarding.checklist.step2.title': '🌍 Step 2: Travel Preferences',
    'onboarding.checklist.step2.desc': 'Configure your travel style',
    'onboarding.checklist.step3.title': '💳 Step 3: Payment Setup',
    'onboarding.checklist.step3.desc': 'Add your payment method',
    'onboarding.checklist.locked': 'Locked 🔒',
    'onboarding.checklist.start': 'Start Now',
    'onboarding.checklist.done': 'Done ✓',
    'onboarding.checklist.updated': 'Here\'s your updated checklist:',

    // Preferences
    'onboarding.pref.cta': '🌍 Set travel preferences',
    'onboarding.pref.intro': 'Help me understand your travel style so I can plan the perfect trip for you.',
    'onboarding.pref.q1': '🧭 **1. What\'s your travel pace?**',
    'onboarding.pref.q1.packed': '🔥 Packed & Explorative — I want to see everything',
    'onboarding.pref.q1.leisure': '🌿 Leisure & Flexible — I prefer to take it slow',
    'onboarding.pref.q2': '💰 **2. What\'s your budget style?**',
    'onboarding.pref.q2.luxury': '💎 Luxury Splurge — I\'m here to treat myself',
    'onboarding.pref.q2.budget': '💸 Budget-Friendly — Smart spending all the way',
    'onboarding.pref.q3': '🎯 **3. What attracts you to a destination?**\n\n(Choose all that apply, can choose more than 1)',
    'onboarding.pref.q3.scenery': '🌄 Natural Scenery',
    'onboarding.pref.q3.landmarks': '🗼 Famous Landmarks',
    'onboarding.pref.q3.hidden': '🧭 Hidden Gems',
    'onboarding.pref.q3.food': '🍜 Famous Food',
    'onboarding.pref.q3.history': '🏛️ Historical Sites',
    'onboarding.pref.q3.culture': '🎨 Local Culture & Art',
    'onboarding.pref.q4': '⚡ **4. What kind of activities do you prefer?**',
    'onboarding.pref.q4.active': '🧗 Physically Active — Adventure, movement, excitement',
    'onboarding.pref.q4.relaxing': '🧘 Mentally Relaxing — Calm, scenic, and peaceful',
    'onboarding.pref.q5': '🏨 **5. What\'s your accommodation style?**',
    'onboarding.pref.q5.simple': '🛏️ Just a Place to Sleep — Simple & practical',
    'onboarding.pref.q5.experience': '✨ Experience-Focused Stay — Unique hotels & vibes',
    'onboarding.pref.q6': '🍽️ **6. How important is food during your trip?**',
    'onboarding.pref.q6.fuel': '⛽ Food is Fuel — Just something to keep me going',
    'onboarding.pref.q6.destination': '🍜 Food is the Destination — I travel for the food',
    'onboarding.pref.q7': '⚠️ **7. Any dietary restrictions or dislikes?**\n\n(Allergies, preferences, or foods you avoid)',
    'onboarding.pref.q7.placeholder': 'e.g., vegetarian, no seafood, nut allergy...',
    'onboarding.pref.q8': '✈️ **8. What\'s your preferred flight class?**',
    'onboarding.pref.q8.economy': '🪑 Economy — Practical and cost-effective',
    'onboarding.pref.q8.business': '💺 Business — Comfort and premium service',
    'onboarding.pref.done': '🎉 **All Set!**\n\n✅ **Travel Preferences Saved!**\n\nYour AI Itinerary Planner will now craft trips tailored exactly to your style, interests, and needs. Fret not! You can always head to your profile and update your preference',

    // Payment
    'onboarding.payment.cta': '💳 Set up payment',
    'onboarding.payment.intro': '**Let\'s set up your payment method.**\n\nChoose your preferred payment option:',
    'onboarding.payment.done': '✅ **Payment method activated!** You\'re all set to book your first trip.',
    'onboarding.payment.credit_card': '💳 Credit Card',
    'onboarding.payment.credit_card.desc': 'Visa, Mastercard, Amex',
    'onboarding.payment.paypal': '🅿️ PayPal',
    'onboarding.payment.paypal.desc': 'Fast online payments',
    'onboarding.payment.bank': '🏦 Bank Transfer',
    'onboarding.payment.bank.desc': 'Direct bank payment',
    'onboarding.payment.crypto': '₿ Crypto Wallet',
    'onboarding.payment.crypto.desc': 'Bitcoin, Ethereum',
    'onboarding.payment.activate': 'Activate',

    // Completion
    'onboarding.complete.msg': '🎉 **Congratulations!** Your Zen Travel account is fully set up and ready to go!\n\nYou can now explore destinations, create AI-powered itineraries, and book seamless travel experiences.',
    'onboarding.complete.cta_msg': 'Ready to explore? Click below to start your journey!',
    'onboarding.complete.cta': '✨ Start Exploring',
    'onboarding.complete.done': 'Onboarding Complete!',
    'onboarding.complete.done_msg': 'Your Zen Travel account is fully set up.',

    // Credit card modal
    'onboarding.card.title': 'Add Credit Card',
    'onboarding.card.subtitle': 'Securely add your card details',
    'onboarding.card.number': 'Card Number',
    'onboarding.card.name': 'Cardholder Name',
    'onboarding.card.name_placeholder': 'As it appears on card',
    'onboarding.card.expiry': 'Expiry',
    'onboarding.card.cvv': 'CVV',
    'onboarding.card.cancel': 'Cancel',
    'onboarding.card.confirm': 'Confirm Card',
    'onboarding.card.cardholder': 'Cardholder',
    'onboarding.card.expires': 'Expires',

    // Consent modal
    'onboarding.consent.title': 'Terms & Conditions',
    'onboarding.consent.body': 'By activating this payment method, you agree to our terms of service and privacy policy.',
    'onboarding.consent.decline': 'Decline',
    'onboarding.consent.agree': 'I Agree',

    // Voice
    'onboarding.voice.unsupported': '⚠️ Voice input requires Chrome or Edge browser. Please type your preferences instead.',
    'onboarding.voice.saved': '✅ **Voice Preferences Saved!**',
    'onboarding.voice.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'onboarding.voice.listening': '🎤 Listening — speak now...',
    'onboarding.voice.type_or_speak': 'Type a message or click the mic to speak...',
    'onboarding.voice.analyzing': 'Analysing your preferences...',
    'onboarding.voice.click_stop': 'Click mic to stop',
    'onboarding.voice.ready': 'Assistant Ready',
    'onboarding.voice.continue': '*Continue with the questions above, or speak again to add more details.*',

    // Chatbot
    'chatbot.greeting': 'Hello! I\'m your Zen Travel concierge. Where would you like to go? ✈️',
    'chatbot.placeholder': 'Ask me anything about travel...',
    'chatbot.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'chatbot.thinking': 'Planning your adventure...',

    // Face Liveness
    'liveness.title': 'Face Verification',
    'liveness.subtitle': 'Live presence verification',
    'liveness.camera_required': 'Camera Access Required',
    'liveness.camera_desc': 'We need camera access to verify your identity',
    'liveness.start': 'Start Verification',
    'liveness.success': 'Verification Successful!',
    'liveness.success_desc': 'Your identity has been successfully verified',
    'liveness.continue': 'Continue',
    'liveness.failed': 'Verification Failed',
    'liveness.failed_desc': 'Unable to verify your identity. Please try again.',
    'liveness.retry': 'Try Again',
    'liveness.cancel': 'Cancel',
    'liveness.blink': 'Please blink twice slowly',
    'liveness.smile': 'Please smile for 2 seconds',
    'liveness.turn_head': 'Turn your head left, then right',
    'liveness.look_up_down': 'Look up, then look down',
    'liveness.follow': 'Follow the instruction above to continue',

    // Footer
    'footer.copyright': '© 2025 Zen Travel. All rights reserved. Curated Journeys, Crafted for You.',

    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.tagline': 'Effortless • Luxurious • Unforgettable',
    'auth.begin': 'Begin Your Journey',

    // Language toggle
    'language': 'en',
    'language.switch': 'BM',
  },
  ms: {
    // Nav
    'nav.home': 'Utama',
    'nav.plan-trip': 'Rancang Perjalanan',
    'nav.onboarding': 'Mulakan',
    'nav.profile': 'Profil',
    'nav.logout': 'Log Keluar',

    // Hero
    'hero.badge': 'Perancangan Perjalanan Berkuasa AI',
    'hero.title.main': 'Perjalanan Anda,',
    'hero.title.sub': 'Direka Sempurna.',
    'hero.description.main': 'Temui dunia dengan itinerari AI yang diperibadikan, kurasi pakar, dan tempahan lancar.',
    'hero.description.sub': 'Setiap perjalanan, satu cerita yang tidak terlupakan.',
    'hero.button': 'Mula Merancang',
    'hero.benefit.ai': 'Pembina Itinerari AI',
    'hero.benefit.secure': 'Daftar Masuk Muka Selamat',

    // Features
    'features.title': 'Perjalanan Lebih Bijak, Lebih Baik',
    'features.subtitle': 'Semua yang anda perlukan untuk merancang dan mengalami perjalanan sempurna.',
    'features.ai.title': 'Perancangan Itinerari AI',
    'features.ai.desc': 'Beritahu kami impian anda dan AI kami mencipta itinerari hari demi hari yang bespoke.',
    'features.face.title': 'Daftar Masuk Pengecaman Wajah',
    'features.face.desc': 'Pengesahan identiti segera dan selamat, tanpa beratur, tanpa masalah.',
    'features.booking.title': 'Tempahan Pintar',
    'features.booking.desc': 'Hotel, penerbangan, pengalaman — tempah semua dalam satu tempat.',
    'features.concierge.title': 'Konsieur Perjalanan 24/7',
    'features.concierge.desc': 'Pembantu perjalanan AI kami sentiasa bersedia untuk menjawab soalan anda.',

    // CTA
    'cta.title': 'Bersedia untuk Menjelajah?',
    'cta.subtitle': 'Sertai ribuan pengembara yang merancang lebih bijak dengan Zen Travel.',
    'cta.button': 'Mulakan Perjalanan Anda',

    // Testimonials
    'testimonials.title': 'Cerita dari Pengembara Kami',
    'testimonials.subtitle': 'Pengalaman nyata dari orang nyata yang menemui dunia dengan Zen Travel.',

    // Onboarding
    'onboarding.business_setup': 'Pendaftaran Pengembara',
    'onboarding.step_of': 'Langkah {current} dari {total}',
    'onboarding.step1.title': 'Profil Anda',
    'onboarding.step1.subtitle': 'Identiti',
    'onboarding.step1.description': 'Ceritakan tentang diri anda',
    'onboarding.step2.title': 'Keutamaan',
    'onboarding.step2.subtitle': 'Gaya Perjalanan',
    'onboarding.step2.description': 'Destinasi impian anda',
    'onboarding.step3.title': 'Pengesahan',
    'onboarding.step3.subtitle': 'Semakan Identiti',
    'onboarding.step3.description': 'Selamatkan akaun anda',
    'onboarding.step4.title': 'Pembayaran',
    'onboarding.step4.subtitle': 'Persediaan Bil',
    'onboarding.step4.description': 'Sediakan kaedah pembayaran',
    'onboarding.reset': 'Set Semula',
    'onboarding.save': 'Simpan',
    'onboarding.check': 'Semak',
    'onboarding.click_any_step': 'Klik mana-mana langkah untuk navigasi',

    // Onboarding chat flow
    'onboarding.skip': 'Langkau Pendaftaran',
    'onboarding.welcome': '🌍✈️ **Selamat Datang ke Zen Travel!**\n\nSaya Konsieur Perjalanan Peribadi anda — di sini untuk merancang perjalanan yang benar-benar sesuai dengan anda.',
    'onboarding.begin_journey': '✨ Mulakan Perjalanan Saya',
    'onboarding.get_started': 'Mari bermula! Lengkapkan senarai semak di bawah untuk membuka pengalaman perjalanan penuh anda:',
    'onboarding.save_continue': 'Simpan & Teruskan',

    // Profile
    'onboarding.profile.cta': '📝 Sediakan profil saya',
    'onboarding.profile.intro': '**Mari sediakan profil pengembara anda!**\n\nSila isikan maklumat anda di bawah:',
    'onboarding.profile.saved': '✅ **Profil disimpan!** Ini senarai semak anda yang dikemas kini:',
    'onboarding.profile.field.full_name': 'Nama Penuh',
    'onboarding.profile.field.phone': 'Telefon',
    'onboarding.profile.field.nationality': 'Kewarganegaraan',
    'onboarding.profile.field.passport': 'Nombor Pasport',
    'onboarding.profile.field.mbti': 'MBTI',
    'onboarding.profile.field.email': 'Alamat E-mel',
    'onboarding.profile.field.full_name.placeholder': 'Nama penuh anda',
    'onboarding.profile.field.phone.placeholder': '+60 12 345 6789',
    'onboarding.profile.field.nationality.placeholder': 'Malaysia',
    'onboarding.profile.field.passport.placeholder': 'A12345678',
    'onboarding.profile.field.mbti.placeholder': 'cth., INFJ, ENTP',
    'onboarding.profile.field.email.placeholder': 'anda@contoh.com',

    // Checklist
    'onboarding.checklist.step1.title': '📝 Langkah 1: Profil Pengembara',
    'onboarding.checklist.step1.desc': 'Sediakan maklumat peribadi anda',
    'onboarding.checklist.step2.title': '🌍 Langkah 2: Keutamaan Perjalanan',
    'onboarding.checklist.step2.desc': 'Konfigurasikan gaya perjalanan anda',
    'onboarding.checklist.step3.title': '💳 Langkah 3: Persediaan Pembayaran',
    'onboarding.checklist.step3.desc': 'Tambah kaedah pembayaran anda',
    'onboarding.checklist.locked': 'Dikunci 🔒',
    'onboarding.checklist.start': 'Mula Sekarang',
    'onboarding.checklist.done': 'Selesai ✓',
    'onboarding.checklist.updated': 'Ini senarai semak anda yang dikemas kini:',

    // Preferences
    'onboarding.pref.cta': '🌍 Tetapkan keutamaan perjalanan',
    'onboarding.pref.intro': 'Bantu saya memahami gaya perjalanan anda supaya saya dapat merancang perjalanan sempurna untuk anda.',
    'onboarding.pref.q1': '🧭 **1. Apakah kadar perjalanan anda?**',
    'onboarding.pref.q1.packed': '🔥 Padat & Penerokaan — Saya ingin melihat segalanya',
    'onboarding.pref.q1.leisure': '🌿 Santai & Fleksibel — Saya suka bergerak perlahan',
    'onboarding.pref.q2': '💰 **2. Apakah gaya bajet anda?**',
    'onboarding.pref.q2.luxury': '💎 Mewah Teratas — Saya di sini untuk memanjakan diri',
    'onboarding.pref.q2.budget': '💸 Mesra Bajet — Berbelanja bijak sepanjang masa',
    'onboarding.pref.q3': '🎯 **3. Apa yang menarik anda ke sesebuah destinasi?**\n\n(Pilih semua yang berkenaan, boleh pilih lebih dari 1)',
    'onboarding.pref.q3.scenery': '🌄 Pemandangan Alam Semula Jadi',
    'onboarding.pref.q3.landmarks': '🗼 Mercu Tanda Terkenal',
    'onboarding.pref.q3.hidden': '🧭 Permata Tersembunyi',
    'onboarding.pref.q3.food': '🍜 Makanan Terkenal',
    'onboarding.pref.q3.history': '🏛️ Tapak Bersejarah',
    'onboarding.pref.q3.culture': '🎨 Budaya & Seni Tempatan',
    'onboarding.pref.q4': '⚡ **4. Apakah jenis aktiviti yang anda sukai?**',
    'onboarding.pref.q4.active': '🧗 Aktif Fizikal — Pengembaraan, pergerakan, keseronokan',
    'onboarding.pref.q4.relaxing': '🧘 Berehat Mental — Tenang, pemandangan indah, dan damai',
    'onboarding.pref.q5': '🏨 **5. Apakah gaya penginapan anda?**',
    'onboarding.pref.q5.simple': '🛏️ Sekadar Tempat Tidur — Mudah & praktikal',
    'onboarding.pref.q5.experience': '✨ Penginapan Berorientasikan Pengalaman — Hotel unik & suasana istimewa',
    'onboarding.pref.q6': '🍽️ **6. Seberapa penting makanan semasa perjalanan anda?**',
    'onboarding.pref.q6.fuel': '⛽ Makanan adalah Bahan Bakar — Sekadar mengisi tenaga',
    'onboarding.pref.q6.destination': '🍜 Makanan adalah Destinasi — Saya melancong kerana makanan',
    'onboarding.pref.q7': '⚠️ **7. Ada sekatan diet atau pantang larang?**\n\n(Alahan, keutamaan, atau makanan yang anda elakkan)',
    'onboarding.pref.q7.placeholder': 'cth., vegetarian, tiada makanan laut, alahan kacang...',
    'onboarding.pref.q8': '✈️ **8. Apakah kelas penerbangan pilihan anda?**',
    'onboarding.pref.q8.economy': '🪑 Ekonomi — Praktikal dan menjimatkan kos',
    'onboarding.pref.q8.business': '💺 Perniagaan — Keselesaan dan perkhidmatan premium',
    'onboarding.pref.done': '🎉 **Selesai!**\n\n✅ **Keutamaan Perjalanan Disimpan!**\n\nPerancang Itinerari AI anda kini akan merancang perjalanan mengikut gaya, minat, dan keperluan anda. Jangan risau! Anda sentiasa boleh pergi ke profil anda dan kemas kini keutamaan anda',

    // Payment
    'onboarding.payment.cta': '💳 Sediakan pembayaran',
    'onboarding.payment.intro': '**Mari sediakan kaedah pembayaran anda.**\n\nPilih pilihan pembayaran yang anda suka:',
    'onboarding.payment.done': '✅ **Kaedah pembayaran diaktifkan!** Anda sudah bersedia untuk menempah perjalanan pertama anda.',
    'onboarding.payment.credit_card': '💳 Kad Kredit',
    'onboarding.payment.credit_card.desc': 'Visa, Mastercard, Amex',
    'onboarding.payment.paypal': '🅿️ PayPal',
    'onboarding.payment.paypal.desc': 'Pembayaran dalam talian yang pantas',
    'onboarding.payment.bank': '🏦 Pindahan Bank',
    'onboarding.payment.bank.desc': 'Pembayaran terus bank',
    'onboarding.payment.crypto': '₿ Dompet Kripto',
    'onboarding.payment.crypto.desc': 'Bitcoin, Ethereum',
    'onboarding.payment.activate': 'Aktifkan',

    // Completion
    'onboarding.complete.msg': '🎉 **Tahniah!** Akaun Zen Travel anda telah sepenuhnya disediakan dan bersedia!\n\nAnda kini boleh meneroka destinasi, mencipta itinerari berkuasa AI, dan menempah pengalaman perjalanan yang lancar.',
    'onboarding.complete.cta_msg': 'Bersedia untuk menjelajah? Klik di bawah untuk memulakan perjalanan anda!',
    'onboarding.complete.cta': '✨ Mula Menjelajah',
    'onboarding.complete.done': 'Pendaftaran Selesai!',
    'onboarding.complete.done_msg': 'Akaun Zen Travel anda telah sepenuhnya disediakan.',

    // Credit card modal
    'onboarding.card.title': 'Tambah Kad Kredit',
    'onboarding.card.subtitle': 'Tambah maklumat kad anda dengan selamat',
    'onboarding.card.number': 'Nombor Kad',
    'onboarding.card.name': 'Nama Pemegang Kad',
    'onboarding.card.name_placeholder': 'Seperti yang tertera pada kad',
    'onboarding.card.expiry': 'Tarikh Luput',
    'onboarding.card.cvv': 'CVV',
    'onboarding.card.cancel': 'Batal',
    'onboarding.card.confirm': 'Sahkan Kad',
    'onboarding.card.cardholder': 'Pemegang Kad',
    'onboarding.card.expires': 'Luput',

    // Consent modal
    'onboarding.consent.title': 'Terma & Syarat',
    'onboarding.consent.body': 'Dengan mengaktifkan kaedah pembayaran ini, anda bersetuju dengan terma perkhidmatan dan dasar privasi kami.',
    'onboarding.consent.decline': 'Tolak',
    'onboarding.consent.agree': 'Saya Setuju',

    // Voice
    'onboarding.voice.unsupported': '⚠️ Input suara memerlukan pelayar Chrome atau Edge. Sila taip keutamaan anda.',
    'onboarding.voice.saved': '✅ **Keutamaan Suara Disimpan!**',
    'onboarding.voice.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'onboarding.voice.listening': '🎤 Mendengar — bercakap sekarang...',
    'onboarding.voice.type_or_speak': 'Taip mesej atau klik mikrofon untuk bercakap...',
    'onboarding.voice.analyzing': 'Menganalisis keutamaan anda...',
    'onboarding.voice.click_stop': 'Klik mikrofon untuk berhenti',
    'onboarding.voice.ready': 'Pembantu Sedia',
    'onboarding.voice.continue': '*Teruskan dengan soalan di atas, atau bercakap lagi untuk menambah maklumat lanjut.*',

    // Chatbot
    'chatbot.greeting': 'Hai! Saya konsieur perjalanan Zen Travel anda. Ke mana anda ingin pergi? ✈️',
    'chatbot.placeholder': 'Tanya saya apa sahaja tentang perjalanan...',
    'chatbot.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'chatbot.thinking': 'Merancang pengembaraan anda...',

    // Face Liveness
    'liveness.title': 'Pengesahan Wajah',
    'liveness.subtitle': 'Pengesahan kehadiran langsung',
    'liveness.camera_required': 'Akses Kamera Diperlukan',
    'liveness.camera_desc': 'Kami memerlukan akses kamera untuk mengesahkan identiti anda',
    'liveness.start': 'Mula Pengesahan',
    'liveness.success': 'Pengesahan Berjaya!',
    'liveness.success_desc': 'Identiti anda telah berjaya disahkan',
    'liveness.continue': 'Teruskan',
    'liveness.failed': 'Pengesahan Gagal',
    'liveness.failed_desc': 'Tidak dapat mengesahkan identiti anda. Sila cuba lagi.',
    'liveness.retry': 'Cuba Lagi',
    'liveness.cancel': 'Batal',
    'liveness.blink': 'Sila kelip mata dua kali perlahan-lahan',
    'liveness.smile': 'Sila senyum selama 2 saat',
    'liveness.turn_head': 'Pusing kepala ke kiri, kemudian ke kanan',
    'liveness.look_up_down': 'Pandang ke atas, kemudian ke bawah',
    'liveness.follow': 'Ikuti arahan di atas untuk meneruskan',

    // Footer
    'footer.copyright': '© 2025 Zen Travel. Hak cipta terpelihara. Perjalanan Terkurasi, Direka untuk Anda.',

    // Auth
    'auth.login': 'Log Masuk',
    'auth.register': 'Buat Akaun',
    'auth.tagline': 'Mudah • Mewah • Tidak Terlupakan',
    'auth.begin': 'Mulakan Perjalanan Anda',

    // Language toggle
    'language': 'ms',
    'language.switch': 'EN',
  },
  zh: {
    // Nav
    'nav.home': '首页',
    'nav.plan-trip': '规划行程',
    'nav.onboarding': '开始',
    'nav.profile': '个人资料',
    'nav.logout': '退出登录',

    // Hero
    'hero.badge': 'AI 智能旅行规划',
    'hero.title.main': '您的旅程，',
    'hero.title.sub': '完美呈现。',
    'hero.description.main': '探索世界，享受个性化 AI 行程、专家策划和无缝预订体验。',
    'hero.description.sub': '每一次旅行，都是难忘的故事。',
    'hero.button': '开始规划',
    'hero.benefit.ai': 'AI 行程助手',
    'hero.benefit.secure': '人脸安全登录',

    // Features
    'features.title': '更智慧，更美好的旅行',
    'features.subtitle': '规划和体验完美旅程所需的一切。',
    'features.ai.title': 'AI 行程规划',
    'features.ai.desc': '告诉我们您的梦想，AI 为您量身定制逐日行程。',
    'features.face.title': '人脸识别登录',
    'features.face.desc': '由 AWS Rekognition 支持的即时安全身份验证，无需排队，无烦恼。',
    'features.booking.title': '智能预订',
    'features.booking.desc': '酒店、机票、体验——一站式预订，实时查看可用性。',
    'features.concierge.title': '24/7 旅行管家',
    'features.concierge.desc': '我们的 AI 旅行助手随时为您解答问题，完善您的计划。',

    // CTA
    'cta.title': '准备好探索了吗？',
    'cta.subtitle': '加入数千位使用 Zen Travel 智慧规划的旅行者。',
    'cta.button': '开始您的旅程',

    // Testimonials
    'testimonials.title': '来自旅行者的故事',
    'testimonials.subtitle': '真实的人，真实的体验，随 Zen Travel 发现世界。',

    // Onboarding
    'onboarding.business_setup': '旅客注册',
    'onboarding.step_of': '第 {current} 步，共 {total} 步',
    'onboarding.step1.title': '您的资料',
    'onboarding.step1.subtitle': '身份信息',
    'onboarding.step1.description': '告诉我们关于您的信息',
    'onboarding.step2.title': '偏好设置',
    'onboarding.step2.subtitle': '旅行风格',
    'onboarding.step2.description': '您梦想中的目的地',
    'onboarding.step3.title': '身份验证',
    'onboarding.step3.subtitle': '身份核查',
    'onboarding.step3.description': '保护您的账户',
    'onboarding.step4.title': '支付方式',
    'onboarding.step4.subtitle': '账单设置',
    'onboarding.step4.description': '设置支付方式',
    'onboarding.reset': '重置',
    'onboarding.save': '保存',
    'onboarding.check': '检查',
    'onboarding.click_any_step': '点击任意步骤进行导航',

    // Onboarding chat flow
    'onboarding.skip': '跳过注册',
    'onboarding.welcome': '🌍✈️ **欢迎来到 Zen Travel！**\n\n我是您的私人旅行管家——为您量身打造最适合您的旅程。',
    'onboarding.begin_journey': '✨ 开始我的旅程',
    'onboarding.get_started': '让我们开始吧！请完成以下清单，解锁您的完整旅行体验：',
    'onboarding.save_continue': '保存并继续',

    // Profile
    'onboarding.profile.cta': '📝 设置我的资料',
    'onboarding.profile.intro': '**让我们设置您的旅客资料！**\n\n请在下方填写您的详细信息：',
    'onboarding.profile.saved': '✅ **资料已保存！** 以下是您更新的清单：',
    'onboarding.profile.field.full_name': '全名',
    'onboarding.profile.field.phone': '电话号码',
    'onboarding.profile.field.nationality': '国籍',
    'onboarding.profile.field.passport': '护照号码',
    'onboarding.profile.field.mbti': 'MBTI',
    'onboarding.profile.field.email': '电子邮件地址',
    'onboarding.profile.field.full_name.placeholder': '您的全名',
    'onboarding.profile.field.phone.placeholder': '+60 12 345 6789',
    'onboarding.profile.field.nationality.placeholder': '中国',
    'onboarding.profile.field.passport.placeholder': 'E12345678',
    'onboarding.profile.field.mbti.placeholder': '例如：INFJ、ENTP',
    'onboarding.profile.field.email.placeholder': 'you@example.com',

    // Checklist
    'onboarding.checklist.step1.title': '📝 第1步：旅客资料',
    'onboarding.checklist.step1.desc': '设置您的个人详细信息',
    'onboarding.checklist.step2.title': '🌍 第2步：旅行偏好',
    'onboarding.checklist.step2.desc': '配置您的旅行风格',
    'onboarding.checklist.step3.title': '💳 第3步：支付设置',
    'onboarding.checklist.step3.desc': '添加您的支付方式',
    'onboarding.checklist.locked': '已锁定 🔒',
    'onboarding.checklist.start': '立即开始',
    'onboarding.checklist.done': '完成 ✓',
    'onboarding.checklist.updated': '以下是您更新的清单：',

    // Preferences
    'onboarding.pref.cta': '🌍 设置旅行偏好',
    'onboarding.pref.intro': '请帮助我了解您的旅行风格，以便我为您规划完美旅程。',
    'onboarding.pref.q1': '🧭 **1. 您的旅行节奏是？**',
    'onboarding.pref.q1.packed': '🔥 紧凑探索型——我想看遍一切',
    'onboarding.pref.q1.leisure': '🌿 悠闲灵活型——我喜欢慢慢来',
    'onboarding.pref.q2': '💰 **2. 您的预算风格是？**',
    'onboarding.pref.q2.luxury': '💎 奢华享受——我来犒劳自己',
    'onboarding.pref.q2.budget': '💸 精打细算——聪明消费到底',
    'onboarding.pref.q3': '🎯 **3. 什么吸引您去某个目的地？**\n\n（可多选）',
    'onboarding.pref.q3.scenery': '🌄 自然风光',
    'onboarding.pref.q3.landmarks': '🗼 著名地标',
    'onboarding.pref.q3.hidden': '🧭 隐藏宝藏',
    'onboarding.pref.q3.food': '🍜 特色美食',
    'onboarding.pref.q3.history': '🏛️ 历史遗址',
    'onboarding.pref.q3.culture': '🎨 本地文化与艺术',
    'onboarding.pref.q4': '⚡ **4. 您喜欢哪种类型的活动？**',
    'onboarding.pref.q4.active': '🧗 体力活跃型——冒险、运动、刺激',
    'onboarding.pref.q4.relaxing': '🧘 精神放松型——平静、风景、宁静',
    'onboarding.pref.q5': '🏨 **5. 您的住宿风格是？**',
    'onboarding.pref.q5.simple': '🛏️ 只需一个睡觉的地方——简单实用',
    'onboarding.pref.q5.experience': '✨ 注重体验的住宿——独特酒店与氛围',
    'onboarding.pref.q6': '🍽️ **6. 饮食在旅行中对您有多重要？**',
    'onboarding.pref.q6.fuel': '⛽ 食物只是燃料——填饱肚子就好',
    'onboarding.pref.q6.destination': '🍜 食物就是目的地——我为美食而旅行',
    'onboarding.pref.q7': '⚠️ **7. 有饮食限制或忌口吗？**\n\n（过敏、偏好或您不吃的食物）',
    'onboarding.pref.q7.placeholder': '例如：素食、不吃海鲜、坚果过敏...',
    'onboarding.pref.q8': '✈️ **8. 您偏好的舱位是？**',
    'onboarding.pref.q8.economy': '🪑 经济舱——实用又经济',
    'onboarding.pref.q8.business': '💺 商务舱——舒适与优质服务',
    'onboarding.pref.done': '🎉 **全部完成！**\n\n✅ **旅行偏好已保存！**\n\nAI 行程规划师将根据您的风格、兴趣和需求量身定制旅程。放心！您可以随时前往个人资料更新偏好',

    // Payment
    'onboarding.payment.cta': '💳 设置支付方式',
    'onboarding.payment.intro': '**让我们设置您的支付方式。**\n\n选择您偏好的支付选项：',
    'onboarding.payment.done': '✅ **支付方式已激活！** 您已准备好预订第一次旅行。',
    'onboarding.payment.credit_card': '💳 信用卡',
    'onboarding.payment.credit_card.desc': 'Visa、Mastercard、Amex',
    'onboarding.payment.paypal': '🅿️ PayPal',
    'onboarding.payment.paypal.desc': '快速在线支付',
    'onboarding.payment.bank': '🏦 银行转账',
    'onboarding.payment.bank.desc': '直接银行支付',
    'onboarding.payment.crypto': '₿ 加密钱包',
    'onboarding.payment.crypto.desc': '比特币、以太坊',
    'onboarding.payment.activate': '激活',

    // Completion
    'onboarding.complete.msg': '🎉 **恭喜！** 您的 Zen Travel 账户已完全设置好！\n\n您现在可以探索目的地，创建 AI 驱动的行程，并预订顺畅的旅行体验。',
    'onboarding.complete.cta_msg': '准备好探索了吗？点击下方开始您的旅程！',
    'onboarding.complete.cta': '✨ 开始探索',
    'onboarding.complete.done': '注册完成！',
    'onboarding.complete.done_msg': '您的 Zen Travel 账户已完全设置好。',

    // Credit card modal
    'onboarding.card.title': '添加信用卡',
    'onboarding.card.subtitle': '安全添加您的卡片信息',
    'onboarding.card.number': '卡号',
    'onboarding.card.name': '持卡人姓名',
    'onboarding.card.name_placeholder': '与卡上显示的一致',
    'onboarding.card.expiry': '有效期',
    'onboarding.card.cvv': 'CVV',
    'onboarding.card.cancel': '取消',
    'onboarding.card.confirm': '确认卡片',
    'onboarding.card.cardholder': '持卡人',
    'onboarding.card.expires': '有效期至',

    // Consent modal
    'onboarding.consent.title': '条款与条件',
    'onboarding.consent.body': '激活此支付方式即表示您同意我们的服务条款和隐私政策。',
    'onboarding.consent.decline': '拒绝',
    'onboarding.consent.agree': '我同意',

    // Voice
    'onboarding.voice.unsupported': '⚠️ 语音输入需要 Chrome 或 Edge 浏览器。请改为输入您的偏好。',
    'onboarding.voice.saved': '✅ **语音偏好已保存！**',
    'onboarding.voice.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'onboarding.voice.listening': '🎤 正在聆听——请说话...',
    'onboarding.voice.type_or_speak': '输入消息或点击麦克风说话...',
    'onboarding.voice.analyzing': '正在分析您的偏好...',
    'onboarding.voice.click_stop': '点击麦克风停止',
    'onboarding.voice.ready': '助手已就绪',
    'onboarding.voice.continue': '*继续回答上面的问题，或再次说话添加更多详情。*',

    // Chatbot
    'chatbot.greeting': '您好！我是您的 Zen Travel 旅行管家。您想去哪里？✈️',
    'chatbot.placeholder': '向我询问任何旅行问题...',
    'chatbot.error': 'ILMU-GLM-5.1 API DISCONNECTED, please try again later',
    'chatbot.thinking': '正在规划您的旅程...',

    // Face Liveness
    'liveness.title': '人脸验证',
    'liveness.subtitle': '实时存在验证',
    'liveness.camera_required': '需要摄像头访问权限',
    'liveness.camera_desc': '我们需要摄像头访问权限来验证您的身份',
    'liveness.start': '开始验证',
    'liveness.success': '验证成功！',
    'liveness.success_desc': '您的身份已成功验证',
    'liveness.continue': '继续',
    'liveness.failed': '验证失败',
    'liveness.failed_desc': '无法验证您的身份。请重试。',
    'liveness.retry': '重试',
    'liveness.cancel': '取消',
    'liveness.blink': '请缓慢眨眼两次',
    'liveness.smile': '请微笑 2 秒',
    'liveness.turn_head': '将头转向左，然后转向右',
    'liveness.look_up_down': '向上看，然后向下看',
    'liveness.follow': '按照上方指示继续',

    // Footer
    'footer.copyright': '© 2025 Zen Travel. 保留所有权利。精心策划的旅程，专为您而设。',

    // Auth
    'auth.login': '登录',
    'auth.register': '创建账户',
    'auth.tagline': '便捷 • 奢华 • 难忘',
    'auth.begin': '开始您的旅程',

    // Language toggle
    'language': 'zh',
    'language.switch': 'EN',
  },
}

export type { Language }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
