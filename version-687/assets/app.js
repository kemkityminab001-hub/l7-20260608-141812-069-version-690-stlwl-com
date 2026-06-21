(() => {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      mobileNav.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    const showSlide = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    const startAuto = () => {
      stopAuto();
      timer = window.setInterval(() => showSlide(current + 1), 5200);
    };

    const stopAuto = () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        showSlide(Number(dot.dataset.heroDot || 0));
        startAuto();
      });
    });

    if (prev) {
      prev.addEventListener('click', () => {
        showSlide(current - 1);
        startAuto();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        showSlide(current + 1);
        startAuto();
      });
    }

    hero.addEventListener('mouseenter', stopAuto);
    hero.addEventListener('mouseleave', startAuto);
    startAuto();
  }

  const normalize = (value) => String(value || '').toLowerCase().trim();

  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const cardSearch = scope.querySelector('[data-card-search]');
    const cardList = scope.parentElement.querySelector('[data-card-list]');
    const cards = cardList ? Array.from(cardList.querySelectorAll('.movie-card')) : [];
    const categorySelect = scope.querySelector('[data-category-select]');
    const yearSelect = scope.querySelector('[data-year-select]');
    const resetButton = scope.querySelector('[data-filter-reset]');
    const resultCount = scope.parentElement.querySelector('[data-result-count]');
    const yearButtons = Array.from(scope.querySelectorAll('[data-filter-year]'));
    let selectedYear = 'all';

    const updateCards = () => {
      const query = normalize(cardSearch ? cardSearch.value : '');
      const category = categorySelect ? categorySelect.value : 'all';
      const selectYear = yearSelect ? yearSelect.value : selectedYear;
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.year,
          card.dataset.category,
          card.dataset.genre,
          card.textContent
        ].join(' '));
        const matchesQuery = !query || haystack.includes(query);
        const matchesCategory = category === 'all' || card.dataset.category === category;
        const matchesYear = selectYear === 'all' || card.dataset.year === selectYear;
        const shouldShow = matchesQuery && matchesCategory && matchesYear;

        card.classList.toggle('is-filter-hidden', !shouldShow);
        if (shouldShow) {
          visible += 1;
        }
      });

      if (resultCount) {
        resultCount.textContent = `共 ${visible} 部内容`;
      }
    };

    if (cardSearch) {
      cardSearch.addEventListener('input', updateCards);
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', updateCards);
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', updateCards);
    }

    yearButtons.forEach((button) => {
      button.addEventListener('click', () => {
        selectedYear = button.dataset.filterYear || 'all';
        yearButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        updateCards();
      });
    });

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (cardSearch) {
          cardSearch.value = '';
        }
        if (categorySelect) {
          categorySelect.value = 'all';
        }
        if (yearSelect) {
          yearSelect.value = 'all';
        }
        selectedYear = 'all';
        yearButtons.forEach((item, index) => item.classList.toggle('is-active', index === 0));
        updateCards();
      });
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');

    if (q && cardSearch) {
      cardSearch.value = q;
    }

    updateCards();
  });

  document.querySelectorAll('[data-table-search]').forEach((input) => {
    const table = input.closest('.section-block').querySelector('[data-table-list]');
    const rows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];

    const updateRows = () => {
      const query = normalize(input.value);

      rows.forEach((row) => {
        const haystack = normalize([
          row.dataset.title,
          row.dataset.year,
          row.dataset.category,
          row.dataset.genre,
          row.textContent
        ].join(' '));
        row.classList.toggle('is-filter-hidden', query && !haystack.includes(query));
      });
    };

    input.addEventListener('input', updateRows);
  });
})();
