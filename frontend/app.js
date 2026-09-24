// ─── State ─────────────────────────────────────────────────────
const state = {
  services: [],
  addOns: [],
  bookedDates: [],
  selectedService: 0,
  sortOrder: 'default',
  currentDate: new Date(),
  selectedBookingDate: '',
  monthCursor: new Date().getMonth(),
  yearCursor: new Date().getFullYear(),
};

// ─── Static brand & category metadata ─────────────────────────
const BRAND = {
  name: 'BookMyDecor',
  tagline: 'Decorations for every celebration',
  hours: '6 AM–10 PM daily',
  location: 'Amalapuram',
  phones: ['9848593882', '9492909727'],
};

const CATEGORIES_META = [
  { name: 'Marriage Decoration', emoji: '💐' },
  { name: 'Birthday Decoration', emoji: '🎈' },
  { name: 'Home Decoration', emoji: '🏠' },
  { name: 'Naming Ceremony', emoji: '👶' },
  { name: 'Sreemantham Ceremony', emoji: '🙏' },
  { name: 'Engagement Decoration', emoji: '💍' },
  { name: 'Car Decoration', emoji: '🚗' },
  { name: 'Temple Decoration', emoji: '🛕' },
  { name: 'New Year Decoration', emoji: '🎉' },
  { name: 'Festival Decoration', emoji: '🎊' },
];

const GALLERY_FOLDERS = [
  { name: 'Marriage Decoration', folder: 'marriage', desc: 'Mandap, Haldi, Sangeet & Stage styling' },
  { name: 'Birthday Decoration', folder: 'birthday', desc: 'Theme balloon arches, entry setup & backdrops' },
  { name: 'Home Decoration', folder: 'home_decoration', desc: 'Floral entrance, house warming & traditional setups' },
  { name: 'Naming Ceremony', folder: 'naming_ceremony', desc: 'Cradle decoration, floral arches & boy/girl themes' },
  { name: 'Sreemantham Ceremony', folder: 'sreemantham_ceremony', desc: 'Traditional flower setup & seated stage décor' },
  { name: 'Engagement Decoration', folder: 'engagement', desc: 'Ring exchange stage, backdrop & lighting' },
  { name: 'Car Decoration', folder: 'car_decoration', desc: 'Bridal car flower arrangement & satin ribbon styling' },
  { name: 'Temple Decoration', folder: 'temple_decoration', desc: 'Pooja mandap floral garlands & traditional entry' },
  { name: 'New Year Decoration', folder: 'new_year_decoration', desc: 'Party balloon drops, lightings & entrance gate' },
  { name: 'Festival Decoration', folder: 'festival_decoration', desc: 'Sankranti, Vinayaka Chavithi & festive theme setups' },
];

// ─── DOM Elements ──────────────────────────────────────────────
const elements = {
  categoryGrid: document.getElementById('category-grid'),
  serviceTabs: document.getElementById('service-tabs'),
  servicePanels: document.getElementById('service-panels'),
  addOnsGrid: document.getElementById('add-ons-grid'),
  galleryGrid: document.getElementById('gallery-grid'),
  eventTypeSelect: document.getElementById('event-type-select'),
  packageOptions: document.getElementById('package-options'),
  bookingDate: document.getElementById('booking-date'),
  bookingForm: document.getElementById('booking-form'),
  bookingSuccess: document.getElementById('booking-success'),
  bookingAdvanceText: document.getElementById('booking-advance-text'),
  bookingIdText: document.getElementById('booking-id-text'),
  submitButton: document.getElementById('submit-button'),
  calendarGrid: document.getElementById('calendar-grid'),
  calendarMonthLabel: document.getElementById('calendar-month-label'),
  lookupForm: document.getElementById('lookup-form'),
  lookupIdInput: document.getElementById('lookup-id-input'),
  lookupButton: document.getElementById('lookup-button'),
  lookupResult: document.getElementById('lookup-result'),
  chatWidget: document.querySelector('[data-chat-widget]'),
  chatBody: document.getElementById('chat-body'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  serviceSortSelect: document.getElementById('service-sort-select'),
  faqContainer: document.getElementById('faq-container'),
  liveQuoteBox: document.getElementById('live-quote-box'),
  quotePackageName: document.getElementById('quote-package-name'),
  quoteTotalPrice: document.getElementById('quote-total-price'),
  quoteCustomNote: document.getElementById('quote-custom-note'),
  whatsappFloatBtn: document.getElementById('whatsapp-float-btn'),
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Data shape mapping (backend → frontend) ──────────────────

function mapService(backendService) {
  return {
    id: backendService.id,
    name: backendService.name,
    badge: 'Package',
    priceLabel: backendService.price_range,
    summary: `Starting from ₹${backendService.starting_price.toLocaleString('en-IN')}. Fully customizable with add-ons.`,
    items: backendService.included,
    includeList: backendService.included,
    description: `Complete ${backendService.name.toLowerCase()} setup with professional styling, themed décor, and premium materials.`,
    startingPrice: backendService.starting_price,
  };
}

function mapAddon(backendAddon) {
  return {
    id: backendAddon.id,
    name: backendAddon.name,
    price: backendAddon.price,
    note: backendAddon.notes || '',
  };
}

// ─── API Fetch Helpers ─────────────────────────────────────────

async function fetchServices() {
  const response = await fetch(`${API_BASE}/services`);
  if (!response.ok) throw new Error(`Services API returned ${response.status}`);
  const data = await response.json();
  return data.map(mapService);
}

async function fetchAddons() {
  const response = await fetch(`${API_BASE}/addons`);
  if (!response.ok) throw new Error(`Addons API returned ${response.status}`);
  const data = await response.json();
  return data.map(mapAddon);
}

async function fetchFaqs() {
  try {
    const response = await fetch('faqs.json');
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.warn('Could not load faqs.json:', err);
    return [];
  }
}

async function fetchAvailability(month, year) {
  const response = await fetch(`${API_BASE}/availability?month=${month}&year=${year}`);
  if (!response.ok) throw new Error(`Availability API returned ${response.status}`);
  const data = await response.json();
  return data.dates
    .filter((d) => d.status === 'booked')
    .map((d) => d.date);
}

async function fetchBookingStatus(id) {
  const response = await fetch(`${API_BASE}/booking/${id}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Booking Lookup API returned ${response.status}`);
  return data;
}

async function submitBooking(payload) {
  const response = await fetch(`${API_BASE}/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Booking API returned ${response.status}`);
  return data;
}

// ─── Skeleton Loaders ──────────────────────────────────────────

function renderSkeletons() {
  if (elements.categoryGrid) {
    elements.categoryGrid.innerHTML = Array(6)
      .fill('<div class="skeleton-card"></div>')
      .join('');
  }
  if (elements.serviceTabs) {
    elements.serviceTabs.innerHTML = Array(4)
      .fill('<div class="skeleton-tab"></div>')
      .join('');
  }
  if (elements.servicePanels) {
    elements.servicePanels.innerHTML = '<div class="skeleton-card" style="min-height:260px;"></div>';
  }
  if (elements.addOnsGrid) {
    elements.addOnsGrid.innerHTML = Array(4)
      .fill('<div class="skeleton-card"></div>')
      .join('');
  }
}

// ─── Initialize App ────────────────────────────────────────────

async function loadData() {
  renderSkeletons();
  
  // Bind standalone interactive elements regardless of data fetch success
  bindChat();
  bindChatOpenButtons();
  bindLookupActions();

  try {
    const [services, addOns, faqs] = await Promise.all([
      fetchServices(),
      fetchAddons(),
      fetchFaqs(),
    ]);

    state.services = services;
    state.addOns = addOns;

    renderBrandMeta();
    renderCategories();
    renderServices();
    renderAddOns();
    renderGallery();
    renderFormOptions();
    renderFaqs(faqs);
    await loadAndRenderCalendar();
    bindCalendarNavigation();
    bindBookingActions();
    bindSortActions();
    bindLiveQuoteActions();
  } catch (error) {
    console.error('Failed to load data from backend:', error);
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div style="padding:1.5rem;text-align:center;color:#5c1723;background:rgba(189,59,59,0.08);border-radius:14px;margin:1rem;">
        <strong>⚠ Unable to connect to the server</strong><br>
        <span style="font-size:0.9rem;color:#665d5b;">Make sure the backend is running at <code>${API_BASE}</code><br>
        Run: <code>cd backend && npm start</code></span>
      </div>`
    );
  }
}

// ─── Renderers ─────────────────────────────────────────────────

function renderBrandMeta() {
  document.title = `${BRAND.name} | ${BRAND.tagline}`;
  document.getElementById('hours-text').textContent = BRAND.hours;
  document.getElementById('location-text').textContent = BRAND.location;
  document.getElementById('phone-link-1').textContent = BRAND.phones[0];
  document.getElementById('phone-link-1').href = `tel:${BRAND.phones[0].replace(/\s+/g, '')}`;
}

function renderCategories() {
  if (!elements.categoryGrid) return;

  elements.categoryGrid.innerHTML = CATEGORIES_META
    .map((cat) => {
      const catKey = cat.name.toLowerCase().replace(' decoration', '').replace(' ceremony', '').trim();
      const match = state.services.find((s) => {
        const sName = s.name.toLowerCase();
        return sName.includes(catKey) || catKey.includes(sName);
      });

      const priceText = match && match.startingPrice
        ? `Starting from ₹${match.startingPrice.toLocaleString('en-IN')}`
        : 'Custom Styling';

      return `
        <a class="category-card" href="#services" data-category-name="${cat.name}">
          <div class="cat-icon-wrap">${cat.emoji}</div>
          <h3 class="cat-title">${cat.name}</h3>
          <span class="cat-price-badge">${priceText}</span>
        </a>
      `;
    })
    .join('');

  // Click behavior fix: click category card -> select matching service tab & smooth scroll
  elements.categoryGrid.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const categoryName = card.dataset.categoryName;
      if (categoryName && state.services.length) {
        const catKey = categoryName.toLowerCase().replace(' decoration', '').replace(' ceremony', '').trim();
        const sortedServices = getSortedServices();
        let targetIndex = sortedServices.findIndex((s) => {
          const sName = s.name.toLowerCase();
          return sName.includes(catKey) || catKey.includes(sName);
        });

        if (targetIndex !== -1) {
          state.selectedService = targetIndex;
          renderServices();
        }
      }
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function getSortedServices() {
  const services = [...state.services];
  if (state.sortOrder === 'low-high') {
    return services.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
  }
  if (state.sortOrder === 'high-low') {
    return services.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
  }
  return services;
}

function renderServices() {
  const sortedServices = getSortedServices();
  if (!sortedServices.length) return;

  if (state.selectedService >= sortedServices.length) {
    state.selectedService = 0;
  }

  const activeService = sortedServices[state.selectedService];

  elements.serviceTabs.innerHTML = sortedServices
    .map(
      (service, index) => `
        <button
          class="service-tab ${index === state.selectedService ? 'active' : ''}"
          type="button"
          data-service-tab="${index}"
          aria-selected="${index === state.selectedService}"
        >
          ${service.name}
        </button>
      `
    )
    .join('');

  elements.servicePanels.innerHTML = sortedServices
    .map(
      (service, index) => `
        <article class="panel-card ${index === state.selectedService ? 'active' : ''}" data-panel="${index}">
          <div class="service-card">
            <div class="service-header">
              <div>
                <p class="eyebrow">${service.badge || 'Package'}</p>
                <h3>${service.name}</h3>
              </div>
              <span class="price-tag">${service.priceLabel}</span>
            </div>
            <p>${service.summary}</p>
            <ul>
              ${service.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
            <button class="button button-primary request-button" type="button" data-request-package="${service.name}">Request this package</button>
          </div>
          <div class="service-card">
            <p class="eyebrow">What's included</p>
            <p>${service.description}</p>
            <ul>
              ${service.includeList.map((item) => `<li>${item}</li>`).join('')}
            </ul>
            <p><strong>Customizable with add-ons</strong></p>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('[data-service-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedService = Number(button.dataset.serviceTab);
      renderServices();
    });
  });

  document.querySelectorAll('[data-request-package]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.requestPackage;
      const eventTypeSelect = elements.eventTypeSelect;
      if (value && eventTypeSelect) {
        const matchingService = state.services.find((s) => s.name === value);
        if (matchingService) {
          eventTypeSelect.value = matchingService.id;
          updateLiveQuote();
        }
      }
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });
  });

  updateWhatsAppButton(activeService);
}

function updateWhatsAppButton(activeService) {
  const btn = document.getElementById('whatsapp-float-btn');
  if (!btn) return;
  const serviceName = activeService ? activeService.name : '';
  const message = serviceName
    ? `Hi, I'm interested in ${serviceName} from PR Decorations.`
    : `Hi, I'm interested in booking decoration services with PR Decorations.`;
  btn.href = `https://wa.me/919848593882?text=${encodeURIComponent(message)}`;
}

function renderAddOns() {
  const addOns = state.addOns;
  if (!addOns.length) return;

  elements.addOnsGrid.innerHTML = addOns
    .map(
      (addon) => `
        <article class="addon-card">
          <h3>${addon.name}</h3>
          <span class="price">${addon.price}</span>
          <p>${addon.note}</p>
        </article>
      `
    )
    .join('');
}

async function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const emptyState = document.getElementById('gallery-empty');
  const tabsContainer = document.getElementById('gallery-tabs');
  if (!grid || !tabsContainer) return;

  try {
    const res = await fetch(`${API_BASE}/gallery`);
    const data = await res.json();
    
    const categories = ["All", ...CATEGORIES_META.map(c => c.name)];
    tabsContainer.innerHTML = categories.map(cat => 
      `<button class="service-tab ${cat === 'All' ? 'active' : ''}" data-gallery-tab="${cat}">${cat}</button>`
    ).join('');

    function drawImages(filterCat) {
      const items = filterCat === 'All' ? data : data.filter(d => d.category === filterCat);
      
      if (items.length === 0) {
        grid.style.display = 'none';
        emptyState.classList.remove('hidden');
      } else {
        grid.style.display = 'grid';
        emptyState.classList.add('hidden');
        grid.innerHTML = items.map((item, index) => `
          <div class="gallery-item" style="cursor: pointer; overflow: hidden; border-radius: var(--radius-md); box-shadow: var(--shadow); display: flex; flex-direction: column;" onclick="openLightbox(${index}, '${filterCat}')">
            <div style="flex: 1; overflow: hidden;">
              <img src="${API_BASE}${item.path}" alt="${item.category}" style="width: 100%; height: 260px; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            </div>
            <div style="padding: 0.8rem 1.2rem; background: rgba(255, 255, 255, 0.7); border-top: 1px solid var(--line); font-size: 0.85rem; font-weight: 600; color: var(--primary-dark); display: flex; justify-content: space-between; align-items: center;">
              <span>${item.category}</span>
              ${item.confirmed ? '<span title="AI classification confirmed" style="color: var(--success); font-size: 1.1rem;">✓</span>' : '<span title="AI classified" style="font-size: 1.1rem;">🤖</span>'}
            </div>
          </div>
        `).join('');
      }
    }
    
    drawImages('All');

    tabsContainer.addEventListener('click', (e) => {
      if(e.target.tagName === 'BUTTON') {
        tabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        drawImages(e.target.dataset.galleryTab);
      }
    });

    window.galleryCurrentItems = data;
    window.galleryCurrentIndex = 0;

    window.openLightbox = (index, filterCat) => {
      window.galleryCurrentItems = filterCat === 'All' ? data : data.filter(d => d.category === filterCat);
      window.galleryCurrentIndex = index;
      updateLightboxImage();
      document.getElementById('lightbox').classList.remove('hidden');
    };

    window.closeLightbox = () => {
      document.getElementById('lightbox').classList.add('hidden');
    };

    window.lightboxNext = () => {
      window.galleryCurrentIndex = (window.galleryCurrentIndex + 1) % window.galleryCurrentItems.length;
      updateLightboxImage();
    };

    window.lightboxPrev = () => {
      window.galleryCurrentIndex = (window.galleryCurrentIndex - 1 + window.galleryCurrentItems.length) % window.galleryCurrentItems.length;
      updateLightboxImage();
    };

    function updateLightboxImage() {
      const item = window.galleryCurrentItems[window.galleryCurrentIndex];
      if (item) {
        document.getElementById('lightbox-img').src = `${API_BASE}${item.path}`;
      }
    }

    document.getElementById('lightbox-close')?.addEventListener('click', window.closeLightbox);
    document.getElementById('lightbox-next')?.addEventListener('click', window.lightboxNext);
    document.getElementById('lightbox-prev')?.addEventListener('click', window.lightboxPrev);

  } catch (err) {
    console.error('Failed to load gallery', err);
  }
}

function renderFormOptions() {
  const services = state.services;
  const addons = state.addOns;
  if (!services.length) return;

  elements.eventTypeSelect.innerHTML = services
    .map((service) => `<option value="${service.id}">${service.name}</option>`)
    .join('');

  elements.packageOptions.innerHTML = addons
    .map((addon) => {
      return `
        <label class="checkbox-option">
          <input type="checkbox" name="addOns" value="${addon.name}" />
          <span>${addon.name} (${addon.price})</span>
        </label>
      `;
    })
    .join('');

  updateLiveQuote();
}

function renderFaqs(faqs) {
  const container = document.getElementById('faq-container');
  if (!container || !faqs.length) return;

  container.innerHTML = faqs
    .map(
      (faq, index) => `
        <article class="faq-card" data-faq-card="${index}">
          <button class="faq-question" type="button" aria-expanded="false">
            <span>${faq.question}</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>${faq.answer}</p>
          </div>
        </article>
      `
    )
    .join('');

  container.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.faq-card');
      const isOpen = card.classList.contains('open');
      container.querySelectorAll('.faq-card').forEach((c) => c.classList.remove('open'));
      if (!isOpen) {
        card.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      } else {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// ─── Live Quote Calculator ─────────────────────────────────────

function parseAddonPrice(priceStr) {
  if (!priceStr) return { amount: 0, isCustom: true };
  const p = priceStr.toLowerCase().trim();

  // Check for any range indicators (ASCII dash, en-dash, em-dash, "to") or non-flat text
  const isRange = /[-–—]|to\b|requirement|depend|n\/a|custom/.test(p);
  if (isRange) {
    return { amount: 0, isCustom: true };
  }

  const digitsOnly = p.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return { amount: 0, isCustom: true };
  }

  const amount = parseInt(digitsOnly, 10);
  return { amount, isCustom: false };
}

function updateLiveQuote() {
  const eventTypeSelect = elements.eventTypeSelect;
  const liveQuoteBox = document.getElementById('live-quote-box');
  if (!eventTypeSelect || !liveQuoteBox) return;

  const selectedServiceId = eventTypeSelect.value;
  const service = state.services.find((s) => String(s.id) === String(selectedServiceId)) || state.services[0];

  const basePrice = service ? (service.startingPrice || 0) : 0;
  const packageNameElem = document.getElementById('quote-package-name');
  if (packageNameElem) {
    packageNameElem.textContent = service ? `Selected Package: ${service.name}` : 'Selected Package: —';
  }

  const selectedAddonInputs = elements.packageOptions
    ? elements.packageOptions.querySelectorAll('input[type="checkbox"]:checked')
    : [];

  let addonsTotal = 0;
  let hasCustomQuote = false;

  selectedAddonInputs.forEach((input) => {
    const addonName = input.value;
    const addonObj = state.addOns.find((a) => a.name === addonName);
    if (addonObj) {
      const parsed = parseAddonPrice(addonObj.price);
      if (parsed.isCustom) {
        hasCustomQuote = true;
      } else {
        addonsTotal += parsed.amount;
      }
    }
  });

  const grandTotal = basePrice + addonsTotal;
  const totalPriceElem = document.getElementById('quote-total-price');
  if (totalPriceElem) {
    totalPriceElem.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
  }

  const customNoteElem = document.getElementById('quote-custom-note');
  if (customNoteElem) {
    if (hasCustomQuote) {
      customNoteElem.classList.remove('hidden');
    } else {
      customNoteElem.classList.add('hidden');
    }
  }
}

function bindSortActions() {
  const select = document.getElementById('service-sort-select');
  if (select) {
    select.addEventListener('change', () => {
      state.sortOrder = select.value;
      renderServices();
    });
  }
}

function bindLiveQuoteActions() {
  if (elements.eventTypeSelect) {
    elements.eventTypeSelect.addEventListener('change', updateLiveQuote);
  }
  if (elements.packageOptions) {
    elements.packageOptions.addEventListener('change', updateLiveQuote);
  }
}

// ─── Calendar (fetches from /availability API) ─────────────────

async function loadAndRenderCalendar() {
  try {
    const apiMonth = state.monthCursor + 1;
    const bookedDates = await fetchAvailability(apiMonth, state.yearCursor);
    state.bookedDates = bookedDates;
  } catch (err) {
    console.warn('Could not fetch availability:', err.message);
    state.bookedDates = [];
  }
  renderCalendar();
}

function renderCalendar() {
  const bookedDates = state.bookedDates || [];
  const monthStart = new Date(state.yearCursor, state.monthCursor, 1);
  const monthLabel = `${monthNames[state.monthCursor]} ${state.yearCursor}`;
  elements.calendarMonthLabel.textContent = monthLabel;

  const calendarRows = [];
  weekDays.forEach((day) => {
    calendarRows.push(`<div class="day-name">${day}</div>`);
  });

  const firstDayIndex = monthStart.getDay();
  for (let i = 0; i < firstDayIndex; i += 1) {
    calendarRows.push('<div class="calendar-day empty" aria-hidden="true"></div>');
  }

  const daysInMonth = new Date(state.yearCursor, state.monthCursor + 1, 0).getDate();
  const today = new Date();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const fullDate = new Date(state.yearCursor, state.monthCursor, day);
    const dateKey = formatDateKey(fullDate);
    const isBooked = bookedDates.includes(dateKey);
    const isPast = fullDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selected = dateKey === state.selectedBookingDate;

    let classes = 'calendar-day';
    if (isBooked) classes += ' booked';
    if (selected) classes += ' selected';
    if (isPast && !isBooked) classes += ' empty';

    const clickHandler = !isBooked && !isPast
      ? `data-date="${dateKey}"`
      : '';

    calendarRows.push(`
      <button
        type="button"
        class="${classes}"
        ${clickHandler}
        ${!isBooked && !isPast ? '' : 'disabled'}
        aria-label="${dateKey}"
      >
        ${day}
      </button>
    `);
  }

  elements.calendarGrid.innerHTML = calendarRows.join('');

  elements.calendarGrid.querySelectorAll('[data-date]').forEach((cell) => {
    cell.addEventListener('click', () => {
      const clicked = cell.dataset.date;
      state.selectedBookingDate = clicked;
      elements.bookingDate.value = clicked;
      renderCalendar();
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function bindCalendarNavigation() {
  document.querySelectorAll('[data-month-nav]').forEach((button) => {
    button.addEventListener('click', async () => {
      const direction = button.dataset.monthNav === 'next' ? 1 : -1;
      const next = new Date(state.yearCursor, state.monthCursor + direction, 1);
      state.monthCursor = next.getMonth();
      state.yearCursor = next.getFullYear();
      await loadAndRenderCalendar();
    });
  });
}

// ─── Booking Actions ───────────────────────────────────────────

function bindBookingActions() {
  elements.bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.bookingForm);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const serviceId = formData.get('eventType');
    const date = formData.get('date');

    if (!name || !phone || !serviceId || !date) {
      window.alert('Please complete all required booking fields before submitting.');
      return;
    }

    const selectedAddons = formData.getAll('addOns');

    elements.submitButton.disabled = true;
    elements.submitButton.textContent = 'Submitting...';

    try {
      const result = await submitBooking({
        customer_name: name,
        phone: phone,
        service_id: serviceId,
        selected_addons: selectedAddons,
        date: date,
      });

      const bookingId = result.booking.id;
      sessionStorage.setItem('last_booking_id', bookingId);

      // Redirect user to dummy payment page with booking_id parameter
      window.location.href = `payment.html?booking_id=${bookingId}`;
    } catch (err) {
      console.error('Booking failed:', err);
      window.alert(`Booking failed: ${err.message}`);
    } finally {
      elements.submitButton.disabled = false;
      elements.submitButton.textContent = 'Submit booking request';
    }
  });

  if (document.querySelector('[data-reset-form]')) {
    document.querySelector('[data-reset-form]').addEventListener('click', () => {
      elements.bookingForm.reset();
      elements.bookingForm.classList.remove('hidden');
      elements.bookingSuccess.classList.add('hidden');
      state.selectedBookingDate = '';
      elements.bookingDate.value = '';
      renderCalendar();
      updateLiveQuote();
    });
  }
}

// ─── Booking Status Lookup ─────────────────────────────────────

function bindLookupActions() {
  if (!elements.lookupForm) return;

  elements.lookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = elements.lookupIdInput.value.trim();

    if (!id) {
      window.alert('Please enter a booking ID to check status.');
      return;
    }

    elements.lookupButton.disabled = true;
    elements.lookupButton.textContent = 'Checking...';
    elements.lookupResult.classList.remove('hidden');
    elements.lookupResult.innerHTML = '<p class="status-loading">Searching for booking details...</p>';

    try {
      const booking = await fetchBookingStatus(id);

      elements.lookupResult.innerHTML = `
        <div class="status-card-info">
          <div class="status-header">
            <span class="status-badge ${booking.status.toLowerCase()}">${booking.status.toUpperCase()}</span>
            <span class="booking-id-tag">ID: ${booking.id}</span>
          </div>
          <h3>${booking.service_name}</h3>
          <ul class="status-details">
            <li><strong>Customer Name:</strong> ${booking.customer_name}</li>
            <li><strong>Phone:</strong> ${booking.phone}</li>
            <li><strong>Event Date:</strong> ${booking.date}</li>
            <li><strong>Advance Amount Due:</strong> ₹${booking.advance_amount.toLocaleString('en-IN')} (25%)</li>
            <li><strong>Selected Add-ons:</strong> ${booking.selected_addons && booking.selected_addons.length ? booking.selected_addons.join(', ') : 'None'}</li>
          </ul>
        </div>
      `;
    } catch (err) {
      elements.lookupResult.innerHTML = `
        <div class="status-card-error">
          <p><strong>⚠ ${err.message}</strong></p>
          <p class="error-hint">Please verify your booking ID and try again.</p>
        </div>
      `;
    } finally {
      elements.lookupButton.disabled = false;
      elements.lookupButton.textContent = 'Check Status';
    }
  });
}

// ─── Chat (UNTOUCHED — handled separately) ─────────────────────

function bindChatOpenButtons() {
  const buttons = document.querySelectorAll('[data-chat-open]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      elements.chatWidget.classList.add('open');
      elements.chatWidget.querySelector('.chat-toggle').setAttribute('aria-expanded', 'true');
      elements.chatInput.focus();
    });
  });

  document.querySelector('[data-chat-close]').addEventListener('click', () => {
    elements.chatWidget.classList.remove('open');
    elements.chatWidget.querySelector('.chat-toggle').setAttribute('aria-expanded', 'false');
  });
}

function bindChat() {
  elements.chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = elements.chatInput.value.trim();
    if (!message) return;

    addChatMessage('user', message);
    elements.chatInput.value = '';

    // Add loading indicator
    addChatMessage('bot', '<span class="typing">...</span>', [], 'loading-msg');

    fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    })
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      return res.json();
    })
    .then(data => {
      // Remove loading indicator
      const loadingEl = elements.chatBody.querySelector('.loading-msg');
      if (loadingEl) loadingEl.remove();
      
      const answer = data.answer || "I'm sorry, I couldn't understand that.";
      addChatMessage('bot', answer);
    })
    .catch(err => {
      const loadingEl = elements.chatBody.querySelector('.loading-msg');
      if (loadingEl) loadingEl.remove();
      addChatMessage('bot', "Sorry, I'm having trouble responding right now.\nPlease try again in a moment.");
    });
  });

  document.querySelectorAll('[data-suggestion]').forEach((button) => {
    button.addEventListener('click', () => {
      const suggestion = button.dataset.suggestion;
      elements.chatInput.value = suggestion;
      elements.chatForm.requestSubmit();
    });
  });
}

function addChatMessage(role, text, actions = [], extraClass = '') {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role} ${extraClass}`.trim();
  wrapper.innerHTML = text;

  if (actions.length) {
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'chat-fallback';
    actionsWrap.innerHTML = actions
      .map((action) => `<a href="${action.href}" class="${action.variant || 'primary'}">${action.label}</a>`)
      .join('');
    wrapper.appendChild(actionsWrap);
  }

  elements.chatBody.appendChild(wrapper);
  elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
}

// ─── Utilities ─────────────────────────────────────────────────

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Boot ──────────────────────────────────────────────────────
loadData();
