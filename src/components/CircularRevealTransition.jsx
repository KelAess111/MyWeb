import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTransition } from '../contexts/TransitionContext'

const REVEAL_DURATION = 700 // 扩散时长
const HOLD_DURATION = 600 // 全屏停留时间，增加到600ms确保新页面加载
const SHRINK_DURATION = 800 // 收缩时长
const SHRINK_DELAY = 400 // 收缩前的额外等待时间，增加到400ms
const REVEAL_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'
const SHRINK_EASING = 'cubic-bezier(0.6, 0.0, 0.4, 1)'

// 波纹层级延迟（毫秒）
const RIPPLE_DELAY = 80 // 每层波纹之间的延迟

const TRANSITION_STORAGE_KEY = 'circular-reveal-transition-state'

function CircularRevealTransition({ isActive, clickPosition, targetRoute, targetElement, onComplete }) {
  const layer1Ref = useRef(null) // 最内层浅蓝
  const layer2Ref = useRef(null) // 中间白色
  const layer3Ref = useRef(null) // 最外层浅蓝
  const [isAnimating, setIsAnimating] = useState(false)
  const [phase, setPhase] = useState('idle') // 'idle', 'expanding', 'shrinking'
  const navigate = useNavigate()
  const location = useLocation()
  const { showGlobalMask, setShowGlobalMask } = useTransition()

  useEffect(() => {
    const storedState = sessionStorage.getItem(TRANSITION_STORAGE_KEY)
    if (!storedState) {
      return
    }

    try {
      const state = JSON.parse(storedState)

      setIsAnimating(true)
      setPhase('shrinking')

      requestAnimationFrame(() => {
        const layer1 = layer1Ref.current
        const layer2 = layer2Ref.current
        const layer3 = layer3Ref.current

        if (!layer1 || !layer2 || !layer3) {
          setIsAnimating(false)
          setShowGlobalMask(false)
          sessionStorage.removeItem(TRANSITION_STORAGE_KEY)
          return
        }

        const { clientX, clientY, maxRadius } = state
        const finalSize = maxRadius * 2.2
        const layers = [layer1, layer2, layer3]

        layers.forEach((layer) => {
          layer.style.left = `${clientX}px`
          layer.style.top = `${clientY}px`
          layer.style.width = `${finalSize}px`
          layer.style.height = `${finalSize}px`
          layer.style.transform = 'translate(-50%, -50%)'
          layer.style.opacity = '1'
          layer.style.transition = 'none'
        })

        sessionStorage.removeItem(TRANSITION_STORAGE_KEY)

        const waitForPageReady = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setShowGlobalMask(false)

                layers.forEach((layer, index) => {
                  setTimeout(() => {
                    layer.style.width = '0px'
                    layer.style.height = '0px'
                    layer.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.8}ms ease-out ${SHRINK_DURATION * 0.2}ms`
                    layer.style.opacity = '0'
                  }, (2 - index) * RIPPLE_DELAY)
                })

                setTimeout(() => {
                  setIsAnimating(false)
                  setPhase('idle')
                }, SHRINK_DURATION + RIPPLE_DELAY * 2 + 100)
              })
            })
          })
        }

        setTimeout(waitForPageReady, SHRINK_DELAY + 200)
      })
    } catch {
      sessionStorage.removeItem(TRANSITION_STORAGE_KEY)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!isActive || !clickPosition) return

    if (!targetRoute && !targetElement) {
      onComplete?.()
      return
    }

    setIsAnimating(true)
    setPhase('expanding')

    const layer1 = layer1Ref.current
    const layer2 = layer2Ref.current
    const layer3 = layer3Ref.current

    if (!layer1 || !layer2 || !layer3) {
      onComplete?.()
      return
    }

    const { clientX, clientY } = clickPosition
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const maxDistanceX = Math.max(clientX, viewportWidth - clientX)
    const maxDistanceY = Math.max(clientY, viewportHeight - clientY)
    const maxRadius = Math.sqrt(maxDistanceX ** 2 + maxDistanceY ** 2)

    const layers = [layer1, layer2, layer3]

    layers.forEach(layer => {
      layer.style.left = `${clientX}px`
      layer.style.top = `${clientY}px`
      layer.style.width = '0px'
      layer.style.height = '0px'
      layer.style.transform = 'translate(-50%, -50%)'
      layer.style.opacity = '1'
    })

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const finalSize = maxRadius * 2.2

        layers.forEach((layer, index) => {
          setTimeout(() => {
            layer.style.width = `${finalSize}px`
            layer.style.height = `${finalSize}px`
            layer.style.transition = `width ${REVEAL_DURATION}ms ${REVEAL_EASING}, height ${REVEAL_DURATION}ms ${REVEAL_EASING}`
          }, index * RIPPLE_DELAY)
        })
      })
    })

    const expandTimer = setTimeout(() => {
      setShowGlobalMask(true)

      setTimeout(() => {
        if (targetRoute) {
          const transitionState = {
            clientX,
            clientY,
            maxRadius,
            timestamp: Date.now()
          }
          sessionStorage.setItem(TRANSITION_STORAGE_KEY, JSON.stringify(transitionState))

          navigate(targetRoute)
        } else if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'instant', block: 'start' })

          setTimeout(() => {
            setPhase('shrinking')

            layers.forEach((layer, index) => {
              setTimeout(() => {
                layer.style.width = '0px'
                layer.style.height = '0px'
                layer.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.6}ms ${SHRINK_EASING}`
                layer.style.opacity = '0'
              }, (2 - index) * RIPPLE_DELAY)
            })

            const shrinkTimer = setTimeout(() => {
              setIsAnimating(false)
              setPhase('idle')
              setShowGlobalMask(false)
              onComplete?.()
            }, SHRINK_DURATION + RIPPLE_DELAY * 2)

            return () => clearTimeout(shrinkTimer)
          }, 50)
        }
      }, HOLD_DURATION)
    }, REVEAL_DURATION + RIPPLE_DELAY * 2) // 等待所有层扩散完成

    return () => {
      clearTimeout(expandTimer)
    }
  }, [isActive, clickPosition, targetRoute, targetElement, onComplete, navigate])

  if (!isAnimating && !isActive) return null

  return createPortal(
    <>
      {/* 第一层 - 最先扩散的白色（z-index最低，在最底下）*/}
      <div
        ref={layer1Ref}
        className="circular-reveal-overlay circular-reveal-layer-1"
        style={{
          position: 'fixed',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform, width, height, opacity',
        }}
        aria-hidden="true"
      />
      {/* 第二层 - 第二个扩散的浅蓝色（盖在白色上）*/}
      <div
        ref={layer2Ref}
        className="circular-reveal-overlay circular-reveal-layer-2"
        style={{
          position: 'fixed',
          borderRadius: '50%',
          backgroundColor: '#b3d9ff',
          pointerEvents: 'none',
          zIndex: 10001,
          willChange: 'transform, width, height, opacity',
        }}
        aria-hidden="true"
      />
      {/* 第三层 - 最后扩散的白色（z-index最高，在最上面）*/}
      <div
        ref={layer3Ref}
        className="circular-reveal-overlay circular-reveal-layer-3"
        style={{
          position: 'fixed',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          zIndex: 10002,
          willChange: 'transform, width, height, opacity',
        }}
        aria-hidden="true"
      />
    </>,
    document.body
  )
}

export default CircularRevealTransition
