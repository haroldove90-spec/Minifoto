/**
 * Utility for POS thermal receipt printing in web and iframe environments.
 */

export const printTicketElement = (elementId = 'printable-ticket'): boolean => {
  const printEl = document.getElementById(elementId);
  if (!printEl) {
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }

  try {
    // 1. Create or retrieve an isolated iframe dedicated to printing
    let printIframe = document.getElementById('pos-thermal-print-iframe') as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'pos-thermal-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.zIndex = '-9999';
      document.body.appendChild(printIframe);
    }

    const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <title>Ticket POS Fotografía</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body {
                margin: 0;
                padding: 10px 12px;
                width: 76mm;
                max-width: 100%;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                line-height: 1.35;
              }
              img {
                display: block;
                margin: 0 auto 6px auto;
                max-width: 80%;
                height: auto;
                object-fit: contain;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .border-dashed { border-top: 1px dashed #000; margin: 8px 0; }
              .flex-between { display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            ${printEl.innerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          printIframe?.contentWindow?.focus();
          printIframe?.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print execution fallback to window.print', err);
          window.print();
        }
      }, 300);
      return true;
    }
  } catch (error) {
    console.error('Failed to print via iframe, falling back to window.print', error);
  }

  // Fallback
  try {
    window.print();
    return true;
  } catch (e) {
    console.error('Fallback print also failed:', e);
    return false;
  }
};
