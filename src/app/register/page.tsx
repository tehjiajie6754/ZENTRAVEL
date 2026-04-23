'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useUser } from '@/contexts/UserContext'

let faceLandmarker: any, runningMode: 'IMAGE' | 'VIDEO' = 'IMAGE', webcamRunning = false, lastVideoTime = -1, results: any, drawingUtils: any = null
let livenessTestActive = false, currentTestType: 'blink' | 'head_turn' | 'nod' = 'blink', testStatus: 'waiting' | 'in_progress' | 'passed' | 'failed' = 'waiting'
let blinkCount = 0, requiredBlinks = 2, lastBlinkTime = 0, isCurrentlyBlinking = false, blinkThreshold = 0.5
let headPositionHistory: {yaw:number,timestamp:number}[] = [], hasMovedLeft = false, hasMovedRight = false, centerYaw = 0, headTurnThreshold = 15
let nodCount = 0, requiredNods = 2, lastNodTime = 0, isCurrentlyNodding = false, verticalPositionHistory: {pitch:number,timestamp:number}[] = [], centerPitch = 0, nodThreshold = 10
const videoWidth = 480

export default function RegisterPage() {
  const [isWebcamRunning, setIsWebcamRunning] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFaceRecognitionModal, setShowFaceRecognitionModal] = useState(false)
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState('')
  const [testInstruction, setTestInstruction] = useState('Click "Start Verification" to begin')
  const [testStatusText, setTestStatusText] = useState('🔄 Ready for verification')
  const [isTestActive, setIsTestActive] = useState(false)
  const [testPassed, setTestPassed] = useState(false)

  const router = useRouter()
  const { loginWithUser } = useUser()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const demosSectionRef = useRef<HTMLElement>(null)

  useEffect(() => { createFaceLandmarker() }, [])

  async function createFaceLandmarker() {
    const vision = await import('@mediapipe/tasks-vision')
    const { FaceLandmarker, FilesetResolver } = vision
    const fs = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm')
    faceLandmarker = await FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'GPU' }, outputFaceBlendshapes: true, runningMode, numFaces: 1 })
    if (demosSectionRef.current) demosSectionRef.current.classList.remove('invisible')
  }

  function enableCam() {
    if (!faceLandmarker) return
    if (webcamRunning) { webcamRunning = false; setIsWebcamRunning(false); if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null } }
    else { navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.addEventListener('loadeddata', () => { webcamRunning = true; setIsWebcamRunning(true); predictWebcam() }) } }) }
  }

  async function predictWebcam() {
    const v = videoRef.current!, c = canvasRef.current!, ctx = c.getContext('2d')!
    const r = v.videoHeight / v.videoWidth; v.style.width = videoWidth+'px'; v.style.height = videoWidth*r+'px'; c.style.width = videoWidth+'px'; c.style.height = videoWidth*r+'px'; c.width = v.videoWidth; c.height = v.videoHeight
    if (runningMode === 'IMAGE') { runningMode = 'VIDEO'; await faceLandmarker.setOptions({ runningMode }) }
    if (lastVideoTime !== v.currentTime) { lastVideoTime = v.currentTime; results = faceLandmarker.detectForVideo(v, performance.now()) }
    ctx.clearRect(0, 0, c.width, c.height)
    if (results?.faceLandmarks) {
      const vision = await import('@mediapipe/tasks-vision'); const { FaceLandmarker } = vision
      if (!drawingUtils) { const { DrawingUtils } = vision; drawingUtils = new DrawingUtils(ctx) }
      for (const lm of results.faceLandmarks) {
        drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#C0C0C070', lineWidth: 1 })
        drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' })
        drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#FF3030' })
        drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#30FF30' })
      }
    }
    if (results?.faceBlendshapes && results?.faceLandmarks) detectLiveness(results.faceBlendshapes, results.faceLandmarks)
    if (webcamRunning) window.requestAnimationFrame(predictWebcam)
  }

  function startRandomTest() {
    if (livenessTestActive) { stopTest(); return }
    const tests: ('blink'|'head_turn'|'nod')[] = ['blink','head_turn','nod']; currentTestType = tests[Math.floor(Math.random()*tests.length)]
    livenessTestActive = true; testStatus = 'waiting'; setIsTestActive(true); setTestPassed(false); resetAllVars(); updateUI()
  }
  function stopTest() { livenessTestActive = false; testStatus = 'waiting'; setIsTestActive(false); updateUI() }
  function resetAllVars() { blinkCount=0; lastBlinkTime=0; isCurrentlyBlinking=false; headPositionHistory=[]; hasMovedLeft=false; hasMovedRight=false; centerYaw=0; nodCount=0; lastNodTime=0; isCurrentlyNodding=false; verticalPositionHistory=[]; centerPitch=0 }

  function detectLiveness(bs: any[], lm: any[]) { if (!livenessTestActive||!bs?.length||!lm?.length) return; if (currentTestType==='blink') detectBlink(bs); else if (currentTestType==='head_turn') detectHeadTurn(lm[0]); else detectNod(lm[0]) }
  function onPass() { testStatus='passed'; updateUI(); setTimeout(()=>{stopTest();showSuccessAndRecognize()},3000) }
  function detectBlink(bs:any[]) { let eL=0,eR=0; bs[0].categories.forEach((s:any)=>{if(s.categoryName==='eyeBlinkLeft')eL=s.score;if(s.categoryName==='eyeBlinkRight')eR=s.score}); const n=Date.now(),b=eL>blinkThreshold&&eR>blinkThreshold; if(b&&!isCurrentlyBlinking&&n-lastBlinkTime>500){isCurrentlyBlinking=true;blinkCount++;lastBlinkTime=n;testStatus='in_progress';updateUI()} if(!b&&isCurrentlyBlinking)isCurrentlyBlinking=false; if(blinkCount>=requiredBlinks&&testStatus!=='passed')onPass() }
  function detectHeadTurn(lm:any[]) { const y=Math.atan2(lm[1].x-(lm[33].x+lm[362].x)/2,0.1)*(180/Math.PI); if(!headPositionHistory.length)centerYaw=y; headPositionHistory.push({yaw:y,timestamp:Date.now()}); if(headPositionHistory.length>30)headPositionHistory.shift(); const r=y-centerYaw; if(r<-headTurnThreshold&&!hasMovedLeft){hasMovedLeft=true;testStatus='in_progress';updateUI()} if(r>headTurnThreshold&&!hasMovedRight){hasMovedRight=true;testStatus='in_progress';updateUI()} if(hasMovedLeft&&hasMovedRight&&testStatus!=='passed')onPass() }
  function detectNod(lm:any[]) { if(!lm?.length)return; const n=performance.now(),p=((lm[1].y-lm[9].y)/Math.abs(lm[9].y-lm[175].y))*45; verticalPositionHistory.push({pitch:p,timestamp:n}); verticalPositionHistory=verticalPositionHistory.filter(e=>n-e.timestamp<1000); if(verticalPositionHistory.length===5)centerPitch=verticalPositionHistory.slice(0,5).reduce((s,e)=>s+e.pitch,0)/5; if(verticalPositionHistory.length<5)return; if(Math.abs(p-centerPitch)>nodThreshold&&!isCurrentlyNodding&&n-lastNodTime>800){isCurrentlyNodding=true;nodCount++;lastNodTime=n;testStatus='in_progress';updateUI()} if(Math.abs(p-centerPitch)<=nodThreshold&&isCurrentlyNodding)isCurrentlyNodding=false; if(nodCount>=requiredNods&&testStatus!=='passed')onPass() }

  function updateUI() {
    if (testStatus==='passed') { setTestPassed(true); setTestInstruction('<b>🎉 Verification Successful!</b>'); setTestStatusText('✅ REGISTRATION APPROVED'); return }
    if (currentTestType==='blink') { setTestInstruction(livenessTestActive?'<b>Please blink your eyes TWICE</b>':'Click "Start Verification" to begin'); setTestStatusText(testStatus==='in_progress'?`👁️ Progress: ${blinkCount}/2 blinks`:'👁️ Waiting for blinks...') }
    else if (currentTestType==='head_turn') { setTestInstruction(livenessTestActive?'<b>Turn your head LEFT, then RIGHT</b>':'Click "Start Verification" to begin'); setTestStatusText(`🔄 Left: ${hasMovedLeft?'✅':'⏳'} Right: ${hasMovedRight?'✅':'⏳'}`) }
    else { setTestInstruction(livenessTestActive?'<b>Please NOD your head up and down TWICE</b>':'Click "Start Verification" to begin'); setTestStatusText(testStatus==='in_progress'?`🔄 Progress: ${nodCount}/2 nods`:'🔄 Waiting for nods...') }
  }

  function showSuccessAndRecognize() {
    setShowSuccessModal(true)
    setTimeout(() => {
      setShowSuccessModal(false); setShowFaceRecognitionModal(true); setFaceRecognitionStatus('Registering your face...')
      setTimeout(() => {
        setFaceRecognitionStatus('Registration successful!')
        loginWithUser({ id: 'new-user-001', full_name: 'New Traveller', email: 'new@zentravel.com' })
        setTimeout(() => { setShowFaceRecognitionModal(false); router.push('/onboarding') }, 1500)
      }, 2000)
    }, 2000)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Globe World Tour background via iframe */}
      <iframe
        src="/globe-bg.html"
        className="absolute inset-0 w-full h-full border-0"
        style={{ zIndex: 0, pointerEvents: 'none' }}
        title="Globe Background"
        aria-hidden="true"
        tabIndex={-1}
      />
      <style>{`video{transform:rotateY(180deg)}canvas.mirror{transform:rotateY(180deg)}.invisible{opacity:.15;pointer-events:none}`}</style>
      <div className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2"><span className="bg-gradient-to-r from-white via-purple-300 to-cyan-300 bg-clip-text text-transparent">📝 Create Account</span></h1>
          <p className="text-white/80">Complete face verification to register your account</p>
        </div>
        <section ref={demosSectionRef} className="invisible transition-opacity duration-500">
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Face Registration</h2><p className="text-sm text-gray-500 mt-1">Position your face clearly in front of the camera</p></div>
            <div className="p-6">
              <div className="flex justify-center mb-5">
                <button onClick={enableCam} className={`px-6 py-3 rounded-lg font-medium transition-all ${isWebcamRunning?'bg-red-100 text-red-700 border border-red-200':'bg-blue-600 text-white hover:bg-blue-700'}`}>{isWebcamRunning?'DISABLE CAMERA':'ENABLE CAMERA'}</button>
              </div>
              <div className="flex justify-center"><div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{maxWidth:480,width:'100%'}}><video ref={videoRef} autoPlay playsInline muted className="w-full h-auto object-cover"/><canvas ref={canvasRef} className="mirror absolute left-0 top-0 w-full h-auto"/>{isWebcamRunning&&<div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>LIVE</div>}</div></div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/30 p-6">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-3 ${testPassed?'text-green-600':'text-gray-900'}`}>{testPassed?'✅ Registration Verified!':testStatusText}</div>
              <p className="text-gray-600 mb-6" dangerouslySetInnerHTML={{__html:testInstruction}}/>
              <button onClick={startRandomTest} disabled={!isWebcamRunning} className={`px-8 py-4 rounded-lg text-base font-semibold transition-all ${!isWebcamRunning?'bg-gray-200 text-gray-400 cursor-not-allowed':isTestActive?'bg-red-600 text-white hover:bg-red-700':'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg hover:shadow-xl'}`}>{!isWebcamRunning?'Enable Camera First':isTestActive?'Stop Test':'Start Verification'}</button>
            </div>
          </div>
        </section>
      </div>
      {showSuccessModal&&<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/><div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center animate-scale-in"><div className="w-16 h-16 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-5"/><h2 className="text-2xl font-semibold text-gray-900 mb-2">✅ Liveness Verified!</h2><p className="text-gray-500">Registering your face...</p></div></div>}
      {showFaceRecognitionModal&&<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/><div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center animate-scale-in"><div className="mb-5">{faceRecognitionStatus.includes('successful')?<div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>:<div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>}</div><h2 className="text-xl font-semibold mb-3"><span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{faceRecognitionStatus.includes('successful')?'🎉 Account Created!':'📝 Registering...'}</span></h2><p className="text-gray-500">{faceRecognitionStatus}</p></div></div>}
    </div>
  )
}
