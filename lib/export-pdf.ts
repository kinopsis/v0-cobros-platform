  if (!printWindow) {
    console.error("[exportPdf] Popup bloqueado por el navegador")
    window.alert("El navegador bloque\u00f3 la ventana de exportaci\u00f3n. Habilite las ventanas emergentes para exportar el PDF.")
    return
  }