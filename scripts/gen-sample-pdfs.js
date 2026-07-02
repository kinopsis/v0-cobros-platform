// Genera PDFs minimales validos en public/docs/ para que los URLs mock resuelvan.
// Solo para demo/desarrollo. Reemplazar por documentos reales o Supabase Storage.
const path = require('node:path')
const fs = require('node:fs')

// PDF minimal de una pagina con texto.
function buildPdf(title) {
  const text = title
  // Objeto de contenido del stream
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

const docsDir = path.join(process.cwd(), 'public', 'docs')
fs.mkdirSync(docsDir, { recursive: true })

const samples = [
  { name: 'providencia_desacato.pdf', title: 'Providencia - Desacato (documento de muestra)' },
  { name: 'sentencia_costas.pdf', title: 'Sentencia - Costas (documento de muestra)' },
  { name: 'auto_reintegro.pdf', title: 'Auto - Reintegro (documento de muestra)' },
  { name: 'certificacion_cobro.pdf', title: 'Certificacion de Cobro (documento de muestra)' },
  { name: 'mandamiento_pago.pdf', title: 'Mandamiento de Pago (documento de muestra)' },
  { name: 'medidas_cautelares.pdf', title: 'Medidas Cautelares (documento de muestra)' },
]

samples.forEach(({ name, title }) => {
  fs.writeFileSync(path.join(docsDir, name), buildPdf(title))
})

console.log(`[gen-sample-pdfs] ${samples.length} PDFs generados en ${docsDir}`)
