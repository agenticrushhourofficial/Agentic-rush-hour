/* ==========================================
   RUSH HOUR — JavaScript
   ========================================== */

// ========== COUNTDOWN TIMER ==========
(function initCountdown() {
  // March 27, 2026 at 09:00 AM IST (UTC+5:30)
  const eventDate = new Date('2026-03-27T09:00:00+05:30').getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    const now = Date.now();
    const diff = eventDate - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
})();

// ========== NAVBAR ==========
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  function highlightNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = navLinks.querySelector(`a[href="#${id}"]`);
      if (link) {
        link.classList.toggle('active', scrollY >= top && scrollY < top + height);
      }
    });
  }
  window.addEventListener('scroll', highlightNav);
})();

// ========== PARTICLES ==========
(function initParticles() {
  const container = document.getElementById('particles');
  const count = 20;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 10 + 8) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
})();

// ========== SCROLL REVEAL ==========
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

// ========== REGISTRATION FORM ==========
(function initForm() {
  const form = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const formFields = document.getElementById('formFields');
  const formSuccess = document.getElementById('formSuccess');
  const formSubmitWrapper = document.querySelector('.form-submit');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate
    const inputs = form.querySelectorAll('input, select, textarea');
    let valid = true;
    inputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = '#ff4444';
        setTimeout(() => {
          input.style.borderColor = '';
        }, 2000);
      }
    });

    if (!valid) return;

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Simulate submission
    setTimeout(() => {
      formFields.style.display = 'none';
      formSubmitWrapper.style.display = 'none';
      formSuccess.classList.add('show');
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }, 2000);
  });
})();

// ========== PRIZE CARDS TILT EFFECT ==========
(function initTilt() {
  const cards = document.querySelectorAll('.prize-card');

  if (window.innerWidth < 768) return; // Disable on mobile

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) translateY(0) rotateX(0) rotateY(0) scale(1)`;
    });
  });
})();

// ========== DOMAIN FILTERING & FLIP ==========
(function initDomainFlip() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const domainsGrid = document.getElementById('domainsGrid');
  const domainCards = document.querySelectorAll('.domain-card');

  if (!domainsGrid) return;

  // Filtering Logic
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.filter;
      domainsGrid.classList.remove('filter-software', 'filter-hardware');
      domainsGrid.classList.add(`filter-${target}`);

      // Reset all flips when switching categories
      domainCards.forEach(card => card.classList.remove('flipped'));
    });
  });

  // Flip Logic
  domainCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
})();

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
