document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.memorial .container');
  const totalCountEl = document.getElementById('total-count');
  const resultsCountEl = document.getElementById('results-count');
  const totalVictimsEl = document.getElementById('total-victims');
  const searchInput = document.getElementById('search-input');
  const citySelect = document.getElementById('city-select');
  const ageMin = document.getElementById('age-min');
  const ageMax = document.getElementById('age-max');
  const ageLabel = document.getElementById('age-range-label');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const paginationPages = document.getElementById('pagination-pages');
  const paginationPrev = document.querySelector('.pagination__prev');
  const paginationNext = document.querySelector('.pagination__next');
  const modal = document.getElementById('victim-modal');
  const modalCloseBtn = document.querySelector('.modal__close');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalStory = document.querySelector('.modal__story');
  const modalSource = document.querySelector('.modal__source');

  // Modal accessibility: focus management
  let lastFocusedElement = null;

  function getFocusableElements() {
    return modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
  }

  const PAGE_SIZE = 20;

  let allVictims = [];
  let filteredVictims = [];
  let currentPage = 1;

  // Debounce utility
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Load data
  async function loadVictims() {
    try {
      const resp = await fetch('data/victims.json');
      allVictims = await resp.json();
      totalVictimsEl.textContent = allVictims.length;
      totalCountEl.textContent = `Total: ${allVictims.length} documented martyrs`;
      populateCityFilter();
      applyFilters(); // initial render
    } catch (err) {
      console.error('Failed to load victims:', err);
      container.innerHTML = '<p class="error">Unable to load victim data.</p>';
    }
  }

  // Populate city multi-select
  function populateCityFilter() {
    const cities = [...new Set(allVictims.map(v => v.city).filter(Boolean))].sort();
    // Keep the first option (All cities)
    citySelect.innerHTML = '<option value="">All cities</option>';
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
  }

  // Get current filter values
  function getFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedCities = Array.from(citySelect.selectedOptions).map(o => o.value).filter(v => v);
    const minAge = parseInt(ageMin.value) || 0;
    const maxAge = parseInt(ageMax.value) || 100;
    return { search, selectedCities, minAge, maxAge };
  }

  // Apply filters and update pagination
  function applyFilters() {
    const { search, selectedCities, minAge, maxAge } = getFilters();

    filteredVictims = allVictims.filter(v => {
      // Name search
      if (search && !v.name.toLowerCase().includes(search)) return false;
      // City filter
      if (selectedCities.length && !selectedCities.includes(v.city)) return false;
      // Age filter (ignore if age missing)
      if (v.age != null) {
        if (v.age < minAge || v.age > maxAge) return false;
      }
      return true;
    });

    // Ensure age range inputs reflect actual bounds after filtering? Keep as is.
    resultsCountEl.textContent = filteredVictims.length;
    currentPage = 1; // reset to first page
    renderPage();
    renderPagination();
  }

  // Render current page of cards
  function renderPage() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageVictims = filteredVictims.slice(start, end);

    container.innerHTML = '';
    pageVictims.forEach((v, i) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = v.id;
      card.style.animationDelay = `${i * 0.05}s`;

      // Format date
      const dateStr = v.date && v.date !== '2026-01-??'
        ? new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'January 2026 (date unverified)';

      const photoContent = v.photo ? `<img src="${v.photo}" alt="" class="card__photo-img" />` : '🕯️';

      card.innerHTML = `
        <div class="card__photo" role="img" aria-label="Memorial candle">${photoContent}</div>
        <div class="card__body">
          <h2 class="card__name">${v.name}</h2>
          <div class="card__meta">
            <span>🎂 Age: ${v.age ?? 'Unknown'}</span>
            <span>📍 ${v.city}</span>
            <span>📅 ${dateStr}</span>
          </div>
          <div class="card__story ${v.story.length > 150 ? 'collapsed' : ''}" id="story-${v.id}">
            ${v.story}
          </div>
          ${v.story.length > 150 ? `<button class="card__toggle" data-id="${v.id}">Read full story</button>` : ''}
          <div class="card__source">Source: ${v.source}</div>
        </div>
      `;
      container.appendChild(card);
    });

    // Event listeners for toggles
    document.querySelectorAll('.card__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const storyEl = document.getElementById(`story-${id}`);
        storyEl.classList.remove('collapsed');
        btn.remove();
      });
    });

    // Open modal on card click
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card__toggle')) return;
        const v = allVictims.find(vict => vict.id === parseInt(card.dataset.id));
        if (v) openModal(v);
      });
    });

    // Trigger scroll animations
    initObserver();
  }

  // Pagination rendering
  function renderPagination() {
    const totalPages = Math.ceil(filteredVictims.length / PAGE_SIZE);
    paginationPages.innerHTML = '';
    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = `pagination__page ${p === currentPage ? 'active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => {
        currentPage = p;
        renderPage();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      paginationPages.appendChild(btn);
    }
    paginationPrev.disabled = currentPage === 1;
    paginationNext.disabled = currentPage === totalPages;
  }

  paginationPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  paginationNext.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredVictims.length / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Age range label update
  function updateAgeLabel() {
    const min = ageMin.value;
    const max = ageMax.value;
    ageLabel.textContent = `${min} – ${max}`;
  }
  ageMin.addEventListener('input', () => {
    if (parseInt(ageMin.value) > parseInt(ageMax.value)) {
      ageMin.value = ageMax.value;
    }
    updateAgeLabel();
    debouncedApply();
  });
  ageMax.addEventListener('input', () => {
    if (parseInt(ageMax.value) < parseInt(ageMin.value)) {
      ageMax.value = ageMin.value;
    }
    updateAgeLabel();
    debouncedApply();
  });

  // Clear filters
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    citySelect.selectedIndex = 0;
    ageMin.value = 0;
    ageMax.value = 100;
    updateAgeLabel();
    applyFilters();
  });

  // Debounced apply for search input
  const debouncedApply = debounce(applyFilters, 300);

  searchInput.addEventListener('input', debouncedApply);
  citySelect.addEventListener('change', applyFilters);

  // Modal accessibility focus management
  function openModal(v) {
    lastFocusedElement = document.activeElement;

    const dateStr = v.date && v.date !== '2026-01-??'
      ? new Date(v.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'January 2026 (date under verification)';

    modalTitle.textContent = v.name;
    modalDesc.innerHTML = `🎂 Age: ${v.age ?? 'Unknown'} &nbsp;|&nbsp; 📍 ${v.city} &nbsp;|&nbsp; 📅 ${dateStr}`;
    modalStory.innerHTML = `<div style="line-height:1.8;font-size:1.05rem;">${v.story}</div>`;
    modalSource.textContent = `Source: ${v.source}`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Set focus to close button (or first focusable element)
    const focusable = getFocusableElements();
    if (focusable.length) focusable[0].focus();

    // Trap Tab key inside modal
    document.addEventListener('keydown', modalKeyDown);
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', modalKeyDown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function modalKeyDown(e) {
    if (e.key === 'Tab' && modal.classList.contains('open')) {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Scroll animations
  function initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach(card => observer.observe(card));
  }

  // Initialize
  loadVictims();
});