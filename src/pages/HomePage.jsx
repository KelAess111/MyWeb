import { useEffect, useState } from 'react'
import HeroSection from '../components/HeroSection'
import HomeLauncher from '../components/HomeLauncher'
import HomeClock from '../components/HomeClock'
import useHomeEnvironment from '../hooks/useHomeEnvironment'

function HomePage({ initialReplayIntroEnabled, musicUiState, onOcAreaChange }) {
  const environment = useHomeEnvironment()

  const shouldSkipIntroOnEntry = !initialReplayIntroEnabled
  const [introStage, setIntroStage] = useState(() => (shouldSkipIntroOnEntry ? 'done' : 'loading'))

  useEffect(() => {
    if (introStage === 'done') {
      return undefined
    }

    if (introStage === 'loading') {
      const loadingTimer = window.setTimeout(() => setIntroStage('greeting'), 900)
      return () => window.clearTimeout(loadingTimer)
    }

    if (introStage === 'greeting') {
      const promptTimer = window.setTimeout(() => setIntroStage('prompt'), 2000)
      return () => window.clearTimeout(promptTimer)
    }

    if (introStage === 'fadingOut') {
      const doneTimer = window.setTimeout(() => {
        setIntroStage('done')
      }, 820)

      return () => {
        window.clearTimeout(doneTimer)
      }
    }

    return undefined
  }, [introStage])

  const handleDismissIntro = () => {
    if (introStage === 'fadingOut' || introStage === 'done') {
      return
    }

    setIntroStage('fadingOut')
  }

  return (
    <main className="home-main">
      {introStage !== 'done' ? (
        <button type="button" className={`intro-overlay intro-overlay--${introStage}`} onClick={handleDismissIntro}>
          <div className="intro-overlay-noise" aria-hidden="true" />
          <div className="intro-overlay-glow" aria-hidden="true" />
          <div className="intro-overlay-content">
            <div className="intro-loader" aria-hidden={introStage !== 'loading'}>
              <span className="intro-loader-dot" />
              <span className="intro-loader-dot" />
              <span className="intro-loader-dot" />
            </div>
            <div className="intro-title-wrap">
              <span className="intro-title-kicker">WELCOME</span>
              <h1 className="intro-title">你好，创作者</h1>
            </div>
            <p className="intro-prompt">点击屏幕任意处</p>
          </div>
        </button>
      ) : null}

      <div className="home-focus-layout">
        <aside className="home-sidebar" aria-label="首页快捷区">
          <HomeLauncher isVisible={introStage === 'done'} />
        </aside>

        <div className="home-stage">
          <div className="home-utility-dock" aria-label="首页工具">
            <HomeClock isVisible={introStage === 'done'} now={environment.now} weather={environment.weather} />
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

