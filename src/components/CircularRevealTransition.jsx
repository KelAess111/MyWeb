import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTransition } from '../contexts/TransitionContext'

const REVEAL_DURATION = 700 // 扩散时长
const HOLD_DURATION = 300 // 全屏停留时间，确保新页面加载
const SHRINK_DURATION = 800 // 收缩时长
const SHRINK_DELAY = 250 // 收缩前的额外等待时间
const REVEAL_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'
const SHRINK_EASING = 'cubic-bezier(0.6, 0.0, 0.4, 1)'

const TRANSITION_STORAGE_KEY = 'circular-reveal-transition-state'

function CircularRevealTransition({ isActive, clickPosition, targetRoute, targetElement, onComplete }) {
  const overlayRef = useRef(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [phase, setPhase] = useState('idle') // 'idle', 'expanding', 'shrinking'
  const navigate = useNavigate()
  const location = useLocation()
  const { showGlobalMask, setShowGlobalMask } = useTransition()

  // 检查是否需要执行收缩动画（刚从其他页面跳转过来）
  useEffect(() => {
    const storedState = sessionStorage.getItem(TRANSITION_STORAGE_KEY)
    if (!storedState) {
      console.log('No stored transition state found')
      return
    }

    try {
      const state = JSON.parse(storedState)
      console.log('Found stored transition state:', state)

      // 立即设置状态，让遮罩覆盖屏幕（先不清除 sessionStorage）
      setIsAnimating(true)
      setPhase('shrinking')

      // 等待下一帧，确保组件已经渲染
      requestAnimationFrame(() => {
        const overlay = overlayRef.current
        if (!overlay) {
          console.error('Overlay ref still not available after state update')
          setIsAnimating(false)
          setShowGlobalMask(false) // 确保关闭全局遮罩
          sessionStorage.removeItem(TRANSITION_STORAGE_KEY)
          return
        }

        console.log('Overlay ref ready, initializing for shrink')

        const { clientX, clientY, maxRadius } = state

        // 立即设置为扩散完成的状态（全屏覆盖），保持遮罩覆盖屏幕
        const finalSize = maxRadius * 2.2
        overlay.style.left = `${clientX}px`
        overlay.style.top = `${clientY}px`
        overlay.style.width = `${finalSize}px`
        overlay.style.height = `${finalSize}px`
        overlay.style.transform = 'translate(-50%, -50%)'
        overlay.style.opacity = '1'
        overlay.style.transition = 'none'

        console.log('Overlay initialized for shrink:', { finalSize, clientX, clientY })

        // 现在可以清除 sessionStorage 了
        sessionStorage.removeItem(TRANSITION_STORAGE_KEY)

        // 稍长的延迟，确保新页面内容已经渲染，然后再开始收缩
        setTimeout(() => {
          console.log('Starting shrink animation on new page, hiding global mask')
          setShowGlobalMask(false) // 在收缩开始前关闭全局遮罩

          overlay.style.width = '0px'
          overlay.style.height = '0px'
          overlay.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.8}ms ease-out ${SHRINK_DURATION * 0.2}ms`
          overlay.style.opacity = '0'

          setTimeout(() => {
            console.log('Shrink animation complete')
            setIsAnimating(false)
            setPhase('idle')
          }, SHRINK_DURATION + 100)
        }, SHRINK_DELAY)
      })
    } catch (error) {
      console.error('Failed to parse transition state:', error)
      sessionStorage.removeItem(TRANSITION_STORAGE_KEY)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!isActive || !clickPosition) return

    console.log('CircularRevealTransition activated:', { targetRoute, targetElement })

    // 如果没有提供目标，直接完成
    if (!targetRoute && !targetElement) {
      console.warn('No target provided')
      onComplete?.()
      return
    }

    setIsAnimating(true)
    setPhase('expanding')

    const overlay = overlayRef.current
    if (!overlay) {
      console.error('Overlay ref not found')
      onComplete?.()
      return
    }

    const { clientX, clientY } = clickPosition
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 计算到屏幕最远角的距离
    const maxDistanceX = Math.max(clientX, viewportWidth - clientX)
    const maxDistanceY = Math.max(clientY, viewportHeight - clientY)
    const maxRadius = Math.sqrt(maxDistanceX ** 2 + maxDistanceY ** 2)

    console.log('Starting reveal animation from:', { clientX, clientY, maxRadius })

    // 设置初始状态（从点击位置开始，大小为0）
    overlay.style.left = `${clientX}px`
    overlay.style.top = `${clientY}px`
    overlay.style.width = '0px'
    overlay.style.height = '0px'
    overlay.style.transform = 'translate(-50%, -50%)'
    overlay.style.opacity = '1'

    // 开始扩散动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const finalSize = maxRadius * 2.2 // 稍微大一点确保覆盖整个屏幕
        overlay.style.width = `${finalSize}px`
        overlay.style.height = `${finalSize}px`
        overlay.style.transition = `width ${REVEAL_DURATION}ms ${REVEAL_EASING}, height ${REVEAL_DURATION}ms ${REVEAL_EASING}`
      })
    })

    // 扩散完成后执行跳转
    const expandTimer = setTimeout(() => {
      console.log('Expansion complete, showing global mask')

      // 扩散完成后，显示全局遮罩
      setShowGlobalMask(true)

      // 先停留一段时间，保持全屏白色遮罩
      setTimeout(() => {
        console.log('Hold complete, executing navigation')

        // 如果是路由跳转，保存状态到 sessionStorage
        if (targetRoute) {
          const transitionState = {
            clientX,
            clientY,
            maxRadius,
            timestamp: Date.now()
          }
          sessionStorage.setItem(TRANSITION_STORAGE_KEY, JSON.stringify(transitionState))
          console.log('Saved transition state to sessionStorage:', transitionState)

          navigate(targetRoute)
        } else if (targetElement) {
          // 页面内滚动，直接执行收缩
          targetElement.scrollIntoView({ behavior: 'instant', block: 'start' })

          setTimeout(() => {
            setPhase('shrinking')
            console.log('Starting shrink animation')

            overlay.style.width = '0px'
            overlay.style.height = '0px'
            overlay.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.6}ms ${SHRINK_EASING}`
            overlay.style.opacity = '0'

            const shrinkTimer = setTimeout(() => {
              console.log('Shrink complete')
              setIsAnimating(false)
              setPhase('idle')
              setShowGlobalMask(false)
              onComplete?.()
            }, SHRINK_DURATION)

            return () => clearTimeout(shrinkTimer)
          }, 50)
        }
      }, HOLD_DURATION)
    }, REVEAL_DURATION)

    return () => {
      clearTimeout(expandTimer)
    }
  }, [isActive, clickPosition, targetRoute, targetElement, onComplete, navigate])

  if (!isAnimating && !isActive) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="circular-reveal-overlay"
      style={{
        position: 'fixed',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform, width, height, opacity',
      }}
      aria-hidden="true"
    />,
    document.body
  )
}

export default CircularRevealTransition
