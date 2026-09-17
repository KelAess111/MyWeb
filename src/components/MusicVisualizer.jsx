import { useEffect, useRef, useState } from 'react'
import { useMusicPlayer } from '../contexts/MusicPlayerContext'
import '../styles/music-visualizer.css'
import Annotate from './Annotate'

function MusicVisualizer() {
  const { isPlaying, audioElement } = useMusicPlayer()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化音频分析器（只执行一次）
  useEffect(() => {
    if (!audioElement || isInitialized) {
      return
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      analyser.minDecibels = -90
      analyser.maxDecibels = -10

      const source = audioContext.createMediaElementSource(audioElement)
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source

      setIsInitialized(true)
    } catch {
      // Silently fail if audio analyzer cannot be initialized
    }
  }, [audioElement, isInitialized])

  // 处理可视化动画
  useEffect(() => {
    if (!isInitialized || !canvasRef.current || !analyserRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const actualHeight = rect.height > 0 ? rect.height : canvas.parentElement?.getBoundingClientRect().height || 100
      canvas.width = rect.width
      canvas.height = actualHeight
    }
    updateCanvasSize()

    const sizeUpdateTimer = setTimeout(updateCanvasSize, 450)

    window.addEventListener('resize', updateCanvasSize)

    const draw = () => {
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      const barCount = 120
      const barWidth = (width / barCount) * 0.5
      const gap = (width / barCount) * 0.5

      // 只使用前80%的频率数据（主要是中低频，能量集中）
      const usableBufferLength = Math.floor(bufferLength * 0.8)

      for (let i = 0; i < barCount; i++) {
        // 归一化位置 0-1
        const normalizedPos = i / (barCount - 1)

        // W形映射：创建两个波峰（0, 0.5, 1处高）
        // 使用三角波形式
        let frequencyPos
        if (normalizedPos < 0.25) {
          // 左端到左谷：从中频到低频
          frequencyPos = 0.5 - normalizedPos * 2
        } else if (normalizedPos < 0.5) {
          // 左谷到中峰：从低频到中频
          frequencyPos = (normalizedPos - 0.25) * 2
        } else if (normalizedPos < 0.75) {
          // 中峰到右谷：从中频到低频
          frequencyPos = 0.5 - (normalizedPos - 0.5) * 2
        } else {
          // 右谷到右端：从低频到中频
          frequencyPos = (normalizedPos - 0.75) * 2
        }

        const dataIndex = Math.floor(frequencyPos * usableBufferLength)
        const rawValue = dataArray[dataIndex]

        // 增强对比度：使用幂函数增加高低差
        const normalizedValue = rawValue / 255
        const enhancedValue = Math.pow(normalizedValue, 0.7) // 0.7次方会拉大差距
        const barHeight = Math.max(enhancedValue * height * 0.9, 1)

        const x = i * (barWidth + gap)
        const y = height - barHeight

        // 创建渐变（更透明）
        const gradient = ctx.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0, 'rgba(162, 210, 255, 0.3)')
        gradient.addColorStop(0.5, 'rgba(200, 177, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 200, 221, 0.5)')

        ctx.fillStyle = gradient
        ctx.shadowColor = 'rgba(162, 210, 255, 0.3)'
        ctx.shadowBlur = 6
        ctx.fillRect(x, y, barWidth, barHeight)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isPlaying && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      draw()
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      clearTimeout(sizeUpdateTimer)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [isPlaying, isInitialized])

  return (
    <div className={`music-visualizer ${isPlaying ? 'is-playing' : ''}`}>
      <canvas ref={canvasRef} className="music-visualizer-canvas" />
    </div>
  )
}

export default MusicVisualizer
