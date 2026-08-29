import { useEffect, useState } from 'react'
import './MobileNotice.css'

function MobileNotice() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // 检查是否已经关闭过
    const dismissed = sessionStorage.getItem('mobile-notice-dismissed')
    if (dismissed) {
      return
    }

    // 检测是否是移动设备
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('mobile-notice-dismissed', 'true')
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="mobile-notice">
      <div className="mobile-notice-content">
        <div className="mobile-notice-icon">💻</div>
        <h3>最佳体验提示</h3>
        <p>本网站为桌面端优化设计，包含轮盘导航、热点交互、音乐播放器等复杂功能。</p>
        <p><strong>建议使用电脑访问以获得完整体验。</strong></p>
        <button type="button" onClick={handleDismiss} className="mobile-notice-dismiss">
          我知道了，继续浏览
        </button>
      </div>
    </div>
  )
}

export default MobileNotice
