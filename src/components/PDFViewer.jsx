import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function PDFViewer({ url, fileName }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 使用代理 URL 来绕过 CORS
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error) {
    console.error('PDF 加载错误:', error)
    setError('无法加载 PDF 文件')
    setLoading(false)
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
      {loading && <div className="pdf-loading">正在加载 PDF...</div>}

      {error && (
        <div className="pdf-error">
          <p>{error}</p>
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
        file={proxyUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
      >
        <Page
          pageNumber={pageNumber}
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
