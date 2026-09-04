import { useEffect, useRef, useState } from 'react'
import { useMusicPlayer } from '../contexts/MusicPlayerContext'
import '../styles/music-visualizer.css'

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
    if (!audioElement) {
      console.log('Waiting for audioElement...')
      return
    }

    if (isInitialized) {
      console.log('Already initialized, skipping')
      return
    }

    console.log('Initializing audio analyzer with audioElement:', audioElement)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      analyser.minDecibels = -90
      analyser.maxDecibels = -10

      console.log('Creating media element source...')
      const source = audioContext.createMediaElementSource(audioElement)
      console.log('Connecting source to analyser...')
      source.connect(analyser)
      console.log('Connecting analyser to destination...')
      analyser.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source

      setIsInitialized(true)
      console.log('Audio analyzer initialized! fftSize:', analyser.fftSize, 'bufferLength:', analyser.frequencyBinCount)

      // 测试立即读取数据
      const testData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(testData)
      const testSum = testData.reduce((a, b) => a + b, 0)
      console.log('Initial test data sum:', testSum, 'first few values:', Array.from(testData.slice(0, 10)))
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error)
    }
  }, [audioElement, isInitialized])

  // 处理可视化动画
  useEffect(() => {
    console.log('Animation effect triggered. isInitialized:', isInitialized, 'isPlaying:', isPlaying, 'canvas:', !!canvasRef.current, 'analyser:', !!analyserRef.current)

    if (!isInitialized || !canvasRef.current || !analyserRef.current) {
      console.log('Cannot start animation, missing requirements')
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    console.log('Setting up canvas and data array. bufferLength:', bufferLength)

    // 设置canvas尺寸
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      // 如果容器高度为0，使用父元素的高度
      const actualHeight = rect.height > 0 ? rect.height : canvas.parentElement?.getBoundingClientRect().height || 100
      canvas.width = rect.width
      canvas.height = actualHeight
      console.log('Canvas size set to:', canvas.width, 'x', canvas.height, '(actual height from container:', actualHeight, ')')
    }
    updateCanvasSize()

    // 添加延迟的尺寸更新，等待CSS动画完成
    const sizeUpdateTimer = setTimeout(updateCanvasSize, 450)

    window.addEventListener('resize', updateCanvasSize)

    const draw = () => {
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.width
      const height = canvas.height

      // 清空画布
      ctx.clearRect(0, 0, width, height)

      // 检查是否有音频数据
      const sum = dataArray.reduce((a, b) => a + b, 0)
      const avg = sum / bufferLength

      if (sum === 0) {
        console.log('No audio data detected, sum is 0')
      } else if (avg < 1) {
        console.log('Very low audio data, avg:', avg.toFixed(2))
      }

      // 绘制频谱柱 - W形布局：两端高，1/4和3/4处低，中间高
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
      // 恢复音频上下文
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended audio context...')
        audioContextRef.current.resume().then(() => {
          console.log('Audio context resumed, state:', audioContextRef.current.state)
        })
      } else {
        console.log('Audio context state:', audioContextRef.current.state)
      }
      console.log('Starting visualization animation')
      draw()
    } else {
      // 停止动画
      console.log('Stopping animation. isPlaying:', isPlaying, 'audioContext:', !!audioContextRef.current)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      // 清空画布
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
