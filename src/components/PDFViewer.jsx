import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// 配置 PDF.js worker - 使用本地打包的 worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const options = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

function PDFViewer({ url, fileName }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState(null)

  // 使用代理 URL 来绕过 CORS
  const proxyUrl = /^https:\/\/github\.com\//i.test(url) ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : url

  // PDF 加载选项 - 启用分块加载

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setLoading(false)
    setLoadingProgress(100)
    setError(null)
  }

  function onDocumentLoadError(error) {
    console.error('PDF 加载错误:', error)
    setError('无法加载 PDF 文件')
    setLoading(false)
  }

  function onDocumentLoadProgress({ loaded, total }) {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 100)
      setLoadingProgress(progress)
    }
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  return (
    <div className="pdf-viewer-container">
      <a className="pdf-original-link" href={url} target="_blank" rel="noopener noreferrer">打开 PDF 原文件 ↗</a>
      {loading && (
        <div className="pdf-loading">
          <div className="loading-spinner"></div>
          <p>正在加载 PDF...</p>
          <div className="pdf-progress-bar">
            <div
              className="pdf-progress-fill"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="pdf-progress-text">{loadingProgress}%</p>
        </div>
      )}

      {error && (
        <div className="pdf-error">
          <p>{error}。可以使用原文件继续阅读。</p>
          <a
            href={url}
            download={fileName}
            className="btn secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            直接下载 PDF
          </a>
        </div>
      )}

      <Document
        suspense={false}
        file={proxyUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onLoadProgress={onDocumentLoadProgress}
        options={options}
        loading=""
        error=""
      >
        <Page
          suspense={false}
          pageNumber={pageNumber}
          onRenderError={() => setError('这一页暂时无法显示')}
          error="这一页暂时无法显示，请打开原文件阅读。"
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      {numPages && (
        <div className="pdf-controls">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="btn secondary"
          >
            上一页
          </button>
          <span className="pdf-page-info">
            第 {pageNumber} 页 / 共 {numPages} 页
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="btn secondary"
          >
            下一页
          </button>
          <a
            href={url}
            download={fileName}
            className="btn secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            下载 PDF
          </a>
        </div>
      )}
    </div>
  )
}

export default PDFViewer
