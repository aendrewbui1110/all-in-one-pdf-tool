import './address-autocomplete.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const API_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;
const MAX_RESULTS = 5;
const PROXIMITY = '115.8605,-31.9505'; // Perth, WA

/**
 * Attach address autocomplete to an input element.
 * Gracefully degrades to a normal input if VITE_MAPBOX_TOKEN is not set.
 *
 * @param {HTMLInputElement} inputElement
 * @param {Object} [options]
 * @param {(address: string) => void} [options.onSelect] — callback when an address is selected
 * @returns {() => void} cleanup function
 */
export function attachAddressAutocomplete(inputElement, options = {}) {
  if (!MAPBOX_TOKEN || !inputElement) {
    return () => {};
  }

  let debounceTimer = null;
  let dropdown = null;
  let activeIndex = -1;
  let results = [];
  let wrapper = null;

  // Wrap the input in a relative container for absolute positioning
  wrapper = document.createElement('div');
  wrapper.className = 'address-ac-wrapper';
  inputElement.parentNode.insertBefore(wrapper, inputElement);
  wrapper.appendChild(inputElement);

  // ── API ──

  async function fetchSuggestions(query) {
    const params = new URLSearchParams({
      q: query,
      country: 'AU',
      proximity: PROXIMITY,
      language: 'en',
      limit: String(MAX_RESULTS),
      access_token: MAPBOX_TOKEN,
    });

    try {
      const res = await fetch(`${API_URL}?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.features) return [];

      return data.features.map(f => {
        const props = f.properties || {};
        return props.full_address || props.name_preferred || props.name || '';
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  // ── Dropdown ──

  function createDropdown() {
    removeDropdown();
    dropdown = document.createElement('div');
    dropdown.className = 'address-ac-dropdown';
    dropdown.setAttribute('role', 'listbox');
    wrapper.appendChild(dropdown);
  }

  function removeDropdown() {
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
    }
    activeIndex = -1;
    results = [];
  }

  function renderResults(suggestions, query) {
    results = suggestions;
    activeIndex = -1;

    if (!suggestions.length) {
      createDropdown();
      dropdown.innerHTML = '<div class="address-ac-empty">No addresses found</div>';
      return;
    }

    createDropdown();
    const queryLower = query.toLowerCase();

    suggestions.forEach((address, i) => {
      const item = document.createElement('div');
      item.className = 'address-ac-item';
      item.setAttribute('role', 'option');
      item.dataset.index = i;
      item.innerHTML = highlightMatch(address, queryLower);

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur before selection
        selectAddress(address);
      });

      item.addEventListener('mouseenter', () => {
        setActive(i);
      });

      dropdown.appendChild(item);
    });
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);

    const lower = text.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx === -1) return escapeHtml(text);

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return escapeHtml(before) + '<mark>' + escapeHtml(match) + '</mark>' + escapeHtml(after);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setActive(index) {
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.address-ac-item');
    items.forEach(item => item.classList.remove('active'));
    activeIndex = index;
    if (index >= 0 && index < items.length) {
      items[index].classList.add('active');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectAddress(address) {
    inputElement.value = address;

    // Fire input event so data-bind picks up the change
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

    removeDropdown();

    if (typeof options.onSelect === 'function') {
      options.onSelect(address);
    }
  }

  // ── Event Handlers ──

  function onInput() {
    clearTimeout(debounceTimer);
    const query = inputElement.value.trim();

    if (query.length < MIN_CHARS) {
      removeDropdown();
      return;
    }

    debounceTimer = setTimeout(async () => {
      const suggestions = await fetchSuggestions(query);
      // Only render if input still has focus and value hasn't changed
      if (document.activeElement === inputElement && inputElement.value.trim() === query) {
        renderResults(suggestions, query);
      }
    }, DEBOUNCE_MS);
  }

  function onKeydown(e) {
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.address-ac-item');
    const count = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex < count - 1 ? activeIndex + 1 : 0);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex > 0 ? activeIndex - 1 : count - 1);
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          selectAddress(results[activeIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        removeDropdown();
        break;

      case 'Tab':
        removeDropdown();
        break;
    }
  }

  function onBlur() {
    // Delay removal so mousedown on item fires first
    setTimeout(() => removeDropdown(), 120);
  }

  function onOutsideClick(e) {
    if (wrapper && !wrapper.contains(e.target)) {
      removeDropdown();
    }
  }

  // ── Bind ──

  inputElement.addEventListener('input', onInput);
  inputElement.addEventListener('keydown', onKeydown);
  inputElement.addEventListener('blur', onBlur);
  document.addEventListener('click', onOutsideClick, true);

  // ── Cleanup ──

  return function cleanup() {
    clearTimeout(debounceTimer);
    inputElement.removeEventListener('input', onInput);
    inputElement.removeEventListener('keydown', onKeydown);
    inputElement.removeEventListener('blur', onBlur);
    document.removeEventListener('click', onOutsideClick, true);
    removeDropdown();

    // Unwrap the input — move it back to its original position
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(inputElement, wrapper);
      wrapper.remove();
    }
  };
}
