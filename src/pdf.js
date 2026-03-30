/* ═══════════════════════════════════════════════════════════════
   Perth Steel Patios — PDF Generation & Validation
   ═══════════════════════════════════════════════════════════════ */

import { getDocType, getLineItems, getFormValues } from './state.js';
import { calculateTotals, calculateDepositAmount } from './calculations.js';
import { updatePreview } from './preview.js';
import { showToast } from './ui.js';
import { claimNextDocNumber, saveDocumentToSupabase } from './supabase-ops.js';

export function validateForm() {
  const docType = getDocType();
  const lineItems = getLineItems();
  const errors = [];

  // Client name (required for all types)
  const nameGroup = document.getElementById('client-name').closest('.form-group');
  const nameMsg = document.getElementById('val-client-name');
  if (!document.getElementById('client-name').value.trim()) {
    nameGroup.classList.add('has-error');
    nameMsg.style.display = 'block';
    errors.push('Client name is required');
  } else {
    nameGroup.classList.remove('has-error');
    nameMsg.style.display = 'none';
  }

  // Line items (skip for contracts — they use direct pricing)
  const hasValidLine = lineItems.some(item => item.description.trim() && item.price > 0);
  const lineMsg = document.getElementById('val-line-items');
  if (docType !== 'contract' && !hasValidLine) {
    lineMsg.style.display = 'block';
    errors.push('At least one line item required');
  } else {
    lineMsg.style.display = 'none';
  }

  // Numeric sanity checks
  if (docType !== 'contract') {
    const includeGst = document.getElementById('include-gst').checked;
    const { total } = calculateTotals(lineItems, includeGst);
    const depositOverride = parseFloat(document.getElementById('quote-deposit-override')?.value) || 0;

    if (depositOverride > 0 && depositOverride > total && total > 0) {
      errors.push('Fixed deposit amount exceeds total');
    }

    if (docType === 'final') {
      const depositPaid = parseFloat(document.getElementById('deposit-paid').value) || 0;
      if (depositPaid > total && total > 0) {
        errors.push('Deposit paid exceeds total amount');
      }
    }

    if (lineItems.some(item => item.price < 0)) {
      errors.push('Line item prices cannot be negative');
    }
  }

  // Contract validation
  if (docType === 'contract') {
    const totalPrice = parseFloat(document.getElementById('contract-total-price').value) || 0;
    const contractDeposit = parseFloat(document.getElementById('contract-deposit-amount').value) || 0;
    if (totalPrice <= 0) errors.push('Contract requires a total price');
    if (contractDeposit <= 0) errors.push('Contract requires a deposit amount');
    if (contractDeposit > totalPrice && totalPrice > 0) errors.push('Contract deposit exceeds total price');
    if (!document.getElementById('job-site').value.trim()) errors.push('Contract requires a site address');
  }

  // FIX: Show ALL validation errors, not just the first one
  if (errors.length > 0) {
    showToast(errors.join('\n'), 'error');
    return false;
  }
  return true;
}

export async function downloadPDF() {
  if (!validateForm()) {
    return;
  }

  // FIX: Check that html2pdf is loaded before attempting to use it
  if (typeof html2pdf === 'undefined') {
    showToast('PDF library not loaded. Check your internet connection and refresh the page.', 'error');
    return;
  }

  const docType = getDocType();
  const lineItems = getLineItems();

  const btn = document.getElementById('btn-download-pdf');
  const originalText = btn.innerHTML;

  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Generating...
  `;
  btn.disabled = true;

  try {
    const element = document.getElementById('preview-document');

    const origBoxShadow = element.style.boxShadow;
    const origBorderRadius = element.style.borderRadius;
    element.style.boxShadow = 'none';
    element.style.borderRadius = '0';

    // Convert SVG logo to base64 PNG so html2canvas can render it
    const logoImg = element.querySelector('.doc-company-logo');
    let origLogoSrc = null;
    if (logoImg) {
      origLogoSrc = logoImg.src;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = origLogoSrc;
        });
        ctx.drawImage(img, 0, 0, 400, 400);
        logoImg.src = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Logo conversion failed, PDF may be missing logo:', e);
      }
    }

    const opt = {
      margin: [10, 0, 12, 0],
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.doc-totals', '.doc-footer', '.doc-thankyou', '.doc-terms', '.doc-acceptance', '.doc-payment', '.contract-section', '.contract-signatures', '.contract-sig-block'] }
    };

    // Only claim a new doc number if one hasn't been assigned yet
    const v = getFormValues();
    const existingDocNumber = v.docNumber?.trim();
    const officialDocNumber = existingDocNumber || await claimNextDocNumber(docType);

    if (!existingDocNumber) {
      document.getElementById('doc-number').value = officialDocNumber;
      updatePreview();
    }

    const pdfDoc = await html2pdf().set(opt).from(element).toPdf().get('pdf');
    const totalPages = pdfDoc.internal.getNumberOfPages();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();

    for (let i = 1; i <= totalPages; i++) {
      pdfDoc.setPage(i);

      // Branded header on continuation pages
      if (i > 1) {
        pdfDoc.setDrawColor(247, 148, 29);
        pdfDoc.setLineWidth(0.5);
        pdfDoc.line(10, 5, pageWidth - 10, 5);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.setFontSize(7);
        pdfDoc.setTextColor(153, 153, 153);
        pdfDoc.text('Perth Steel Patios', 10, 9);
        pdfDoc.text(officialDocNumber || '', pageWidth - 10, 9, { align: 'right' });
      }

      // Footer
      pdfDoc.setDrawColor(247, 148, 29);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(10, pageHeight - 10, pageWidth - 10, pageHeight - 10);

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(6.5);
      pdfDoc.setTextColor(180, 180, 180);
      pdfDoc.text('This document is confidential and intended solely for the named recipient.', pageWidth / 2, pageHeight - 6, { align: 'center' });

      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(153, 153, 153);
      pdfDoc.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 3, { align: 'right' });
    }

    const officialFilename = `${officialDocNumber}_${v.clientName || 'Client'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Get PDF as blob for Supabase upload before saving locally
    const pdfBlob = pdfDoc.output('blob');
    pdfDoc.save(officialFilename);

    element.style.boxShadow = origBoxShadow;
    element.style.borderRadius = origBorderRadius;
    if (logoImg && origLogoSrc) logoImg.src = origLogoSrc;

    // Save document record and upload PDF to Supabase (blocking with error feedback)
    try {
      await saveDocumentToSupabase(officialDocNumber, v, docType, pdfBlob);
      showToast(`PDF saved: ${officialFilename}`);
    } catch (err) {
      console.error('Failed to save to Supabase:', err);
      showToast(`PDF saved locally but failed to sync to database`, 'error');
    }

  } catch (error) {
    console.error('PDF generation failed:', error);
    showToast('Failed to generate PDF. Please try again.', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
