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
  { id: 'ms1', title: 'Georgetown Heritage site', category: 'Must See', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/93/54/36/caption.jpg?w=1200&h=1200&s=1' },
  { id: 'ms2', title: 'George Town Street Art', category: 'Must See', img: 'https://www.toptravelsights.com/wp-content/uploads/2020/05/Penang-Street-Art-6.jpg' },
  { id: 'ms3', title: 'Penang Hill', category: 'Must See', img: 'https://phbr.penanghill.gov.my/wp-content/uploads/2023/04/Funicular-Train.png' },
  { id: 'ms4', title: 'Batu Ferringhi Beach', category: 'Must See', img: 'https://www.awaygowe.com/wp-content/uploads/2019/10/batu-ferringhi-reasons-featured2.webp' },
  { id: 'ms5', title: 'Kek Lok Si Temple', category: 'Must See', img: 'https://www.asiakingtravel.com/cuploads/files/image-20241004111243-1.jpeg' },
  { id: 'ms6', title: 'Fort Cornwallis', category: 'Must See', img: 'https://image-tc.galaxy.tf/wijpeg-1qb17h2fs6qnppm3kxap6iynh/fort-cornwallis.jpg' },
  { id: 'ms7', title: 'Penang National Park', category: 'Must See', img: 'https://image-tc.galaxy.tf/wiwebp-1id9uitt9at82667rgvqgxuqg/two-people-walking-across-a-suspension-bridge-in-the-jungle-of-penang-national-park.webp' },
  { id: 'ms8', title: 'Penang Bridge', category: 'Must See', img: 'https://image-tc.galaxy.tf/wiwebp-77oehjbfcav8rbb65k1r5ylp/golden-hour-view-of-penang-bridge-across-still-waters_standard.webp?crop=57%2C0%2C867%2C650' },

  // Great Food
  { id: 'gf1', title: 'Char Kuey Teow', category: 'Great Food', img: 'https://rasamalaysia.com/wp-content/uploads/2009/11/char-koay-teow-thumb.jpg' },
  { id: 'gf2', title: 'Assam Laksa', category: 'Great Food', img: 'https://www.unileverfoodsolutions.com.my/dam/global-ufs/mcos/SEA/calcmenu/recipes/MY-recipes/pasta-dishes/penang-asam-laksa/main-header.jpg' },
  { id: 'gf3', title: 'Teochew Chendul', category: 'Great Food', img: 'https://images.squarespace-cdn.com/content/v1/62f1cb15a2cb083186ccd6d1/38891e02-9314-4aa2-9055-1ed9fb243593/Screenshot+2025-06-06+at+9.13.36%E2%80%AFAM.jpg' },
  { id: 'gf4', title: 'Nasi Kandar', category: 'Great Food', img: 'https://images.squarespace-cdn.com/content/v1/5d7f2d797a64971f017f10ff/c53666ab-8cd6-42b2-8db0-7ccde82fd1da/09-05+HAMEEDIYAH+RESTAURANT+CP.png' },
  { id: 'gf5', title: 'Hokkien Mee', category: 'Great Food', img: 'https://www.angsarap.net/wp-content/uploads/2014/12/Penang-Prawn-Mee-Wide.jpg' },
  { id: 'gf6', title: 'Penang Rojak', category: 'Great Food', img: 'https://images.deliveryhero.io/image/fd-my/LH/bmsy-listing.jpg' },
  { id: 'gf7', title: 'Curry Mee', category: 'Great Food', img: 'https://images.deliveryhero.io/image/fd-my/LH/p2os-listing.jpg' },
  { id: 'gf8', title: 'Mee Goreng Mamak', category: 'Great Food', img: 'https://i.ytimg.com/vi/pOJEmDBgtSk/maxresdefault.jpg' },
  { id: 'gf9', title: 'Apom Balik', category: 'Great Food', img: 'https://www.what2seeonline.com/wp-content/uploads/2016/08/DSCF7886.jpg' },
  { id: 'gf10', title: 'Oh Chien (Oyster Omelette)', category: 'Great Food', img: 'https://images.lifestyleasia.com/wp-content/uploads/sites/5/2025/07/25175615/best-oyster-omelette-in-penang-oh-chien-george-town.jpg' },
  { id: 'gf11', title: 'Toast', category: 'Great Food', img: 'https://www.penang-insider.com/livingpenang/wp-content/uploads/2018/03/FEATUREDRoti_Bakar_in_Penang-1.jpg' },
  { id: 'gf12', title: 'Heritage Chinese Cuisine', category: 'Great Food', img: 'https://migrationology.com/wp-content/uploads/2015/06/tek-sen-restaurant-penang.jpg' },
  { id: 'gf13', title: 'Bamboo Noodle', category: 'Great Food', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfxgX5pW0Me3HQS2gslCiXk0V1mDzj9mK5cA&s' },
  { id: 'gf14', title: 'Roti Canai', category: 'Great Food', img: 'https://www.elmundoeats.com/wp-content/uploads/2017/11/Roti-Canai-3-500x500.jpg' },
  { id: 'gf15', title: 'Mee Sotong', category: 'Great Food', img: 'https://cdn.hungryonion.org/original/3X/3/b/3b0583a70d7c2d7956e1a2199c080d9cb6b5104f.JPG' },
  { id: 'gf16', title: 'Green Tomyam Noodle', category: 'Great Food', img: 'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/f28466cd689b48afa63b27f882581d06.jpeg?width=1000' },
  { id: 'gf17', title: 'Chee Cheong Fun (Steam rice rolled with shrimp paste)', category: 'Great Food', img: 'https://asianinspirations.com.au/wp-content/uploads/2023/08/PCCF-7.jpg' },
  { id: 'gf18', title: 'Dimsum', category: 'Great Food', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/23/98/fb/87/dimsum.jpg' },
  { id: 'gf19', title: 'Seafood', category: 'Great Food', img: 'https://penangfoodie.sgp1.digitaloceanspaces.com/2018/01/best-seafood-in-penang.jpg' },
  { id: 'gf20', title: 'Lorbak', category: 'Great Food', img: 'https://cdn.hungryonion.org/original/3X/5/3/53fe49f0901ff4b6b1315b95ec941e2bbe1f129b.jpeg' },
  { id: 'gf21', title: 'Char Koay Kak', category: 'Great Food', img: 'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/bb512c1f41a548969908aebe8328c583.jpeg?width=1000' },
  { id: 'gf22', title: 'Seafood Popiah', category: 'Great Food', img: 'https://apicms.thestar.com.my/uploads/images/2023/06/13/2123105.jpg' },
  { id: 'gf23', title: 'Lok Lok', category: 'Great Food', img: 'https://images.squarespace-cdn.com/content/v1/5d7f2d797a64971f017f10ff/e35f806d-e1d6-4f00-bf31-747d38a9a3aa/09-21+LOK-LOK+IN+PENANG+CP.png' },
  { id: 'gf24', title: 'Koay Teow Th’ng', category: 'Great Food', img: 'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/8c7cb25cbcd64335a9f609e9c808b0de.jpeg?width=1000' },
  { id: 'gf25', title: 'Duck Koay Chap', category: 'Great Food', img: 'https://mypenang.gov.my/uploads/page/51/images/Penang_FoodLifestyle_FB_KueyChiap.jpg' },
  { id: 'gf26', title: 'Pi Pa Duck', category: 'Great Food', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNd44d1bUqaF17MpCWfFXVsoP87v9s7c9Zfw&s' },
  { id: 'gf27', title: 'Yam Rice', category: 'Great Food', img: 'https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/01314cdcf50c4c919285cf049c680001.jpeg' },
  { id: 'gf28', title: 'Durian', category: 'Great Food', img: 'https://media-cdn.tripadvisor.com/media/photo-s/18/a5/66/e2/shan-cheng-durian-penang.jpg' },
  { id: 'gf29', title: 'Nyonya Kuih', category: 'Great Food', img: 'https://mypenang.gov.my/uploads/page/41/images/Penang_FoodLifestyle_FB_NyonyaKuih.jpg' },

  // Hidden Gem
  { id: 'hg1', title: 'Ghost Museum', category: 'Hidden Gem', img: 'https://www.penangbook.my/uploads/experience/Cool%20Ghost%20Museum%20Penang%202_26079-1753667536.jpeg' },
  { id: 'hg2', title: 'Cheong Fatt Tze Mansion', category: 'Hidden Gem', img: 'https://www.cheongfatttzemansion.com/wp-content/uploads/2024/11/cheong_fatt_tze.jpg' },
  { id: 'hg3', title: 'Snake Temple', category: 'Hidden Gem', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/08/e9/88/1c/snake-temple.jpg?w=1200&h=-1&s=1' },
  { id: 'hg4', title: 'Penang 3D Museum', category: 'Hidden Gem', img: 'https://penangtrickart.com/storage/2016/09/viper.jpg' },
  { id: 'hg5', title: 'Tropical Spice Garden', category: 'Hidden Gem', img: 'https://mypenang.gov.my/uploads/directory/39/cover/TSG.jpg' },
  { id: 'hg6', title: 'Avatar Secret Garden', category: 'Hidden Gem', img: 'https://img.atlasobscura.com/NeyinUaEzXTs4dy0jatDQ2AvM6SfzDzkwhx01XJkIHA/rt:fit/h:400/q:81/sm:1/scp:1/ar:1/aHR0cHM6Ly9hdGxh/cy1kZXYuczMuYW1h/em9uYXdzLmNvbS91/cGxvYWRzL3BsYWNl/X2ltYWdlcy81ZTJk/MDIxOS03Nzc0LTRl/ODAtOTVmNi0xNTRh/ZjRlZWY1MGI1OTg3/MWVkNzkzYWZjN2M3/Y2FfODIxREIzQUEt/OTY3NC00NEY3LUE3/RkYtODk1MEYwNDgw/MUM0XzFfMTA1X2Mu/anBlZw.jpg' },
  { id: 'hg7', title: 'Pantai Kerachut', category: 'Hidden Gem', img: 'https://mypenang.gov.my/uploads/directory/55/cover/Penang-National-Park-1.jpg' },
  { id: 'hg8', title: 'Frog Hill', category: 'Hidden Gem', img: 'https://www.agoda.com/wp-content/uploads/2024/07/Frog-hills-Penang.jpg' },
  { id: 'hg9', title: 'Air Itam Dam', category: 'Hidden Gem', img: 'https://image-tc.galaxy.tf/wiwebp-d4cp4p0du9d8q1397y0h6v0k7/aerial-view-of-air-itam-dam-encircled-by-vibrant-green-trees.webp' },
  { id: 'hg10', title: 'Bukit Genting', category: 'Hidden Gem', img: 'https://www.magictravelblog.com/wp-content/uploads/2012/01/Bukit-Genting-view.jpg' },
  { id: 'hg11', title: 'Balik Pulau Farms', category: 'Hidden Gem', img: 'https://thesmartlocal.my/wp-content/uploads/2023/01/image4-5.jpg' },
  { id: 'hg12', title: 'Floating Mosque', category: 'Hidden Gem', img: 'https://image-tc.galaxy.tf/wiwebp-7hyj83qhq1ni3fpnj27caye96/sunset-casts-a-warm-glow-over-the-penang-floating-mosque-silhouetted-against-the-vibrant-sky_standard.webp?crop=57%2C0%2C867%2C650' },
  { id: 'hg13', title: 'Goat Farm', category: 'Hidden Gem', img: 'https://cartogramme.com/wp-content/uploads/2017/01/sanaan11.jpg' },

  // Adventure
  { id: 'ad1', title: 'ESCAPE Theme Park', category: 'Adventure', img: 'https://images.ctfassets.net/dsbipkqphva2/2dnLwGaTUp6uf99RbjPvRL/bf9691ef74ff3be24f05833f228c34ea/Snapinsta.app_120899053_352746602618381_5950580628685413884_n_1080.jpg?fm=webp' },
  { id: 'ad2', title: 'The Top Theme Park', category: 'Adventure', img: 'https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/rsfit1600900gsm/eventThirdParty/2024/06/26/53cd5f5f-74e4-4364-8d43-eeb718ee5723-1719414014904-643c35036d6899741c866c254d661817.jpg' },
  { id: 'ad3', title: 'The Top Rainbow skywalk', category: 'Adventure', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/68/24/e1/rainbow-skywalk.jpg?w=1200&h=-1&s=1' },
  { id: 'ad4', title: 'Entopia Butterfly Farm', category: 'Adventure', img: 'https://malaysiatravel-assets.s3.amazonaws.com/images/20200507-u7j5o-entopia-penang-butterfly-farm-2-jpg' },
  { id: 'ad5', title: 'The Habitat', category: 'Adventure', img: 'https://mypenang.gov.my/uploads/page/171/images/The-Habitat-Penang-Hills-Tree-Top-Walk.jpg' },
  { id: 'ad6', title: 'The Gravityz', category: 'Adventure', img: 'https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/c7/82/f5.jpg' },
  { id: 'ad7', title: 'ATV Penang', category: 'Adventure', img: 'https://image.kkday.com/v2/image/get/c_fill%2Cq_55%2Ct_webp%2Cw_960/s1.kkday.com/product_114497/20201222033135_CmF8Z/png' },
  { id: 'ad8', title: 'Water Sports', category: 'Adventure', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/52/41/73/seahorse-watersports.jpg?w=500&h=-1&s=1' },

  // Local Culture
  { id: 'lc1', title: 'Clan Jetties', category: 'Local Culture', img: 'https://res.klook.com/image/upload/fl_lossy.progressive,w_1200,h_630,c_fill,q_85/Clan_Jetties_of_Penang_jvca40.jpg' },
  { id: 'lc2', title: 'Pinang Peranakan Mansion', category: 'Local Culture', img: 'https://lh3.googleusercontent.com/proxy/zW94Ms3Q8_HJO62KFpBsazHViqDgWdSLlkml693txGvxtGk-o0C7FU9Udp3E2n8jcBXnAfg6lkZl0VIITiRzTdvWmdI' },
  { id: 'lc3', title: 'Little India', category: 'Local Culture', img: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Penanglittleindiaarch.jpg' },
  { id: 'lc4', title: 'Chinatown Penang', category: 'Local Culture', img: 'https://feastoftravel.com/wp-content/uploads/2024/01/dsc_0288-1-scaled.jpg' },
  { id: 'lc5', title: 'Reclining Buddha Temple', category: 'Local Culture', img: 'https://mypenang.gov.my/uploads/page/120/images/15-Reclining-Buddha.JPG' },
  { id: 'lc6', title: 'Dhammikarama Temple', category: 'Local Culture', img: 'https://www.mir.com.my/leofoo/Thai-amulets/Penang/Dhammikarama_Burmese_Temple/images/Burmese_temple_Penang_A.jpg' },
  { id: 'lc7', title: 'Sri Mariamman Temple', category: 'Local Culture', img: 'https://image-tc.galaxy.tf/wiwebp-6vh918qzc0xtdc06yrsdzsxy6/a-view-of-the-sri-mahamariamman-temple-featuring-intricate-statues-adorning-its-front-facade.webp' },
  { id: 'lc8', title: 'St. George\'s Church', category: 'Local Culture', img: 'https://mypenang.gov.my/uploads/directory/768/images/street-harmony-2.jpg' },
  { id: 'lc9', title: 'Penang State Museum', category: 'Local Culture', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/b6/0d/de/caption.jpg?w=500&h=500&s=1' },

  // Instagrammable
  { id: 'ig1', title: 'Hin Bus Depot', category: 'Instagrammable', img: 'https://www.malaymail.com/uploads/imported_images/2017/2017-09/hin_bus_depot2.jpg' },
  { id: 'ig2', title: 'Chew Jetty Bridge', category: 'Instagrammable', img: 'https://platinumcharters.com.my/wp-content/uploads/2022/02/Penang.jpg' },
  { id: 'ig3', title: 'Umbrella Alley', category: 'Instagrammable', img: 'https://www.awaygowe.com/wp-content/uploads/2020/07/things-to-do-in-penang-malaysia-img_7310.jpg' },
  { id: 'ig4', title: 'Tan Jetty', category: 'Instagrammable', img: 'https://gtwhi.com.my/wp-content/uploads/2019/04/Tan-Jetty.jpg' },
  { id: 'ig5', title: 'Blue Mansion', category: 'Instagrammable', img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/3d/9b/3b/side-courtyard-spiral.jpg?w=900&h=500&s=1' },

  // Shopping
  { id: 'sh1', title: 'Gurney Plaza', category: 'Shopping', img: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Gurney_Plaza_at_night.jpg' },
  { id: 'sh2', title: 'Design Village', category: 'Shopping', img: 'https://archello.s3.eu-central-1.amazonaws.com/images/2019/10/09/07-Design-Village.1570589942.3457.jpg' },
  { id: 'sh3', title: 'Queensbay Mall', category: 'Shopping', img: 'https://www.medisata.com/assets/images/wisata/luar-queensbay-mall-penang.jpg' },
  { id: 'sh4', title: '1st Avenue Mall', category: 'Shopping', img: 'https://www.1st-avenuepenang.com.my/wp-content/uploads/2021/06/1st-Avenue-Mall-for-stamp-no-parksonDIY-1200x800.jpg' },
  { id: 'sh5', title: 'Sunway Carnival', category: 'Shopping', img: 'https://www.sunwaycarnival.com/static/Sunway-Carnival-Mall-1019-SP-copy-1684394749386/w768.jpg' },
  { id: 'sh6', title: 'Penang Times Square', category: 'Shopping', img: 'https://image-tc.galaxy.tf/wijpeg-dcpmwicyit5int6a0zwcud631/penang-times-square.jpg' },
  { id: 'sh7', title: 'Prangin Mall', category: 'Shopping', img: 'https://media.penang360.my/file/penang360/shopping/jpg-cover-prangin-mall-DxzmQPPL.jpg' },
  { id: 'sh8', title: 'Straits Quay', category: 'Shopping', img: 'https://media.timeout.com/images/103738347/image.jpg' },
  { id: 'sh9', title: 'Batu Ferringhi Market', category: 'Shopping', img: 'https://media.timeout.com/images/101777229/image.jpg' },
  { id: 'sh10', title: 'Chowrasta Market', category: 'Shopping', img: 'https://i.ytimg.com/vi/rCT6qT_vdUM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCJS-nqPmc7PBDKjbSQ5ylwbz8sVQ' },
  { id: 'sh11', title: 'IKEA', category: 'Shopping', img: 'https://static.wixstatic.com/media/071e78_adfc6a0bdf17434697a691013e1ff215~mv2.jpg/v1/fill/w_905,h_443,al_c,q_85,enc_avif,quality_auto/071e78_adfc6a0bdf17434697a691013e1ff215~mv2.jpg' },

  // Relax & Wellness
  { id: 'rw1', title: 'Tanjung Bungah Beach', category: 'Relax & Wellness', img: 'https://www.agoda.com/wp-content/uploads/2020/08/Batu-Ferringhi-Beach-where-to-stay-in-Penang-Malaysia.jpg' },
  { id: 'rw2', title: 'Teluk Bahang Beach', category: 'Relax & Wellness', img: 'https://penang.attractionsinmalaysia.com/img/photoState/penang/TelukBahang%20Beach/3.jpg' },
  { id: 'rw3', title: 'Monkey Beach', category: 'Relax & Wellness', img: 'https://www.loka.my/_next/image?url=https%3A%2F%2Fdh7n5x4o1fca6.cloudfront.net%2Fapi%2Fv1%2Floka%2Fdownload%2Foptimize%2Fassets_loka%2Fattraction%2Fmonkey-beach%2Fimage%2FFirefly_a_snady_and_sunny_Monkey_beach_penang_99548.jpg%3Fquality%3D80%26width%3D768%26height%3D768%26format%3Dwebp%26progressive%3Dtrue&w=1920&q=75' },
  { id: 'rw4', title: 'Penang Botanical Gardens', category: 'Relax & Wellness', img: 'https://web14.bernama.com/storage/photos/d66b78c0e603ef79153ae00e520b19ed66c5f5f124707' },
  { id: 'rw5', title: 'Tropical Fruit Farm', category: 'Relax & Wellness', img: 'https://penang.attractionsinmalaysia.com/img/photoState/penang/tropicalFruitFarm/1.jpg' },
  { id: 'rw6', title: 'Spa', category: 'Relax & Wellness', img: 'https://static.wixstatic.com/media/96c671_2dfc3042b793432692a2c2440901d9d0~mv2.png/v1/fill/w_640,h_436,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/96c671_2dfc3042b793432692a2c2440901d9d0~mv2.png' },
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
                <div className="w-full overflow-x-auto pb-2 mb-6 scrollbar-hide snap-x">
                  <div className="flex gap-2 md:gap-3 px-4 md:px-8 w-max mx-auto">
                    {categories.map(cat => {
                      const isActive = activeCategory === cat;
                      const isRec = cat === RECOMMENDED_CATEGORY;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`snap-center whitespace-nowrap px-4 py-1.5 md:px-5 md:py-2 rounded-full font-medium text-xs md:text-sm transition-all duration-300 flex items-center gap-1.5 ${isActive
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