export function escapeHtml(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  if (!isFinite(num)) return '$0.00';
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Convert SVG to base64 PNG for PDF embedding
let cachedLogo = null;
export async function getLogoBase64() {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch('/logo.svg');
    const svgText = await res.text();
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const dataUrl = await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 200, 200);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
    });
    cachedLogo = dataUrl;
    return dataUrl;
  } catch (e) {
    console.warn('Logo conversion failed:', e);
    return null;
  }
}
