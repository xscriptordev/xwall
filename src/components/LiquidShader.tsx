
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import fragmentShader from '../shaders/liquid.frag?raw'

// Simple vertex shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const LiquidMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uColors: new Array(16).fill(new THREE.Color('#000000')),
    uSeed: 0,
    uGrain: 0.05,
    uTransition: 0.0,
    uPixelation: 0.0,
    uDistortion: 1.0,
    uRelief: 1.0,
    uFlowVector: new THREE.Vector2(0, 0)
  },
  vertexShader,
  fragmentShader
)

extend({ LiquidMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    liquidMaterial: any
  }
}

interface LiquidShaderProps {
  colors: string[]
  seed: number
  grain: number
  speed: number
  transition: number
  pixelation: number
  distortion: number
  relief: number
  flowVector: THREE.Vector2
}

export const LiquidShader = ({
  colors, seed, grain, speed, transition,
  pixelation, distortion, relief, flowVector
}: LiquidShaderProps) => {
  const ref = useRef<any>(null)
  const { viewport, size } = useThree()

  const colorUniforms = useMemo(() => {
    const c = [...colors]
    while (c.length < 16) c.push(c[c.length - 1] || '#000000')
    return c.slice(0, 16).map(col => new THREE.Color(col))
  }, [colors])

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.uTime += delta * (speed * 5.0)
      ref.current.uResolution.set(size.width * viewport.dpr, size.height * viewport.dpr)
      ref.current.uSeed = seed
      ref.current.uColors = colorUniforms
      ref.current.uGrain = grain
      ref.current.uTransition = transition
      ref.current.uPixelation = pixelation
      ref.current.uDistortion = distortion
      ref.current.uRelief = relief
      ref.current.uFlowVector = flowVector
    }
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <liquidMaterial ref={ref} />
    </mesh>
  )
}
