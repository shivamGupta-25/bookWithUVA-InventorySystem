/**
 * Invoice Generation Utility
 * Handles the creation and generation of professional invoices
 */

/**
 * Generate a professional invoice for an order
 * @param {Object} order - The order object containing all order details
 */
export const generateInvoice = (order) => {
  if (!order) {
    console.error('No order data provided for invoice generation');
    return;
  }

  // Create invoice HTML content
  const invoiceHTML = createInvoiceHTML(order);

  // Create a new window with the invoice content
  const printWindow = window.open('', '_blank');
  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

/**
 * Create the HTML content for the invoice
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the invoice
 */
const createInvoiceHTML = (order) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        ${getInvoiceStyles()}
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${createInvoiceHeader(order)}
        <div class="invoice-content">
          ${createInvoiceInfo(order)}
          ${createItemsTable(order)}
          ${createTotalSection(order)}
          ${createNotesSection(order)}
        </div>
        ${createInvoiceFooter()}
      </div>
    </body>
    </html>
  `;
};

/**
 * Get the CSS styles for the invoice
 * @returns {string} - CSS styles
 */
const getInvoiceStyles = () => {
  return `
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 5px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #1a1a1a;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .invoice-header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%);
      color: white;
      padding: 25px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .invoice-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
      pointer-events: none;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease;
      overflow: hidden;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: auto;
      display: block;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      will-change: transform;
    }
    .company-info {
      text-align: left;
    }
    .company-name {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 5px 0;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .company-tagline {
      font-size: 1rem;
      opacity: 0.95;
      margin: 0;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    .invoice-title {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 0 0 10px 0;
      letter-spacing: -1px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .invoice-subtitle {
      font-size: 1.1rem;
      opacity: 0.95;
      margin: 0;
      font-weight: 400;
      letter-spacing: 0.3px;
    }
    .invoice-content {
      padding: 30px;
      background: white;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 25px;
    }
    .info-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .info-section h3 {
      color: #1e40af;
      margin: 0 0 15px 0;
      font-size: 1.2rem;
      font-weight: 700;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 8px;
      letter-spacing: -0.3px;
    }
    .info-item {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
      font-size: 0.95rem;
    }
    .info-value {
      color: #1e293b;
      font-weight: 500;
      font-size: 0.95rem;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .items-table th {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 16px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      border-bottom: 3px solid #1d4ed8;
    }
    .items-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.95rem;
      color: #334155;
      font-weight: 500;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .items-table tr:nth-child(even) {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    .items-table tr:hover {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      transition: background 0.2s ease;
    }
    .total-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 6px 0;
      font-size: 1rem;
    }
    .total-row.final {
      border-top: 3px solid #1e40af;
      margin-top: 15px;
      padding-top: 15px;
      font-size: 1.3rem;
      font-weight: 800;
      color: #1e40af;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 15px 20px;
      border-radius: 8px;
      margin: 15px -20px -20px -20px;
      box-shadow: 0 2px 8px rgba(30, 64, 175, 0.1);
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .status-pending { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
      color: #92400e; 
      border-color: #f59e0b;
    }
    .status-processing { 
      background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%); 
      color: #1e40af; 
      border-color: #3b82f6;
    }
    .status-shipped { 
      background: linear-gradient(135deg, #cffafe 0%, #67e8f9 100%); 
      color: #0e7490; 
      border-color: #06b6d4;
    }
    .status-delivered { 
      background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%); 
      color: #065f46; 
      border-color: #10b981;
    }
    .status-cancelled { 
      background: linear-gradient(135deg, #fecaca 0%, #f87171 100%); 
      color: #991b1b; 
      border-color: #ef4444;
    }
    .status-refunded { 
      background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%); 
      color: #374151; 
      border-color: #6b7280;
    }
    .payment-paid { 
      background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%); 
      color: #065f46; 
      border-color: #10b981;
    }
    .payment-pending { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
      color: #92400e; 
      border-color: #f59e0b;
    }
    .payment-failed { 
      background: linear-gradient(135deg, #fecaca 0%, #f87171 100%); 
      color: #991b1b; 
      border-color: #ef4444;
    }
    .payment-refunded { 
      background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%); 
      color: #374151; 
      border-color: #6b7280;
    }
    .footer {
      text-align: center;
      padding: 25px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      color: #475569;
      font-size: 0.95rem;
      border-top: 1px solid #e2e8f0;
    }
    .notes-section {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .notes-section h4 {
      margin: 0 0 12px 0;
      color: #1e40af;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .notes-section p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
      font-size: 0.95rem;
    }
    @media print {
      @page {
        margin: 0.4in;
        size: A4;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body { 
        background: white !important; 
        padding: 0;
        margin: 0;
        color: #000 !important;
        font-size: 13px;
        line-height: 1.4;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      .invoice-container { 
        box-shadow: none !important; 
        margin: 0;
        max-width: 100%;
        background: white !important;
        border-radius: 0 !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .invoice-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%) !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin-bottom: 0;
      }
      .invoice-content {
        padding: 12px 20px;
        background: white !important;
      }
      .invoice-info {
        gap: 12px;
        margin-bottom: 12px;
        grid-template-columns: 1fr 1fr;
      }
      .info-section {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        border: 1px solid #e2e8f0 !important;
        padding: 12px 15px !important;
        margin-bottom: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .info-section h3 {
        color: #1e40af !important;
        border-bottom: 2px solid #3b82f6 !important;
        font-size: 1rem !important;
        margin: 0 0 8px 0 !important;
        padding-bottom: 6px !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .info-item {
        margin-bottom: 5px !important;
        padding: 2px 0 !important;
      }
      .info-label {
        color: #475569 !important;
        font-size: 0.85rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .info-value {
        color: #1e293b !important;
        font-size: 0.85rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .items-table {
        margin: 8px 0;
        background: white !important;
        font-size: 0.8rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-inside: avoid;
        break-inside: avoid;
        border-collapse: collapse !important;
      }
      .items-table th {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
        color: white !important;
        padding: 6px 8px !important;
        font-size: 0.75rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .items-table th,
      .items-table td {
        padding: 6px 8px !important;
        border-bottom: 1px solid #e9ecef !important;
        font-size: 0.8rem !important;
        page-break-inside: avoid;
        break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .items-table tr:nth-child(even) {
        background-color: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .total-section {
        padding: 10px 12px !important;
        margin-top: 8px !important;
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .total-row {
        margin-bottom: 4px !important;
        padding: 3px 0 !important;
        font-size: 0.85rem !important;
      }
      .total-row.final {
        color: #1e40af !important;
        border-top: 2px solid #1e40af !important;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
        margin: 6px -12px -10px -12px !important;
        padding: 8px 12px !important;
        font-size: 1rem !important;
        font-weight: 700 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .status-badge {
        padding: 4px 10px !important;
        font-size: 0.75rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .status-pending { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important; color: #92400e !important; }
      .status-processing { background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%) !important; color: #1e40af !important; }
      .status-shipped { background: linear-gradient(135deg, #cffafe 0%, #67e8f9 100%) !important; color: #0e7490 !important; }
      .status-delivered { background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%) !important; color: #065f46 !important; }
      .status-cancelled { background: linear-gradient(135deg, #fecaca 0%, #f87171 100%) !important; color: #991b1b !important; }
      .status-refunded { background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%) !important; color: #374151 !important; }
      .payment-paid { background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%) !important; color: #065f46 !important; }
      .payment-pending { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important; color: #92400e !important; }
      .payment-failed { background: linear-gradient(135deg, #fecaca 0%, #f87171 100%) !important; color: #991b1b !important; }
      .payment-refunded { background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%) !important; color: #374151 !important; }
      .notes-section {
        margin-top: 8px !important;
        padding: 10px 12px !important;
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .notes-section h4 {
        color: #1e40af !important;
        font-size: 0.9rem !important;
        margin: 0 0 6px 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .notes-section p {
        color: #475569 !important;
        font-size: 0.8rem !important;
        margin: 0 !important;
        line-height: 1.4 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .footer {
        padding: 12px 20px !important;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        color: #475569 !important;
        font-size: 0.8rem !important;
        margin-top: 8px !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .logo-container {
        margin-bottom: 8px !important;
      }
      .logo {
        width: 45px !important;
        height: 45px !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
        border-radius: 50% !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        padding: 8px !important;
      }
      .logo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        object-position: center !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        image-rendering: auto !important;
        display: block !important;
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        -webkit-transform: translateZ(0) !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .company-name {
        font-size: 1.2rem !important;
        color: white !important;
        margin: 0 0 3px 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .company-tagline {
        color: white !important;
        font-size: 0.85rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-title {
        font-size: 1.5rem !important;
        color: white !important;
        margin: 0 0 6px 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-subtitle {
        color: white !important;
        font-size: 0.95rem !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      /* High-Quality Print Optimizations */
      .invoice-header,
      .info-section,
      .items-table,
      .total-section,
      .notes-section,
      .footer {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Ensure crisp text rendering */
      h1, h2, h3, h4, h5, h6,
      .company-name,
      .invoice-title,
      .info-label,
      .info-value,
      .total-row,
      .status-badge {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
        font-feature-settings: "kern" 1 !important;
        font-kerning: normal !important;
      }
      
      /* Prevent page breaks in critical sections */
      .invoice-header {
        page-break-after: avoid;
        break-after: avoid;
      }
      
      .total-section {
        page-break-before: avoid;
        break-before: avoid;
      }
      
      /* Optimize gradients for print */
      .invoice-header,
      .items-table th,
      .status-badge,
      .total-row.final {
        background-image: none !important;
        background-color: #1e3c72 !important;
      }
      
      .items-table th {
        background-color: #1e40af !important;
      }
      
      .status-pending { background-color: #fef3c7 !important; }
      .status-processing { background-color: #dbeafe !important; }
      .status-shipped { background-color: #cffafe !important; }
      .status-delivered { background-color: #d1fae5 !important; }
      .status-cancelled { background-color: #fecaca !important; }
      .status-refunded { background-color: #f3f4f6 !important; }
      .payment-paid { background-color: #d1fae5 !important; }
      .payment-pending { background-color: #fef3c7 !important; }
      .payment-failed { background-color: #fecaca !important; }
      .payment-refunded { background-color: #f3f4f6 !important; }
      
      /* Ensure high contrast for print */
      .info-section h3 {
        border-bottom: 2px solid #1e40af !important;
      }
      
      .total-row.final {
        border-top: 2px solid #1e40af !important;
        background-color: #eff6ff !important;
      }
    }
  `;
};

/**
 * Create the invoice header with logo and company info
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the header
 */
const createInvoiceHeader = (order) => {
  return `
    <div class="invoice-header">
      <div class="logo-container">
        <div class="logo">
          <img src="/logo.png" alt="Book with UVA Logo" width="100" height="100" object-fit: contain;" />
        </div>
        <div class="company-info">
          <div class="company-name">Book with UVA</div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Create the invoice information section
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the info section
 */
const createInvoiceInfo = (order) => {
  return `
    <div class="invoice-info">
      <div class="info-section">
        <h3>Invoice Details</h3>
        <div class="info-item">
          <span class="info-label">Invoice Number:</span>
          <span class="info-value">${order.orderNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Invoice Date:</span>
          <span class="info-value">${new Date(order.orderDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Order Status:</span>
          <span class="info-value">
            <span class="status-badge status-${order.status}">${order.status}</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Payment Status:</span>
          <span class="info-value">
            <span class="status-badge payment-${order.paymentStatus}">${order.paymentStatus}</span>
          </span>
        </div>
        ${order.expectedDeliveryDate ? `
        <div class="info-item">
          <span class="info-label">Expected Delivery:</span>
          <span class="info-value">${new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="info-section">
        <h3>Customer Information</h3>
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">${order.customer.name}</span>
        </div>
        ${order.customer.email ? `
        <div class="info-item">
          <span class="info-label">Email:</span>
          <span class="info-value">${order.customer.email}</span>
        </div>
        ` : ''}
        ${order.customer.phone ? `
        <div class="info-item">
          <span class="info-label">Phone:</span>
          <span class="info-value">${order.customer.phone}</span>
        </div>
        ` : ''}
        ${order.customer.address.street ? `
        <div class="info-item">
          <span class="info-label">Address:</span>
          <span class="info-value">${order.customer.address.street}</span>
        </div>
        ` : ''}
        ${order.customer.address.city || order.customer.address.state || order.customer.address.country || order.customer.address.pincode ? `
        <div class="info-item">
          <span class="info-label">City, State, Country, Pincode:</span>
          <span class="info-value">${[order.customer.address.city, order.customer.address.state, order.customer.address.pincode, order.customer.address.country].filter(Boolean).join(', ')}</span>
        </div>
        ` : ''}
        <div class="info-item">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${order.paymentMethod.toUpperCase()}</span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Create the items table
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the items table
 */
const createItemsTable = (order) => {
  return `
    <table class="items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>GST Rate</th>
          <th>GST Amount</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>₹${item.unitPrice.toFixed(2)}</td>
            <td>${item.gstRate}%</td>
            <td>₹${item.gstAmount.toFixed(2)}</td>
            <td>₹${item.finalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

/**
 * Create the total section
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the total section
 */
const createTotalSection = (order) => {
  return `
    <div class="total-section">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₹${order.subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>GST Total:</span>
        <span>₹${order.totalGst.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>Shipping Charges:</span>
        <span>₹${(order.shippingCharges || 0).toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>Discount:</span>
        <span>-₹${((order.subtotal + order.totalGst) * (order.discount || 0) / 100).toFixed(2)} (${order.discount || 0}%)</span>
      </div>
      <div class="total-row final">
        <span>Total Amount:</span>
        <span>₹${order.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  `;
};

/**
 * Create the notes section
 * @param {Object} order - The order object
 * @returns {string} - HTML string for the notes section
 */
const createNotesSection = (order) => {
  if (!order.notes) return '';
  
  return `
    <div class="notes-section">
      <h4>Notes:</h4>
      <p>${order.notes}</p>
    </div>
  `;
};

/**
 * Create the invoice footer
 * @returns {string} - HTML string for the footer
 */
const createInvoiceFooter = () => {
  return `
    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.7;">
        Book with UVA
      </p>
    </div>
  `;
};

/**
 * Generate invoice with success notification
 * @param {Object} order - The order object
 * @param {Function} toast - Toast notification function
 */
export const generateInvoiceWithNotification = (order, toast) => {
  try {
    generateInvoice(order);
    toast?.success('Invoice generated successfully!');
  } catch (error) {
    console.error('Error generating invoice:', error);
    toast?.error('Failed to generate invoice. Please try again.');
  }
};
