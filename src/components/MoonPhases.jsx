import '../styles/moon-phases.css'

// 计算当前月相（0-29天的月相周期）
function getCurrentMoonPhase() {
  const now = new Date()
  // 已知新月日期：2000年1月6日
  const knownNewMoon = new Date(2000, 0, 6)
  const daysSinceKnownNewMoon = (now - knownNewMoon) / (1000 * 60 * 60 * 24)
  const LUNAR_CYCLE = 29.53059 // 月相周期天数
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

  const allPhases = [
    { name: '新月' },
    { name: '峨眉月' },
    { name: '上弦月' },
    { name: '盈凸月' },
    { name: '满月' },
    { name: '亏凸月' },
    { name: '下弦月' },
    { name: '残月' },
  ]

  return (
    <div className={`moon-phases ${isVisible ? 'moon-phases--visible' : 'moon-phases--hidden'}`}>
      <div className="moon-phases-track">
        {allPhases.map((phase, index) => (
          <div
            key={phase.name}
            className={`moon-phase-item ${index === currentInfo.index ? 'is-current' : ''}`}
            title={phase.name}
          >
            <span className="moon-phase-icon"></span>
            <span className="moon-phase-label">{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MoonPhases
