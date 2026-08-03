import { useEffect, useState } from 'react'
import { subscribeSceneReady } from '../three/runtime'

/**
 * Full-app loading veil (brand animation) shown until the 3D scene reports
 * ready — users never see the first unsettled frames (wrong canvas size,
 * not-yet-loaded models).
 */
export default function LoadingVeil() {
  const [ready, setReady] = useState(false)
  const [gone, setGone] = useState(false)
  useEffect(() => subscribeSceneReady(() => setReady(true)), [])
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setGone(true), 380) // let the fade-out finish
    return () => clearTimeout(t)
  }, [ready])
  if (gone) return null
  return (
    <div className={`loading-veil${ready ? ' done' : ''}`} aria-hidden={ready}>
      <img src={`${import.meta.env?.BASE_URL ?? '/'}brand/logo-loading.webp`} alt="家居生成器 Cartoon" />
      <span className="loading-tag">加载中 LOADING…</span>
    </div>
  )
}
