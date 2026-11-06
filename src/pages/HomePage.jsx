import { useEffect } from 'react'
import HeroSection from '../components/HeroSection'
import HomeLauncher from '../components/HomeLauncher'
import HomeClock from '../components/HomeClock'
import useHomeEnvironment from '../hooks/useHomeEnvironment'

function HomePage({ onReady, musicUiState, onOcAreaChange }) {
  const environment = useHomeEnvironment()
  useEffect(() => { onReady?.() }, [onReady])

  return (
    <main className="home-main">
      <div className="home-focus-layout">
        <aside className="home-sidebar" aria-label="首页快捷区">
          <HomeLauncher isVisible={true} />
        </aside>

        <div className="home-stage">
          <div className="home-utility-dock" aria-label="首页工具">
            <HomeClock isVisible={true} now={environment.now} weather={environment.weather} />
          </div>
          <HeroSection
            isVisible={true}
            dayPeriod={environment.dayPeriod}
            musicUiState={musicUiState}
            onOcAreaChange={onOcAreaChange}
          />
        </div>
      </div>
    </main>
  )
}

export default HomePage

