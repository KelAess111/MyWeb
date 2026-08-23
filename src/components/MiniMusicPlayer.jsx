import { useEffect, useMemo, useRef, useState } from 'react'
import { useMusicPlayer } from '../contexts/MusicPlayerContext'
import '../styles/mini-music-player.css'

function MiniMusicPlayer({ isHomePage = false, ocArea = null, onUiStateChange }) {
  const playerRef = useRef(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    activeTab,
    activeTrack,
    activeTrackIndex,
    audioStatus,
    autoplayNext,
    duration,
    formatTime,
    handleMessageSubmit,
    handleProgressChange,
    handleSelectTrack,
    handleSetPlaybackMode,
    handleToggleAutoplayNext,
    handleTogglePlay,
    handleTrackChange,
    isPlaying,
    messageName,
    messageStatus,
    messageText,
    messages,
    musicTracks,
    playbackMode,
    progressValue,
    setActiveTab,
    setMessageName,
    setMessageStatus,
    setMessageText,
  } = useMusicPlayer()

  const shellClassName = useMemo(
    () => `global-music-player-shell ${isExpanded ? 'is-expanded' : ''} ${isPlaying ? 'is-playing' : ''} ${isHomePage ? 'is-homepage' : ''}`.trim(),
    [isExpanded, isHomePage, isPlaying],
  )

  const playerClassName = useMemo(
    () => `global-music-player accent-${activeTrack?.accent ?? 'violet'} ${isExpanded ? 'is-expanded' : ''}`.trim(),
    [activeTrack?.accent, isExpanded],
  )

  const panelStyle = useMemo(() => {
    if (!isExpanded || !isHomePage || !ocArea) {
      return undefined
    }

    const safeBottomSpace = Math.max(250, window.innerHeight - ocArea.top - 36)
    return {
      maxHeight: `${Math.min(safeBottomSpace, 460)}px`,
    }
  }, [isExpanded, isHomePage, ocArea])

  useEffect(() => {
    onUiStateChange?.({
      isExpanded,
      isPlaying,
      activeTrackId: activeTrack?.id ?? null,
      activeTrackTitle: activeTrack?.title ?? '',
      lastInteractedAt: isExpanded ? Date.now() : 0,
    })
  }, [activeTrack?.id, activeTrack?.title, isExpanded, isPlaying, onUiStateChange])

  useEffect(() => {
    if (!isExpanded) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!playerRef.current?.contains(event.target)) {
        setActiveTab('player')
        setIsExpanded(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isExpanded, setActiveTab])

  const handleToggleExpanded = () => {
    if (isExpanded) {
      setActiveTab('player')
    }

    setIsExpanded((current) => !current)
  }

  return (
    <aside className={shellClassName} style={panelStyle} aria-label="Right Corner Radio">
      <div className={playerClassName} ref={playerRef}>
        <div className="music-player-entry-shell">
          <button
            type="button"
            className="music-player-entry"
            aria-expanded={isExpanded}
            aria-controls="right-corner-radio-panel"
            aria-label={isExpanded ? '收起 Right Corner Radio' : '展开 Right Corner Radio'}
            onClick={handleToggleExpanded}
          >
            <span className="music-player-vinyl" aria-hidden="true">
              <span className="music-player-vinyl-ring" />
              <span className="music-player-vinyl-core" />
            </span>
            <span className={`music-player-led ${isPlaying ? 'is-playing' : 'is-idle'}`} aria-hidden="true" />
            <span className="music-player-entry-copy">
              <span className="music-player-entry-title">Right Corner Radio</span>
              <span className="music-player-entry-subtitle">{isPlaying ? activeTrack?.title ?? '正在播放' : '点击接入广播'}</span>
            </span>
          </button>

          <button
            type="button"
            className="music-player-entry-control"
            aria-label={isPlaying ? '暂停播放' : '开始播放'}
            onClick={handleTogglePlay}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
        </div>

        <div className={`music-player-expanded-panel ${isExpanded ? 'is-visible' : ''}`} id="right-corner-radio-panel">
          <div className="music-player-panel-tabs" role="tablist" aria-label="广播面板标签">
            <button
              type="button"
              className={`music-player-tab ${activeTab === 'player' ? 'is-active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'player'}
              onClick={() => setActiveTab('player')}
            >
              播放中 / 曲目列表
            </button>
            <button
              type="button"
              className={`music-player-tab ${activeTab === 'messages' ? 'is-active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'messages'}
              onClick={() => setActiveTab('messages')}
            >
              听众留言
            </button>
          </div>

          <div className="music-player-panel-stage">
            <section className={`music-player-tab-panel ${activeTab === 'player' ? 'is-active' : ''}`} aria-hidden={activeTab !== 'player'}>
              <div className="music-player-panel-meta">
                <div className="music-player-panel-copy">
                  <span className="music-player-panel-kicker">正在广播</span>
                  <h3>{activeTrack?.title ?? '未设置曲目'}</h3>
                  <p>
                    {activeTrack?.artist ?? 'KelAess'} · {formatTime(progressValue)} / {duration > 0 ? formatTime(duration) : '0:00'}
                  </p>
                </div>

                <div className="music-player-control-row">
                  <button type="button" className="music-player-icon-btn" aria-label="上一首" onClick={() => handleTrackChange(-1)}>
                    ⏮
                  </button>
                  <button type="button" className="music-player-play-btn" aria-label={isPlaying ? '暂停播放' : '开始播放'} onClick={handleTogglePlay}>
                    {isPlaying ? '暂停' : '播放'}
                  </button>
                  <button type="button" className="music-player-icon-btn" aria-label="下一首" onClick={() => handleTrackChange(1)}>
                    ⏭
                  </button>
                </div>
              </div>

              <div className="music-player-progress-block">
                <div className="music-player-playback-options" aria-label="播放选项">
                  <button
                    type="button"
                    className={`music-player-option-chip ${autoplayNext ? 'is-active' : ''}`}
                    aria-pressed={autoplayNext}
                    onClick={handleToggleAutoplayNext}
                  >
                    自动连播 {autoplayNext ? '开启' : '关闭'}
                  </button>

                  <div className="music-player-mode-group" role="group" aria-label="播放模式">
                    <button
                      type="button"
                      className={`music-player-option-chip ${playbackMode === 'sequential' ? 'is-active' : ''}`}
                      aria-pressed={playbackMode === 'sequential'}
                      onClick={() => handleSetPlaybackMode('sequential')}
                    >
                      顺序播放
                    </button>
                    <button
                      type="button"
                      className={`music-player-option-chip ${playbackMode === 'loop' ? 'is-active' : ''}`}
                      aria-pressed={playbackMode === 'loop'}
                      onClick={() => handleSetPlaybackMode('loop')}
                    >
                      列表循环
                    </button>
                    <button
                      type="button"
                      className={`music-player-option-chip ${playbackMode === 'shuffle' ? 'is-active' : ''}`}
                      aria-pressed={playbackMode === 'shuffle'}
                      onClick={() => handleSetPlaybackMode('shuffle')}
                    >
                      随机播放
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="0.1"
                  value={duration > 0 ? progressValue : 0}
                  onChange={handleProgressChange}
                  className="music-player-progress"
                  aria-label="播放进度"
                />
                <div className="music-player-status-line" aria-live="polite">
                  {audioStatus === 'error'
                    ? activeTrack?.note ?? '当前歌曲资源暂时不可播放，请检查路径。'
                    : audioStatus === 'missing'
                      ? '当前曲目还没有配置可播放文件。'
                      : autoplayNext
                        ? playbackMode === 'loop'
                          ? '已开启自动连播：播放到末尾时会从头继续。'
                          : playbackMode === 'shuffle'
                            ? '已开启自动连播：下一首会随机切换到不同曲目。'
                            : '已开启自动连播：当前曲目结束后会自动播放下一首。'
                        : '自动连播已关闭，当前曲目结束后会停止播放。'}
                </div>
              </div>

              <div className="music-player-track-panel">
                <div className="music-player-section-heading">
                  <h4>曲目列表</h4>
                  <p>点击曲目直接切歌。</p>
                </div>

                <div className="music-player-track-list" role="list" aria-label="预设歌曲列表">
                  {musicTracks.map((track, index) => (
                    <button
                      key={track.id}
                      type="button"
                      className={`music-player-track-row ${index === activeTrackIndex ? 'is-active' : ''}`}
                      onClick={() => handleSelectTrack(index)}
                    >
                      <span className="music-player-track-row-main">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`music-player-tab-panel ${activeTab === 'messages' ? 'is-active' : ''}`} aria-hidden={activeTab !== 'messages'}>
              <form className="music-player-message-form" onSubmit={handleMessageSubmit}>
                <div className="music-player-section-heading">
                  <h4>听众留言</h4>
                  <p>广播匿名信道已建立。</p>
                </div>

                <label className="music-player-field">
                  <span>代号（可选）</span>
                  <input
                    type="text"
                    value={messageName}
                    onChange={(event) => setMessageName(event.target.value)}
                    placeholder="例如：夜访者 / Layer7"
                  />
                </label>

                <label className="music-player-field">
                  <span>终端留言</span>
                  <textarea
                    rows="3"
                    value={messageText}
                    onChange={(event) => {
                      setMessageText(event.target.value)
                      if (messageStatus !== 'idle') {
                        setMessageStatus('idle')
                      }
                    }}
                    placeholder="[ 广播匿名信道已建立... ]"
                  />
                </label>

                <div className="music-player-request-actions">
                  <button type="submit" className="btn primary" disabled={messageStatus === 'sending'}>
                    {messageStatus === 'sending' ? '发送中…' : '发送留言'}
                  </button>
                  <p className={`music-player-feedback is-${messageStatus}`}>
                    {messageStatus === 'sent'
                      ? '留言已保存，并已发送到你的 QQ 邮箱。'
                      : messageStatus === 'saved_only'
                        ? '留言已保存到本地；待你配置 Formspree 后即可同步发信。'
                        : messageStatus === 'send_failed'
                          ? '留言已保存在本地，但发送邮件失败，请检查 Formspree 配置。'
                          : messageStatus === 'empty'
                            ? '请先输入一点内容，再建立广播。'
                            : '留言会保存在本地，配置 Formspree 后也会同步发到邮箱。'}
                  </p>
                </div>
              </form>

              <div className="music-player-message-list" role="list" aria-label="听众留言列表">
                {messages.length ? (
                  messages.map((message) => (
                    <article key={message.id} className="music-player-message-card">
                      <div className="music-player-message-head">
                        <strong>{message.name}</strong>
                        <span>{message.createdAt}</span>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="music-player-message-empty">暂无留言。第一条广播就从你开始。</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default MiniMusicPlayer
