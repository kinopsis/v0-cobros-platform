// Copia el worker de PDF.js a public/ para que react-pdf pueda cargarlo.
// Se ejecuta automaticamente antes de dev/build (predev/prebuild).
const path = require('node:path')
const fs = require('node:fs')

// Resuelve desde el pdfjs-dist anidado de react-pdf para garantizar
// que el worker coincida con la API que react-pdf usa internamente.
const reactPdfPath = path.dirname(require.resolve('react-pdf/package.json'))
const pdfjsDistPath = path.join(reactPdfPath, 'node_modules', 'pdfjs-dist')
const workerSrc = path.join(pdfjsDistPath, 'build', 'pdf.worker.min.mjs')
const destDir = path.join(process.cwd(), 'public')
const dest = path.join(destDir, 'pdf.worker.min.mjs')

if (!fs.existsSync(workerSrc)) {
  console.warn('[copy-pdf-worker] No se encontro pdf.worker.min.mjs en', workerSrc)
  process.exit(0)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(workerSrc, dest)
console.log('[copy-pdf-worker] Worker copiado a', dest)
