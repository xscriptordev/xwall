import { Canvas } from '@react-three/fiber'
import { Leva, useControls, button } from 'leva'
import { useState, useRef, useEffect } from 'react'
import { LiquidShader } from './components/LiquidShader'
import './App.css'
import { encodeLSB, decodeLSB } from './utils/steganography'

const DEFAULT_PALETTE = [
  "#363537", // 0
  "#fc618d", // 1
  "#7bd88f", // 2
  "#fce566", // 3
  "#fd9353", // 4
  "#948ae3", // 5
  "#5ad4e6", // 6
  "#f7f1ff", // 7
  "#69676c", // 8
  "#fc618d", // 9
  "#7bd88f", // 10
  "#fce566", // 11
  "#fd9353", // 12
  "#948ae3", // 13
  "#5ad4e6", // 14
  "#f7f1ff"  // 15
]

function App() {
  const [seed, setSeed] = useState(Math.random())
  const [isExporting, setIsExporting] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)

  // Animation loop for transition
  useEffect(() => {
    if (transitionProgress > 0) {
    }
  }, [transitionProgress])

  // Custom animation function
  const animateTransition = () => {
    let start = performance.now()
    const duration = 1000 // 1 second total
    const half = duration / 2

    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed < duration) {
        if (elapsed < half) {
          // 0 -> 1
          setTransitionProgress(elapsed / half)
        } else {
          // 1 -> 0
          if (elapsed >= half && elapsed < half + 16) {
            // Exact middle point: Change seed
            setSeed(Math.random())
          }
          setTransitionProgress(1 - (elapsed - half) / half)
        }
        requestAnimationFrame(tick)
      } else {
        setTransitionProgress(0)
      }
    }
    requestAnimationFrame(tick)
  }

  const handleVerify = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const signature = await decodeLSB(event.target.result as string)
            if (signature) {
              alert(`Signature Found:\n\n"${signature}"`)
            } else {
              alert("No signature found in this image.")
            }
          } catch (err) {
            alert("Error reading signature.")
          }
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const {
    color0, color1, color2, color3, color4, color5, color6, color7,
    color8, color9, color10, color11, color12, color13, color14, color15,
    grain, speed,
    pixelRatio,
    pixelation, distortion, relief,
    overlayText, overlayPosition
  } = useControls('Settings', {
    color0: DEFAULT_PALETTE[0],
    color1: DEFAULT_PALETTE[1],
    color2: DEFAULT_PALETTE[2],
    color3: DEFAULT_PALETTE[3],
    color4: DEFAULT_PALETTE[4],
    color5: DEFAULT_PALETTE[5],
    color6: DEFAULT_PALETTE[6],
    color7: DEFAULT_PALETTE[7],
    color8: DEFAULT_PALETTE[8],
    color9: DEFAULT_PALETTE[9],
    color10: DEFAULT_PALETTE[10],
    color11: DEFAULT_PALETTE[11],
    color12: DEFAULT_PALETTE[12],
    color13: DEFAULT_PALETTE[13],
    color14: DEFAULT_PALETTE[14],
    color15: DEFAULT_PALETTE[15],
    grain: { value: 0.12, min: 0.0, max: 0.3, step: 0.01, label: 'Texture' },
    speed: { value: 0.15, min: 0.0, max: 1.0, step: 0.05, label: 'Flow' },
    pixelRatio: { value: 1.5, min: 0.5, max: 3, step: 0.1, label: 'Quality' },
    pixelation: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, label: 'Pixelation' },
    distortion: { value: 1.0, min: 0.0, max: 2.0, step: 0.01, label: 'Distortion' },
    relief: { value: 1.0, min: 0.0, max: 2.0, step: 0.01, label: 'Relief' },
    overlayText: { value: '', label: 'Overlay Text' },
    overlayPosition: { options: { Center: 'center', Bottom: 'bottom' }, value: 'center', label: 'Position' },
    'Randomize & repaint': button(() => animateTransition()),
    'Export 4k': button(() => handleExport()),
    'Verify Signature': button(() => handleVerify())
  }, { collapsed: false })

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Refs to solve closure staleness in Leva button callback
  const overlayTextRef = useRef(overlayText)
  const overlayPositionRef = useRef(overlayPosition)

  useEffect(() => {
    overlayTextRef.current = overlayText
    overlayPositionRef.current = overlayPosition
  }, [overlayText, overlayPosition])

  const handleExport = async () => {
    setIsExporting(true)
    if (wrapperRef.current) {
      const originalWidth = wrapperRef.current.style.width
      const originalHeight = wrapperRef.current.style.height
      const originalPosition = wrapperRef.current.style.position
      const originalZIndex = wrapperRef.current.style.zIndex

      // Set to 4k resolution
      wrapperRef.current.style.width = '3840px'
      wrapperRef.current.style.height = '2160px'
      wrapperRef.current.style.position = 'fixed'
      wrapperRef.current.style.zIndex = '-9999'
      wrapperRef.current.style.top = '0'
      wrapperRef.current.style.left = '0'

      // Wait for re-render/resize
      await new Promise(r => setTimeout(r, 600))

      const canvas = document.querySelector('canvas')
      if (canvas) {
        try {
          // Encode steganographic signature AND draw overlay text
          const signature = "Created by Xscriptor with Xwall"
          const dataUrl = await encodeLSB(
            canvas,
            signature,
            overlayTextRef.current,
            overlayPositionRef.current as 'center' | 'bottom'
          )

          const link = document.createElement('a')
          link.download = `xwall-${Date.now()}.png`
          link.href = dataUrl
          link.click()
        } catch (e) {
          console.error("Export failed", e)
        }
      }

      // Restore original styles
      wrapperRef.current.style.width = originalWidth || '100%'
      wrapperRef.current.style.height = originalHeight || '100%'
      wrapperRef.current.style.position = originalPosition || 'absolute'
      wrapperRef.current.style.zIndex = originalZIndex || '1'
    }
    setIsExporting(false)
  }

  return (
    <div className="app-container">
      <div className="custom-leva-wrapper">
        <Leva theme={{
          colors: {
            elevation1: 'rgba(20, 20, 20, 0.6)',
            elevation2: 'rgba(255, 255, 255, 0.05)',
            elevation3: 'rgba(255, 255, 255, 0.1)',
            accent1: '#FFD700',
            accent2: '#FFD700',
            accent3: '#D4AF37',
            highlight1: '#FFD700',
            highlight2: '#D4AF37',
            vivid1: '#ff00ff',
          },
          fonts: {
            mono: 'Inter, monospace',
            sans: 'Inter, sans-serif'
          },
          radii: {
            xs: '4px',
            sm: '8px',
            lg: '16px',
          },
        }}
          hidden={isExporting}
        />
      </div>

      <div className="canvas-wrapper" ref={wrapperRef}>
        <Canvas
          dpr={isExporting ? 2 : pixelRatio} // Higher pixel ratio for export
          gl={{
            antialias: true,
            preserveDrawingBuffer: true
          }}
          orthographic
          camera={{ zoom: 1, position: [0, 0, 100] }}
        >
          <LiquidShader
            colors={[
              color0, color1, color2, color3, color4, color5, color6, color7,
              color8, color9, color10, color11, color12, color13, color14, color15
            ]}
            seed={seed}
            grain={grain}
            speed={speed}
            transition={transitionProgress}
            pixelation={pixelation}
            distortion={distortion}
            relief={relief}
          />
        </Canvas>

        {/* Text Overlay Preview */}
        {overlayText && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: overlayPosition === 'bottom' ? 'flex-end' : 'center',
            paddingBottom: overlayPosition === 'bottom' ? '10%' : '0'
          }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '5vmin',
              textShadow: '0 10px 20px rgba(0,0,0,0.5)',
              margin: 0,
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
              backdropFilter: 'blur(4px)', // Subtle effect around text if needed, or keeping it clean
              padding: '10px 20px',
              borderRadius: '20px'
            }}>
              {overlayText}
            </h2>
          </div>
        )}
      </div>

      <div className="overlay" style={{ opacity: isExporting ? 0 : 1 }}>
        <h1>Xwall</h1>
        <a href="https://github.com/xscriptordev/xwall" target="_blank" rel="noopener noreferrer" title="View Source">
          <svg height="20" width="20" viewBox="0 0 16 16" fill="white">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default App
