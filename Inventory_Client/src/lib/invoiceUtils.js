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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f8f9fa;
      color: #333;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    .logo {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .company-info {
      text-align: left;
    }
    .company-name {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0 0 5px 0;
    }
    .company-tagline {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
    }
    .invoice-title {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    .invoice-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }
    .invoice-content {
      padding: 30px;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      color: #667eea;
      margin: 0 0 15px 0;
      font-size: 1.2rem;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 8px;
    }
    .info-item {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .info-label {
      font-weight: 600;
      color: #6c757d;
    }
    .info-value {
      color: #333;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .items-table th {
      background: #667eea;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    .items-table td {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .items-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .total-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 5px 0;
    }
    .total-row.final {
      border-top: 2px solid #667eea;
      margin-top: 15px;
      padding-top: 15px;
      font-size: 1.2rem;
      font-weight: bold;
      color: #667eea;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped { background: #d1ecf1; color: #0c5460; }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-refunded { background: #e2e3e5; color: #383d41; }
    .payment-paid { background: #d4edda; color: #155724; }
    .payment-pending { background: #fff3cd; color: #856404; }
    .payment-failed { background: #f8d7da; color: #721c24; }
    .payment-refunded { background: #e2e3e5; color: #383d41; }
    .footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      color: #6c757d;
      font-size: 0.9rem;
    }
    .notes-section {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .notes-section h4 {
      margin: 0 0 10px 0;
      color: #667eea;
    }
    .notes-section p {
      margin: 0;
      color: #6c757d;
    }
    @media print {
      body { background: white; }
      .invoice-container { box-shadow: none; }
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
          <img src="/logo.png" alt="Book with UVA Logo" width="100" height="100" style="border-radius: 50%; object-fit: cover;" />
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
        ${order.customer.address.city || order.customer.address.state || order.customer.address.pincode ? `
        <div class="info-item">
          <span class="info-label">City, State, Pincode:</span>
          <span class="info-value">${[order.customer.address.city, order.customer.address.state, order.customer.address.pincode].filter(Boolean).join(', ')}</span>
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
      <p>Thank you for your business!</p>
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
