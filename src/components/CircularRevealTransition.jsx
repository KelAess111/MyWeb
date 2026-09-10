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
        const layer1 = layer1Ref.current
        const layer2 = layer2Ref.current
        const layer3 = layer3Ref.current

        if (!layer1 || !layer2 || !layer3) {
          console.error('Layer refs not available after state update')
          setIsAnimating(false)
          setShowGlobalMask(false)
          sessionStorage.removeItem(TRANSITION_STORAGE_KEY)
          return
        }

        console.log('Layer refs ready, initializing for shrink')

        const { clientX, clientY, maxRadius } = state

        // 立即设置为扩散完成的状态（全屏覆盖），保持遮罩覆盖屏幕
        const finalSize = maxRadius * 2.2
        const layers = [layer1, layer2, layer3]

        // 所有层都是全屏大小
        layers.forEach((layer) => {
          layer.style.left = `${clientX}px`
          layer.style.top = `${clientY}px`
          layer.style.width = `${finalSize}px`
          layer.style.height = `${finalSize}px`
          layer.style.transform = 'translate(-50%, -50%)'
          layer.style.opacity = '1'
          layer.style.transition = 'none'
        })

        console.log('Layers initialized for shrink:', { finalSize, clientX, clientY })

        // 现在可以清除 sessionStorage 了
        sessionStorage.removeItem(TRANSITION_STORAGE_KEY)

        // 关键修复：等待页面真正渲染完成后再开始收缩
        // 使用 requestAnimationFrame 多次确保内容已渲染
        const waitForPageReady = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                console.log('Page rendering complete, starting shrink animation')
                setShowGlobalMask(false) // 在收缩开始前关闭全局遮罩

                // 差序收缩动画 - 从外到内
                layers.forEach((layer, index) => {
                  setTimeout(() => {
                    layer.style.width = '0px'
                    layer.style.height = '0px'
                    layer.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.8}ms ease-out ${SHRINK_DURATION * 0.2}ms`
                    layer.style.opacity = '0'
                  }, (2 - index) * RIPPLE_DELAY) // 外层先收缩
                })

                setTimeout(() => {
                  console.log('Shrink animation complete')
                  setIsAnimating(false)
                  setPhase('idle')
                }, SHRINK_DURATION + RIPPLE_DELAY * 2 + 100)
              })
            })
          })
        }

        // 增加延迟，确保Suspense内容已完全渲染
        setTimeout(waitForPageReady, SHRINK_DELAY + 200)
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

    const layer1 = layer1Ref.current
    const layer2 = layer2Ref.current
    const layer3 = layer3Ref.current

    if (!layer1 || !layer2 || !layer3) {
      console.error('Layer refs not found')
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

    const layers = [layer1, layer2, layer3]

    // 设置初始状态（从点击位置开始，大小为0）
    layers.forEach(layer => {
      layer.style.left = `${clientX}px`
      layer.style.top = `${clientY}px`
      layer.style.width = '0px'
      layer.style.height = '0px'
      layer.style.transform = 'translate(-50%, -50%)'
      layer.style.opacity = '1'
    })

    // 开始差序扩散动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const finalSize = maxRadius * 2.2 // 稍微大一点确保覆盖整个屏幕

        // 三个圆都扩散到全屏，但依次启动形成波纹效果
        // layer1 = 白色（先扩散）
        // layer2 = 蓝色（第二个扩散）
        // layer3 = 白色（最后扩散）

        layers.forEach((layer, index) => {
          setTimeout(() => {
            layer.style.width = `${finalSize}px`
            layer.style.height = `${finalSize}px`
            layer.style.transition = `width ${REVEAL_DURATION}ms ${REVEAL_EASING}, height ${REVEAL_DURATION}ms ${REVEAL_EASING}`
          }, index * RIPPLE_DELAY) // 依次扩散：白→蓝→白
        })
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

            // 差序收缩 - 从外到内
            layers.forEach((layer, index) => {
              setTimeout(() => {
                layer.style.width = '0px'
                layer.style.height = '0px'
                layer.style.transition = `width ${SHRINK_DURATION}ms ${SHRINK_EASING}, height ${SHRINK_DURATION}ms ${SHRINK_EASING}, opacity ${SHRINK_DURATION * 0.6}ms ${SHRINK_EASING}`
                layer.style.opacity = '0'
              }, (2 - index) * RIPPLE_DELAY) // 外层先收缩
            })

            const shrinkTimer = setTimeout(() => {
              console.log('Shrink complete')
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
