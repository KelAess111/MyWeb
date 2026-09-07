import { useEffect, useRef, useState } from 'react'
import '../styles/moon-phases.css'

// 计算当前月相（0-29天的月相周期）
function getCurrentMoonPhase() {
  const now = new Date()
  const knownNewMoon = new Date(2000, 0, 6)
  const daysSinceKnownNewMoon = (now - knownNewMoon) / (1000 * 60 * 60 * 24)
  const LUNAR_CYCLE = 29.53059
  const phase = daysSinceKnownNewMoon % LUNAR_CYCLE
  return phase
}

// 根据月相返回对应的月相名称和图标
function getMoonPhaseInfo(phase) {
  if (phase < 1.84566) return { name: '新月', index: 0 }
  if (phase < 5.53699) return { name: '峨眉月', index: 1 }
  if (phase < 9.22831) return { name: '上弦月', index: 2 }
  if (phase < 12.91963) return { name: '盈凸月', index: 3 }
  if (phase < 16.61096) return { name: '满月', index: 4 }
  if (phase < 20.30228) return { name: '亏凸月', index: 5 }
  if (phase < 23.99361) return { name: '下弦月', index: 6 }
  if (phase < 27.68493) return { name: '残月', index: 7 }
  return { name: '新月', index: 0 }
}

function MoonPhases({ isVisible = true }) {
  const currentPhase = getCurrentMoonPhase()
  const currentInfo = getMoonPhaseInfo(currentPhase)
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const [rotation, setRotation] = useState(0)

  const allPhases = [
    { name: '新月', index: 0 },
    { name: '峨眉月', index: 1 },
    { name: '上弦月', index: 2 },
    { name: '盈凸月', index: 3 },
    { name: '满月', index: 4 },
    { name: '亏凸月', index: 5 },
    { name: '下弦月', index: 6 },
    { name: '残月', index: 7 },
  ]

  // 自动旋转动画
  useEffect(() => {
    if (!isVisible) return

    let lastTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      setRotation((prev) => prev + 0.3 * delta * 60)

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible])

  return (
    <div
      ref={containerRef}
      className={`moon-phases ${isVisible ? 'moon-phases--visible' : 'moon-phases--hidden'}`}
    >
      <svg className="moon-phases-wave" viewBox="0 0 200 700" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* 为每个月相定义遮罩 */}
          {allPhases.map((phase, index) => {
            // 月牙遮罩的圆心位置（相对于月亮中心的偏移百分比）
            let maskOffsetX = 0
            if (index === 0) maskOffsetX = 0 // 新月 - 完全遮罩
            else if (index === 1) maskOffsetX = -10 // 峨眉月
            else if (index === 2) maskOffsetX = -14 // 上弦月
            else if (index === 3) maskOffsetX = -20 // 盈凸月
            else if (index === 5) maskOffsetX = 20 // 亏凸月
            else if (index === 6) maskOffsetX = 14 // 下弦月
            else if (index === 7) maskOffsetX = 10 // 残月

            return (
              <mask key={`mask-${index}`} id={`moon-mask-${index}`}>
                {/* 白色表示显示的部分 */}
                <circle cx="0" cy="0" r="18" fill="white" />
                {/* 黑色表示遮罩的部分（月牙的暗部） */}
                {/* 新月需要完全遮罩，但要保留一个细边缘轮廓 */}
                {index === 0 ? (
                  <circle cx="0" cy="0" r="17" fill="black" />
                ) : index !== 4 ? (
                  <circle cx={maskOffsetX} cy="0" r="18" fill="black" />
                ) : null}
              </mask>
            )
          })}
        </defs>

        {/* 月相在垂直方向排列，水平位置做正弦波摆动 */}
        {allPhases.map((phase, index) => {
          const t = (index / allPhases.length) + (rotation / 360)
          const y = 180 + index * 70 // 起始位置从 80 改为 180（下移 100px）
          const xOffset = Math.sin(t * Math.PI * 2) * 50 // 水平摆动
          const x = 100 + xOffset

          // 根据摆动位置计算深度感（前后关系）- 减小深度变化
          const depth = Math.cos(t * Math.PI * 2) // -1 到 1
          const scale = 0.85 + depth * 0.15 // 0.7 到 1 (改为更小的变化范围)
          const opacity = 0.7 + depth * 0.3 // 0.4 到 1 (提高最小透明度)

          const isCurrent = index === currentInfo.index
          const size = isCurrent ? 18 : 14 // 当前月相更大

          return (
            <g
              key={`${phase.name}-${index}`}
              className={`moon-phase-item-svg ${isCurrent ? 'is-current' : ''}`}
              transform={`translate(${x}, ${y}) scale(${scale})`}
              opacity={opacity}
            >
              {/* 当前月相的外环标记 */}
              {isCurrent && (
                <circle
                  cx="0"
                  cy="0"
                  r={size + 6}
                  fill="none"
                  stroke="#a2d2ff"
                  strokeWidth="2"
                  opacity="0.6"
                  className="moon-phase-ring"
                />
              )}

              {/* 使用遮罩的月亮 */}
              <circle
                cx="0"
                cy="0"
                r={size}
                fill="#a2d2ff"
                mask={`url(#moon-mask-${index})`}
                className="moon-phase-circle"
              />

              {/* 月相名称 */}
              <text
                x="0"
                y={size + 20}
                fontSize={isCurrent ? "10" : "9"}
                fill={isCurrent ? '#a2d2ff' : '#8a9ab8'}
                textAnchor="middle"
                fontWeight={isCurrent ? "700" : "400"}
                className="moon-phase-label-svg"
              >
                {phase.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default MoonPhases
