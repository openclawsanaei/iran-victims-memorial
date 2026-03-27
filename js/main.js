document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.memorial .container');
  const countDisplay = document.getElementById('count-display');
  const modal = document.getElementById('victim-modal');
  const modalBody = document.querySelector('.modal__body');
  const modalClose = document.querySelector('.modal__close');

  let victims = [];

  async function loadVictims() {
    try {
      const resp = await fetch('data/victims.json');
      victims = await resp.json();
      countDisplay.textContent = `Showing ${victims.length} documented martyrs`;
      renderCards();
      initObserver();
    } catch (err) {
      console.error('Failed to load victims:', err);
      container.innerHTML = '<p class="error">Unable to load victim data.</p>';
    }
  }

  function renderCards() {
    container.innerHTML = '';
    victims.forEach((v, i) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = v.id;
      // Delay animation based on index
      card.style.animationDelay = `${i * 0.1}s`;

      // Format date
      const dateStr = v.date && v.date !== '2026-01-??'
        ? new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'January 2026 (date unverified)';

      // Photo placeholder
      const photoContent = '🕯️';

      card.innerHTML = `
        <div class="card__photo" role="img" aria-label="Memorial candle">${photoContent}</div>
        <div class="card__body">
          <h2 class="card__name">${v.name}</h2>
          <div class="card__meta">
            <span>🎂 Age: ${v.age || 'Unknown'}</span>
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

    // Attach event listeners for toggles
    document.querySelectorAll('.card__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const storyEl = document.getElementById(`story-${id}`);
        storyEl.classList.remove('collapsed');
        btn.remove();
      });
    });

    // Attach click to open modal (whole card click but not on buttons)
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card__toggle')) return;
        const v = victims.find(vict => vict.id === parseInt(card.dataset.id));
        if (v) openModal(v);
      });
    });
  }

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

  function openModal(v) {
    const dateStr = v.date && v.date !== '2026-01-??'
      ? new Date(v.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'January 2026 (date under verification)';

    modalBody.innerHTML = `
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom:0.5rem; color: var(--color-primary);">${v.name}</h2>
      <p style="color: var(--color-text-muted); margin-bottom: 1rem;">
        🎂 Age: ${v.age || 'Unknown'} &nbsp;|&nbsp; 📍 ${v.city} &nbsp;|&nbsp; 📅 ${dateStr}
      </p>
      <div style="line-height: 1.8; font-size: 1.05rem;">
        ${v.story}
      </div>
      <p style="margin-top: 2rem; font-size: 0.85rem; color: var(--color-text-muted);">Source: ${v.source}</p>
    `;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  loadVictims();
});