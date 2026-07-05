/**
 * Utilidad compartida para generar PDFs limpios sin dependencias externas.
 * Abre ventana dedicada con CSS profesional A4 y auto-dispara print().
 * El usuario guarda como PDF desde el dialogo nativo del navegador.
 */

const PDF_STYLES = `
  @page { size: A4; margin: 15mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  body {font-family:'Segoe UI',system-ui,sans-serif;padding:24px;font-size:13px;color:#1a202c;line-height:1.6}
  h1{font-size:20px;color:#1a365d;border-bottom:2px solid #1a365d;padding-bottom:8px;margin-bottom:16px}
  h2{font-size:16px;color:#2d3748;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:16px 0 8px}
  h3{font-size:14px;color:#4a5568;margin:12px 0 6px}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;font-size:12px}
  th{background:#edf2f7;font-weight:600}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}
  .kpi-card{border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f7fafc;text-align:center}
  .kpi-value{font-size:22px;font-weight:700}
  .kpi-label{font-size:11px;color:#718096;margin-top:2px}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500}
  .text-green{color:#276749}.text-blue{color:#2b6cb0}.text-amber{color:#c05621}.text-red{color:#e53e3e}
  .footer{margin-top:24px;padding-top:12px;border-top:2px solid #1a365d;font-size:10px;color:#a0aec0;text-align:center}
  .text-right{text-align:right}.font-bold{font-weight:700}.font-mono{font-family:Consolas,monospace}
  .mb-4{margin-bottom:16px}.mt-2{margin-top:8px}
  .separator{border-top:1px solid #e2e8f0;margin:12px 0}
`

export interface PdfOptions { title: string; autoPrint?: boolean; footerText?: string }

export function generateCleanPdf(contentHtml: string, options: PdfOptions): void {
  const { title, autoPrint = true, footerText } = options
  const printWindow = window.open("", "_blank")
  if (!printWindow) { console.error("[exportPdf] Popup bloqueado"); return }
  const footer = footerText ?? "Sistema de Cobro Coactivo - DESAJ Antioquia"
  const timestamp = new Date().toLocaleString("es-CO")
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>${PDF_STYLES}</style></head><body>${contentHtml}<div class="footer">${footer}<br>Generado: ${timestamp}</div><div class="no-print" style="text-align:center;margin-top:16px"><p style="color:#718096;font-size:12px">Seleccione "Guardar como PDF" para descargar.</p></div></body></html>`
  printWindow.document.write(html); printWindow.document.close(); printWindow.focus()
  if (autoPrint) { setTimeout(() => printWindow.print(), 500) }
}