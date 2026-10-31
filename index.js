/* ==========================================
   RUSH HOUR — JavaScript Core Logic Engine
   ========================================== */

// Global Configuration
window.sfxEnabled = true;

// ==========================================
// 1. TOAST NOTIFICATION SYSTEM
// ==========================================
const ToastCenter = (function () {
  const container = document.getElementById('toastContainer');

  function show(message, type = 'success') {
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    
    toast.innerHTML = `
      <span class="toast-text">${message}</span>
      <button class="toast-close-btn" aria-label="Close Toast">&times;</button>
    `;
    
    container.appendChild(toast);

    // Audio feedback for notifications
    if (type === 'error') {
      SoundEngine.playSynthSound(150, 0.1, 'sawtooth');
    } else {
      SoundEngine.playSynthSound(600, 0.15, 'sine');
    }

    // Close on button click
    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      toast.remove();
    });

    // Auto cleanup after animation ends
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  return { show };
})();

// ==========================================
// 2. WEB AUDIO SFX ENGINE (Synthesized Cyberpunk Tones)
// ==========================================
const SoundEngine = (function () {
  let audioCtx = null;

  function initCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // General tone generator
  function playSynthSound(freq, duration, type = 'sine', volume = 0.1) {
    if (!window.sfxEnabled) return;
    try {
      initCtx();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Web Audio synthesis failed:', e);
    }
  }

  // Synthesize customized clips
  function playClick() {
    playSynthSound(800, 0.08, 'triangle', 0.12);
  }

  function playHover() {
    playSynthSound(550, 0.03, 'sine', 0.04);
  }

  function playSuccess() {
    if (!window.sfxEnabled) return;
    try {
      initCtx();
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        
        gainNode.gain.setValueAtTime(0.08, now + index * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.25);
      });
    } catch (e) {
      console.warn('Web Audio pitch arpeggio failed:', e);
    }
  }

  function playFlip() {
    playSynthSound(440, 0.18, 'sine', 0.08);
  }

  // Thanos snap MP3 audio element (created once, reused)
  let _thanosAudio = null;
  function _getThanosAudio() {
    if (!_thanosAudio) {
      _thanosAudio = new Audio('assets/thanos-snap.mp3');
      _thanosAudio.volume = 0.85;
    }
    return _thanosAudio;
  }

  function playStoneBlast() {
    if (!window.sfxEnabled) return;
    try {
      const snap = _getThanosAudio();
      snap.currentTime = 0;
      snap.play().catch(e => console.warn('Thanos snap playback failed:', e));
    } catch (e) {
      console.warn('Audio blast failed:', e);
    }
  }

  return {
    playSynthSound,
    playClick,
    playHover,
    playSuccess,
    playFlip,
    playStoneBlast
  };
})();

// Attach sounds to all buttons and anchor links
document.addEventListener('DOMContentLoaded', () => {
  const hoverables = document.querySelectorAll('button, a, select, input, textarea, .faq-trigger, .domain-card');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      SoundEngine.playHover();
    });
    el.addEventListener('click', () => {
      // Don't override elements that trigger custom sounds
      if (!el.classList.contains('domain-card') && !el.classList.contains('audio-toggle')) {
        SoundEngine.playClick();
      }
    });
  });
});

// ==========================================
// 3. THEME CUSTOMIZER & SWITCHER
// ==========================================
(function initThemeCustomizer() {
  const trigger = document.getElementById('themeSelectTrigger');
  const dropdown = document.getElementById('themeDropdown');
  const themeOpts = document.querySelectorAll('.theme-opt');

  if (!trigger || !dropdown) return;

  // Toggle dropdown on click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
    SoundEngine.playClick();
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  // Switch Theme Accents
  themeOpts.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const theme = opt.dataset.theme;
      
      // Update HTML attribute
      document.documentElement.setAttribute('data-theme', theme);
      
      // Toggle active states
      themeOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      
      // Update current theme dot indicator
      const currentDot = trigger.querySelector('.current-dot');
      currentDot.className = 'theme-dot current-dot';
      if (theme === 'purple') currentDot.style.backgroundColor = '#9b30ff';
      if (theme === 'cyan') currentDot.style.backgroundColor = '#00ffff';
      if (theme === 'green') currentDot.style.backgroundColor = '#00ff00';
      if (theme === 'orange') currentDot.style.backgroundColor = '#ff6600';
      
      dropdown.classList.remove('show');
      SoundEngine.playClick();
      
      // Notify user
      const themeName = opt.textContent.trim();
      ToastCenter.show(`Theme Accent updated to ${themeName}!`, 'success');
    });
  });
})();

// ==========================================
// 4. CONSTELLATION CANVAS PARTICLES
// ==========================================
(function initCanvasParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  let particles = [];
  const particleCount = 60;
  const connectionDistance = 110;
  let mouse = { x: null, y: null, radius: 140 };

  // Set sizing — use window for fixed-position canvas (subpages), parent for hero
  function resizeCanvas() {
    const isFixed = getComputedStyle(canvas).position === 'fixed';
    if (isFixed) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track mouse — for fixed canvas (pointer-events: none), listen on document
  const isFixed = getComputedStyle(canvas).position === 'fixed';
  const mouseTarget = isFixed ? document : canvas;

  mouseTarget.addEventListener('mousemove', (e) => {
    if (isFixed) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    } else {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Resolve color dynamically to match customizer custom properties
  function getThemeColor() {
    const rawVal = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent-light').trim();
    return rawVal || '#38bdf8';
  }

  // Node particle object constructor
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2.5 + 1.5;
      this.isMagenta = Math.random() < 0.28;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.isMagenta ? '#e879f9' : getThemeColor();
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    update() {
      // Avoid borders
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      // Mouse interaction (push away)
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          this.x += Math.cos(angle) * force * 2;
          this.y += Math.sin(angle) * force * 2;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
    }
  }

  // Populate node array
  function setupParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  setupParticles();
  window.addEventListener('resize', setupParticles);

  // Connection renderer
  function connectParticles() {
    const accentColor = getThemeColor();
    // Simple hex conversion checks to extract RGB channels for transparency interpolation
    let rgb = "56, 189, 248"; // default poster electric cyan
    if (accentColor.includes('rgb')) {
      rgb = accentColor.replace(/[^\d,]/g, '');
    } else if (accentColor.startsWith('#')) {
      const hex = accentColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      rgb = `${r}, ${g}, ${b}`;
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const opacity = (1 - (dist / connectionDistance)) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Loop runner
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    connectParticles();
    animationFrameId = requestAnimationFrame(loop);
  }

  loop();
})();

// ==========================================
// 5. LIVE COUNTDOWN TIMER
// ==========================================
(function initCountdown() {
  let eventDateObj = new Date('2026-07-24T09:00:00+05:30');
  while (Date.now() > eventDateObj.getTime()) {
    eventDateObj.setFullYear(eventDateObj.getFullYear() + 1);
  }
  const eventDate = eventDateObj.getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = eventDate - now;

    if (diff <= 0) {
      [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => el.textContent = '00');
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

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

// ==========================================
// 6. INTERACTIVE TIMELINE COMPONENT
// ==========================================
(function initTimeline() {
  const filterBtns = document.querySelectorAll('.time-filter-btn');
  const items = document.querySelectorAll('.timeline-item');
  const progressLine = document.getElementById('timelineProgress');

  if (items.length === 0 || !progressLine) return;

  // Day toggler logic
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      SoundEngine.playClick();
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const dayFilter = btn.dataset.day;

      items.forEach(item => {
        if (item.classList.contains(dayFilter)) {
          item.classList.remove('filtered-out');
        } else {
          item.classList.add('filtered-out');
        }
      });
      
      updateTimelineScroll();
    });
  });

  // Calculate scrolling neon indicator
  function updateTimelineScroll() {
    const visibleItems = Array.from(items).filter(item => !item.classList.contains('filtered-out'));
    if (visibleItems.length === 0) return;

    const timelineContainer = document.querySelector('.timeline-items');
    const containerRect = timelineContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Line anchors
    const firstDot = visibleItems[0].querySelector('.timeline-dot').getBoundingClientRect();
    const lastDot = visibleItems[visibleItems.length - 1].querySelector('.timeline-dot').getBoundingClientRect();
    
    const firstDotY = firstDot.top - containerRect.top + firstDot.height / 2;
    const lastDotY = lastDot.top - containerRect.top + lastDot.height / 2;

    // Check how much of the timeline the user has scrolled past
    let scrollTriggerY = viewportHeight * 0.7; // highlight elements 70% down viewport
    let maxReachY = 0;

    visibleItems.forEach(item => {
      const dot = item.querySelector('.timeline-dot').getBoundingClientRect();
      const dotCenterY = dot.top + dot.height / 2;
      const relativeDotY = dotCenterY - containerRect.top;

      if (dotCenterY < scrollTriggerY) {
        item.classList.add('active', 'passed');
        maxReachY = relativeDotY;
      } else {
        item.classList.remove('active', 'passed');
      }
    });

    // Handle progress indicator placement
    const progressStart = firstDotY;
    let progressEnd = Math.max(progressStart, maxReachY);
    
    // Scale line top and height
    const percentFill = ((progressEnd - progressStart) / (lastDotY - progressStart)) * 100;
    progressLine.style.top = `${progressStart}px`;
    progressLine.style.height = `${progressEnd - progressStart}px`;
  }

  // Set initial filter state based on active button
  const activeBtn = document.querySelector('.time-filter-btn.active');
  if (activeBtn) {
    const dayFilter = activeBtn.dataset.day;
    items.forEach(item => {
      if (item.classList.contains(dayFilter)) {
        item.classList.remove('filtered-out');
      } else {
        item.classList.add('filtered-out');
      }
    });
  }

  window.addEventListener('scroll', updateTimelineScroll);
  window.addEventListener('resize', updateTimelineScroll);
  // Fire initial check
  setTimeout(updateTimelineScroll, 200);
})();

// ==========================================
// 7. TRACKS DOMAINS SEARCH & FLIP
// ==========================================
(function initDomainsTrackManager() {
  const grid = document.getElementById('domainsGrid');
  const trigger = document.getElementById('domainDropdownTrigger');
  const wrapper = document.querySelector('.domain-dropdown-wrapper');
  const opts = document.querySelectorAll('.domain-dropdown-opt');
  const searchInput = document.getElementById('domainSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const cards = document.querySelectorAll('.domain-card');
  const fallbackMsg = document.getElementById('noTracksMessage');

  if (!grid || !trigger || !wrapper) return;

  let activeCategory = 'blip';
  let searchQuery = '';

  // Toggle dropdown visibility
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('open');
    SoundEngine.playClick();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    wrapper.classList.remove('open');
  });

  // Apply visual category changes via dropdown options
  opts.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      SoundEngine.playClick();

      opts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');

      // Update trigger label
      trigger.querySelector('.dropdown-selected-label').textContent = opt.textContent;

      activeCategory = opt.dataset.filter;
      applyFilters();
      resetAllFlips();
      wrapper.classList.remove('open');
    });
  });

  // Track Search Inputs
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    clearBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
    applyFilters();
  });

  clearBtn.addEventListener('click', () => {
    SoundEngine.playClick();
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    applyFilters();
  });

  // Card flips & stone blast detonation
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFlipped = card.classList.contains('flipped');
      
      if (!isFlipped) {
        // Play Thanos snap 1 second BEFORE the visual blast
        SoundEngine.playStoneBlast();

        setTimeout(() => {
          // DETONATE STONE BLAST! (1 second after sound)
          const color = card.dataset.stoneColor || '#38bdf8';
          const iconWrapper = card.querySelector('.domain-icon');

          triggerStoneBlast(iconWrapper || card, color);
          card.classList.add('blasting');

          // At blast climax: flip card to show problem statements!
          setTimeout(() => {
            resetAllFlips(card);
            card.classList.add('flipped');
            card.classList.remove('blasting');
          }, 260);
        }, 1000);
      } else {
        // Flip back to stone
        card.classList.remove('flipped');
        SoundEngine.playFlip();
      }
    });
  });

  function triggerStoneBlast(targetEl, color) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Shockwave Ring
    const shockwave = document.createElement('div');
    shockwave.className = 'stone-shockwave';
    shockwave.style.setProperty('--shockwave-color', color);
    targetEl.appendChild(shockwave);
    setTimeout(() => shockwave.remove(), 550);

    // Radiant Energy Spark Particles
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'stone-particle';
      p.style.backgroundColor = color;
      p.style.color = color;
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;

      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 45 + Math.random() * 70;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      targetEl.appendChild(p);

      setTimeout(() => p.remove(), 600);
    }
  }

  function resetAllFlips(exceptCard = null) {
    cards.forEach(c => {
      if (c !== exceptCard) c.classList.remove('flipped');
    });
  }

  // Combined categorization and search algorithm
  function applyFilters() {
    let matchesCount = 0;

    cards.forEach(card => {
      const category = card.dataset.category;
      const searchMetadata = card.dataset.name.toLowerCase();
      
      const categoryMatch = activeCategory === 'all' || 
                            category === activeCategory || 
                            category.includes(activeCategory);
                            
      const searchMatch = searchQuery === '' || searchMetadata.includes(searchQuery);

      if (categoryMatch && searchMatch) {
        card.style.display = '';
        matchesCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Adjust grid columns: 3-col for blip (6 cards = 2 rows × 3), 2-col centered for synthezoids
    if (activeCategory === 'synthezoids') {
      grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 380px))';
      grid.style.justifyContent = 'center';
    } else if (activeCategory === 'blip') {
      grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      grid.style.justifyContent = '';
    } else {
      grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      grid.style.justifyContent = '';
    }

    if (matchesCount === 0) {
      fallbackMsg.style.display = 'block';
    } else {
      fallbackMsg.style.display = 'none';
    }
  }

  // Initial call to set activeCategory and filter properly on page load
  applyFilters();
})();

// ==========================================
// 8. DYNAMIC STEPPED REGISTRATION FORM
// ==========================================
(function initRegistrationForm() {
  const form = document.getElementById('registrationForm');
  const section1 = document.getElementById('formSection1');
  const section2 = document.getElementById('formSection2');
  const section3 = document.getElementById('formSection3');
  
  const teamSizeSelect = document.getElementById('teamSize');
  const dynamicContainer = document.getElementById('dynamicMembersContainer');
  
  const nextBtn = document.getElementById('nextStepBtn');
  const nextBtn2 = document.getElementById('nextStepBtn2');
  const prevBtn = document.getElementById('prevStepBtn');
  const prevBtn3 = document.getElementById('prevStepBtn3');
  const submitBtn = document.getElementById('submitBtn');
  const successOverlay = document.getElementById('formSuccess');
  
  const stepCountText = document.getElementById('formStepCount');
  const stepTitle = document.getElementById('formStepTitle');
  const progressFill = document.getElementById('formProgressFill');

  const paymentTotal = document.getElementById('paymentTotal');
  const paymentCalc = document.getElementById('paymentCalc');
  const paymentProofInput = document.getElementById('paymentProof');
  const fileDropZone = document.getElementById('fileDropZone');
  const fileDropText = document.getElementById('fileDropText');

  if (!form) return;

  // Initialize Dynamic Member inputs
  function renderMemberFields() {
    const size = parseInt(teamSizeSelect.value);
    const orgVal = (document.getElementById('college')?.value || '').trim();
    
    // Clear old container
    dynamicContainer.innerHTML = '';
    
    // Generate fields for all members (Member 1 to Member N)
    for (let i = 1; i <= size; i++) {
      const memberBlock = document.createElement('div');
      memberBlock.className = 'member-form-block';
      
      const isLeader = (i === 1);
      const nameVal = isLeader ? (document.getElementById('teamLeader')?.value || '').trim() : '';
      const emailVal = isLeader ? (document.getElementById('email')?.value || '').trim() : '';
      const phoneVal = isLeader ? (document.getElementById('phone')?.value || '').trim() : '';
      
      memberBlock.innerHTML = `
        <div class="member-block-title">Team Member ${i} ${isLeader ? '(Team Leader)' : ''}</div>
        <div class="form-grid">
          <div class="form-group">
            <label for="m${i}_name">Full Name <span class="required">*</span></label>
            <input type="text" id="m${i}_name" name="m${i}_name" placeholder="Full Name" value="${nameVal}" ${isLeader ? 'readonly' : ''} required />
            <span class="error-msg">Member name is required</span>
          </div>
          <div class="form-group">
            <label for="m${i}_college">Organization (University / College / Working / Senior Secondary) <span class="required">*</span></label>
            <input type="text" id="m${i}_college" name="m${i}_college" placeholder="Organization name" value="${isLeader ? orgVal : ''}" required />
            <span class="error-msg">Organization is required</span>
          </div>
          <div class="form-group">
            <label for="m${i}_phone">Phone No. <span class="required">*</span></label>
            <input type="tel" id="m${i}_phone" name="m${i}_phone" placeholder="10-digit mobile number" value="${phoneVal}" ${isLeader ? 'readonly' : ''} required />
            <span class="error-msg">Valid phone number is required</span>
          </div>
          <div class="form-group">
            <label for="m${i}_email">Mail ID <span class="required">*</span></label>
            <input type="email" id="m${i}_email" name="m${i}_email" placeholder="email@example.com" value="${emailVal}" ${isLeader ? 'readonly' : ''} required />
            <span class="error-msg">Enter a valid email address</span>
          </div>
        </div>
      `;
      dynamicContainer.appendChild(memberBlock);
    }
  }

  const closedOverlay = document.getElementById('registrationClosed');

  function updateRegistrationStatus() {
    fetch('/api/registration-status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.slots) {
          const slots = data.slots;
          
          // Clear and rebuild options
          teamSizeSelect.innerHTML = '';
          
          let availableSizes = [1, 2, 3, 4, 5, 6];
          let allClosed = true;
          let firstAvailable = null;
          
          availableSizes.forEach(size => {
            const sizeSlots = slots[size] || 0;
            const option = document.createElement('option');
            option.value = size;
            if (sizeSlots > 0) {
              option.textContent = `${size} Members (${sizeSlots} slots left)`;
              allClosed = false;
              if (firstAvailable === null) {
                firstAvailable = size;
              }
            } else {
              option.textContent = `${size} Members (Closed)`;
              option.disabled = true;
            }
            teamSizeSelect.appendChild(option);
          });
          
          if (allClosed) {
            form.style.display = 'none';
            if (closedOverlay) closedOverlay.style.display = 'block';
          } else {
            form.style.display = 'block';
            if (closedOverlay) closedOverlay.style.display = 'none';
            if (firstAvailable !== null) {
              teamSizeSelect.value = firstAvailable;
            }
            renderMemberFields();
          }
        }
      })
      .catch(err => {
        console.error('Error fetching registration status:', err);
      });
  }

  // Initial field rendering & slots fetch
  updateRegistrationStatus();
  teamSizeSelect.addEventListener('change', renderMemberFields);

  // Helper validation functions
  function validateField(input) {
    const group = input.closest('.form-group');
    if (!group) return true;

    let valid = true;
    const val = input.value.trim();

    if (input.hasAttribute('required')) {
      if (val === '') {
        valid = false;
      }
    }

    if (valid && input.type === 'email' && val !== '') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(val)) {
        valid = false;
      }
    }

    if (valid && input.id === 'phone' && val !== '') {
      // Minimum 10 digits check
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) {
        valid = false;
      }
    }

    if (!valid) {
      group.classList.add('error');
      group.classList.remove('success');
      // Shake animation trigger
      group.classList.remove('shake-element');
      void group.offsetWidth; // trigger reflow
      group.classList.add('shake-element');
    } else {
      group.classList.remove('error');
      group.classList.add('success');
    }

    return valid;
  }

  // Clear errors on input focus
  form.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      const group = e.target.closest('.form-group');
      if (group) group.classList.remove('error', 'shake-element');
    }
  });

  // ─── Step 1 → 2 ──────────────────────────────────────────────────────────
  // Package and domain selection handlers
  const pkgRadios = document.querySelectorAll('input[name="submissionPackage"]');
  const domainCheckboxes = document.querySelectorAll('input[name="domainsSelected"]');
  const pkgSingleLabel = document.getElementById('pkgSingleLabel');
  const pkgDualLabel = document.getElementById('pkgDualLabel');
  const chooseTrackHint = document.getElementById('chooseTrackHint');

  function getSelectedPackage() {
    const checked = document.querySelector('input[name="submissionPackage"]:checked');
    return checked ? checked.value : 'single';
  }

  function updatePackageVisuals() {
    const pkg = getSelectedPackage();
    if (pkgSingleLabel && pkgDualLabel) {
      if (pkg === 'single') {
        pkgSingleLabel.classList.add('selected');
        pkgDualLabel.classList.remove('selected');
        if (chooseTrackHint) {
          chooseTrackHint.innerHTML = 'Select <strong>exactly 1 domain</strong> for Single Submission (₹200 per head).';
        }
      } else {
        pkgDualLabel.classList.add('selected');
        pkgSingleLabel.classList.remove('selected');
        if (chooseTrackHint) {
          chooseTrackHint.innerHTML = 'Select <strong>exactly 2 domains</strong> (can be two from Track 1, or one from Track 1 & one from Track 2). <em>Note: Selecting both from Track 2 is not allowed.</em>';
        }
      }
    }
  }

  pkgRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updatePackageVisuals();
      SoundEngine.playClick();
      // Clear selections or enforce limits when switching packages
      const pkg = getSelectedPackage();
      const checkedBoxes = Array.from(document.querySelectorAll('input[name="domainsSelected"]:checked'));
      if (pkg === 'single' && checkedBoxes.length > 1) {
        checkedBoxes.slice(1).forEach(cb => {
          cb.checked = false;
          cb.closest('.domain-choice-card')?.classList.remove('selected');
        });
      }
    });
  });

  domainCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const card = cb.closest('.domain-choice-card');
      const pkg = getSelectedPackage();

      if (cb.checked) {
        if (pkg === 'single') {
          // In single submission, only 1 domain can be selected
          domainCheckboxes.forEach(other => {
            if (other !== cb && other.checked) {
              other.checked = false;
              other.closest('.domain-choice-card')?.classList.remove('selected');
            }
          });
          card?.classList.add('selected');
        } else {
          // In dual submission, maximum 2 domains
          const currentlyChecked = Array.from(document.querySelectorAll('input[name="domainsSelected"]:checked'));
          if (currentlyChecked.length > 2) {
            cb.checked = false;
            ToastCenter.show('Dual Submission allows selecting up to 2 domains.', 'warning');
            return;
          }

          // Check if user tries to select two from Track 2 (Synthezoids)
          const track2Checked = currentlyChecked.filter(b => b.dataset.track === 'Synthezoids');
          if (track2Checked.length === 2) {
            cb.checked = false;
            ToastCenter.show('Both domains cannot be from Track 2 (Synthezoids). You can pick 2 from Track 1, or 1 from Track 1 and 1 from Track 2.', 'warning');
            return;
          }

          card?.classList.add('selected');
        }
      } else {
        card?.classList.remove('selected');
      }
    });
  });

  nextBtn.addEventListener('click', () => {
    const fieldsToValidate = section1.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select');
    let hasErrors = false;
    fieldsToValidate.forEach(field => { if (!validateField(field)) hasErrors = true; });

    // Validate domain selection according to package
    const pkg = getSelectedPackage();
    const selectedBoxes = Array.from(document.querySelectorAll('input[name="domainsSelected"]:checked'));
    const trackError = document.getElementById('trackSelectError');

    if (pkg === 'single') {
      if (selectedBoxes.length !== 1) {
        if (trackError) {
          trackError.textContent = 'Please choose exactly 1 domain for Single Submission.';
          trackError.style.display = 'block';
        }
        hasErrors = true;
      } else {
        if (trackError) trackError.style.display = 'none';
      }
    } else if (pkg === 'dual') {
      if (selectedBoxes.length !== 2) {
        if (trackError) {
          trackError.textContent = 'Please select exactly 2 domains for Dual Submission.';
          trackError.style.display = 'block';
        }
        hasErrors = true;
      } else {
        // Disallow both domains being from Track 2 (Synthezoids)
        const track2Count = selectedBoxes.filter(b => b.dataset.track === 'Synthezoids').length;
        if (track2Count === 2) {
          if (trackError) {
            trackError.textContent = 'Both selections cannot be from Track 2 (Synthezoids). You can choose 2 from Track 1 (The Blip), or 1 from Track 1 and 1 from Track 2.';
            trackError.style.display = 'block';
          }
          hasErrors = true;
        } else {
          if (trackError) trackError.style.display = 'none';
        }
      }
    }

    if (hasErrors) {
      ToastCenter.show('Please fill in all required fields and choose your domain(s).', 'error');
      return;
    }

    // Sync leader details to Member 1 fields
    const m1Name = document.getElementById('m1_name');
    const m1Email = document.getElementById('m1_email');
    const m1College = document.getElementById('m1_college');
    const m1Phone = document.getElementById('m1_phone');
    if (m1Name) m1Name.value = document.getElementById('teamLeader').value.trim();
    if (m1Email) m1Email.value = document.getElementById('email').value.trim();
    if (m1College) m1College.value = document.getElementById('college').value.trim();
    if (m1Phone) m1Phone.value = document.getElementById('phone').value.trim();

    section1.classList.remove('active');
    section2.classList.add('active');
    stepCountText.textContent = '2';
    progressFill.style.width = '66%';
    if (stepTitle) stepTitle.textContent = 'Member Details';
    SoundEngine.playSuccess();
  });

  // ─── Step 2 ← 1 ──────────────────────────────────────────────────────────
  prevBtn.addEventListener('click', () => {
    section2.classList.remove('active');
    section1.classList.add('active');
    stepCountText.textContent = '1';
    progressFill.style.width = '33%';
    if (stepTitle) stepTitle.textContent = 'Team Metadata';
    SoundEngine.playClick();
  });

  // ─── Step 2 → 3 ──────────────────────────────────────────────────────────
  if (nextBtn2) {
    nextBtn2.addEventListener('click', () => {
      const fieldsToValidate = section2.querySelectorAll('input, select');
      let hasErrors = false;
      fieldsToValidate.forEach(field => { if (!validateField(field)) hasErrors = true; });

      if (hasErrors) {
        ToastCenter.show('Please fill in all team member details correctly.', 'error');
        return;
      }

      // Update payment amount based on single (200) vs dual (300) package
      const size = parseInt(teamSizeSelect.value);
      const pkg = getSelectedPackage();
      const perHead = (pkg === 'dual') ? 300 : 200;
      const total = size * perHead;

      if (paymentTotal) paymentTotal.textContent = `₹${total}`;
      if (paymentCalc) paymentCalc.textContent = `${size} participant${size > 1 ? 's' : ''} × ₹${perHead} (${pkg === 'dual' ? 'Dual Submission' : 'Single Submission'})`;

      section2.classList.remove('active');
      section3.classList.add('active');
      stepCountText.textContent = '3';
      progressFill.style.width = '100%';
      if (stepTitle) stepTitle.textContent = 'Payment';
      SoundEngine.playSuccess();
    });
  }

  // ─── Step 3 ← 2 ──────────────────────────────────────────────────────────
  if (prevBtn3) {
    prevBtn3.addEventListener('click', () => {
      section3.classList.remove('active');
      section2.classList.add('active');
      stepCountText.textContent = '2';
      progressFill.style.width = '66%';
      if (stepTitle) stepTitle.textContent = 'Member Details';
      SoundEngine.playClick();
    });
  }

  // ─── File Drop Zone Interactions ────────────────────────────────────────
  if (fileDropZone && paymentProofInput) {
    paymentProofInput.addEventListener('change', () => {
      const file = paymentProofInput.files[0];
      if (file) {
        if (file.size > 3 * 1024 * 1024) {
          ToastCenter.show('File size exceeds the 3MB limit. Please choose a smaller file.', 'error');
          paymentProofInput.value = '';
          if (fileDropText) fileDropText.textContent = 'Click to upload or drag \u0026 drop';
          fileDropZone.classList.remove('has-file');
          return;
        }
        if (fileDropText) fileDropText.textContent = `\u2713 ${file.name}`;
        fileDropZone.classList.add('has-file');
        fileDropZone.classList.remove('error');
      }
    });

    fileDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropZone.classList.add('dragover');
    });

    fileDropZone.addEventListener('dragleave', () => {
      fileDropZone.classList.remove('dragover');
    });

    fileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        if (file.size > 3 * 1024 * 1024) {
          ToastCenter.show('File size exceeds the 3MB limit. Please choose a smaller file.', 'error');
          return;
        }
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          paymentProofInput.files = dt.files;
          if (fileDropText) fileDropText.textContent = `\u2713 ${file.name}`;
          fileDropZone.classList.add('has-file');
        } catch (err) {
          console.warn('Drag-and-drop DataTransfer not supported:', err);
        }
      }
    });
  }

  // ─── Form Submit (Step 3) ─────────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate payment proof file
    if (!paymentProofInput || !paymentProofInput.files[0]) {
      if (fileDropZone) fileDropZone.classList.add('error');
      ToastCenter.show('Please upload your payment screenshot before submitting.', 'error');
      return;
    }

    if (paymentProofInput.files[0].size > 3 * 1024 * 1024) {
      if (fileDropZone) fileDropZone.classList.add('error');
      ToastCenter.show('Payment screenshot must be smaller than 3MB.', 'error');
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Gather member data
    const teamSize = parseInt(teamSizeSelect.value);
    const members = [];
    for (let i = 1; i <= teamSize; i++) {
      members.push({
        name: document.getElementById(`m${i}_name`).value.trim(),
        college: document.getElementById(`m${i}_college`).value.trim(),
        phone: document.getElementById(`m${i}_phone`).value.trim(),
        email: document.getElementById(`m${i}_email`).value.trim()
      });
    }

    const teamName = document.getElementById('teamName').value.trim();
    const email = document.getElementById('email').value.trim();
    const pkg = getSelectedPackage();
    const selectedBoxes = Array.from(document.querySelectorAll('input[name="domainsSelected"]:checked'));
    const selectedDomains = selectedBoxes.map(c => c.value);
    const selectedTracks = Array.from(new Set(selectedBoxes.map(c => c.dataset.track)));

    // Build multipart FormData (required for file upload)
    const formData = new FormData();
    formData.append('teamName', teamName);
    formData.append('college', document.getElementById('college').value.trim());
    formData.append('orgType', document.getElementById('orgType')?.value || '');
    formData.append('teamLeader', document.getElementById('teamLeader').value.trim());
    formData.append('email', email);
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('teamSize', teamSize);
    formData.append('submissionType', pkg);
    formData.append('domain', JSON.stringify(selectedDomains));
    formData.append('tracks', JSON.stringify(selectedTracks));
    formData.append('members', JSON.stringify(members));
    formData.append('paymentProof', paymentProofInput.files[0]);

    fetch('/api/register', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || 'Server error occurred');
          });
        }
        return response.json();
      })
      .then(res => {
        form.style.display = 'none';
        document.getElementById('successTeamName').textContent = teamName;
        document.getElementById('successLeaderEmail').textContent = email;
        successOverlay.classList.add('active');
        SoundEngine.playSuccess();
        ToastCenter.show(`Team ${teamName} registered successfully!`, 'success');
      })
      .catch(err => {
        console.error('Registration API Error:', err);
        SoundEngine.playSynthSound(150, 0.15, 'sawtooth');
        ToastCenter.show(`Registration failed: ${err.message}`, 'error');
      })
      .finally(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      });
  });

  // ─── Reset Form ──────────────────────────────────────────────────────────
  document.getElementById('resetFormBtn').addEventListener('click', () => {
    form.reset();
    
    updateRegistrationStatus();
    form.querySelectorAll('.form-group').forEach(g => g.className = 'form-group');
    
    // Back to Step 1
    section2.classList.remove('active');
    if (section3) section3.classList.remove('active');
    section1.classList.add('active');
    stepCountText.textContent = '1';
    progressFill.style.width = '33%';
    if (stepTitle) stepTitle.textContent = 'Team Metadata';

    // Reset file upload UI
    if (fileDropZone) fileDropZone.classList.remove('has-file', 'error');
    if (fileDropText) fileDropText.textContent = 'Click to upload or drag \u0026 drop';
    
    successOverlay.classList.remove('active');
    SoundEngine.playClick();
  });
})();

// ==========================================
// 9. FAQ ACCORDION HANDLERS
// ==========================================
(function initFaqAccordion() {
  const triggers = document.querySelectorAll('.faq-trigger');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const accordion = trigger.closest('.faq-accordion');
      if (!accordion) return;

      const isActive = accordion.classList.contains('active');
      
      // Auto collapse other FAQ sections
      document.querySelectorAll('.faq-accordion').forEach(acc => {
        acc.classList.remove('active');
      });

      if (!isActive) {
        accordion.classList.add('active');
        SoundEngine.playClick();
      } else {
        SoundEngine.playClick();
      }
    });
  });
})();

// ==========================================
// 10. GENERAL SCROLL UTILITIES (Scrollspy & Navbar Glass)
// ==========================================
(function initScrollSpyNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!navbar || !navLinks || !hamburger) return;
  const allNavItems = navLinks.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id]');

  // Scroll effect on Navbar
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Hamburger mobile menu toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
    SoundEngine.playClick();
  });

  // Close mobile menu on links click
  allNavItems.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Close hamburger menu on window resize (Scenario 5 recovery)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });

  // Scrollspy logic
  function highlightNavspy() {
    if (!document.getElementById('hero')) return;
    const scrollY = window.scrollY + 120;
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      
      const link = navLinks.querySelector(`.nav-item[href="#${id}"]`);
      if (link) {
        link.classList.toggle('active', scrollY >= top && scrollY < top + height);
      }
    });
  }

  window.addEventListener('scroll', highlightNavspy);
  highlightNavspy(); // initial run
})();

// ==========================================
// 11. AUDIO MUTING CONTROLLER
// ==========================================
(function initAudioToggle() {
  const desktopBtn = document.getElementById('audioToggleBtn');
  const mobileBtn = document.getElementById('audioToggleBtnMobile');

  function updateVisuals() {
    const icon = window.sfxEnabled ? '🔊' : '🔇';
    const text = window.sfxEnabled ? 'Sound: On' : 'Sound: Off';

    if (desktopBtn) {
      desktopBtn.querySelector('.audio-icon').textContent = icon;
      desktopBtn.querySelector('.audio-text').textContent = text;
      desktopBtn.classList.toggle('muted', !window.sfxEnabled);
    }
    if (mobileBtn) {
      mobileBtn.querySelector('.audio-icon').textContent = icon;
      mobileBtn.classList.toggle('muted', !window.sfxEnabled);
    }
  }

  function toggleMute() {
    window.sfxEnabled = !window.sfxEnabled;
    updateVisuals();
    if (window.sfxEnabled) {
      SoundEngine.playClick();
    }
  }

  if (desktopBtn) desktopBtn.addEventListener('click', toggleMute);
  if (mobileBtn) mobileBtn.addEventListener('click', toggleMute);

  // Initial update
  updateVisuals();
})();

// ==========================================
// 12. SCROLL REVEAL OBSERVER
// ==========================================
(function initRevealObserver() {
  const elements = document.querySelectorAll('.reveal');

  if (!("IntersectionObserver" in window)) {
    // Feature detect fallback for old browsers
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire-once rule
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

// ==========================================
// 13. CLIPPBOARD COPY DETAILS
// ==========================================
(function initContactCopy() {
  const emailBlock = document.getElementById('contactEmail');
  const locationBlock = document.getElementById('contactLocation');

  if (emailBlock) {
    emailBlock.addEventListener('click', () => {
      navigator.clipboard.writeText('rushhour2026.sathyabama@gmail.com').then(() => {
        ToastCenter.show('Official email address copied to clipboard!', 'success');
      }).catch(() => {
        ToastCenter.show('Could not copy to clipboard. Email: rushhour2026.sathyabama@gmail.com', 'error');
      });
    });
  }

  if (locationBlock) {
    locationBlock.addEventListener('click', () => {
      navigator.clipboard.writeText('Sathyabama Institute of Science and Technology, Chennai, India').then(() => {
        ToastCenter.show('Venue location address copied to clipboard!', 'success');
      }).catch(() => {
        ToastCenter.show('Could not copy to clipboard.', 'error');
      });
    });
  }
})();

// ==========================================
// 14. SMOOTH PERSPECTIVE TILT FOR PRIZE CARDS
// ==========================================
(function initPrizeTilt() {
  const cards = document.querySelectorAll('[data-tilt]');

  if (window.innerWidth < 768) return; // Disallow on tablets/phones

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Limit the angle bounds
      const maxTilt = 12; // tilt degrees limit
      const rotateX = -((y - centerY) / centerY) * maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) translateY(0) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
  });
})();

// ==========================================
// 15. STATS COUNTER ANIMATION
// ==========================================
(function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  
  if (!("IntersectionObserver" in window)) {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      const isCurrency = stat.closest('#stat-prizes') !== null;
      stat.textContent = isCurrency ? '₹' + target.toLocaleString() : target;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stat = entry.target;
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const start = performance.now();
        const isCurrency = stat.closest('#stat-prizes') !== null;
        
        function updateCounter(currentTime) {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out quad
          const easeProgress = progress * (2 - progress);
          const currentVal = Math.floor(easeProgress * target);
          
          if (isCurrency) {
            stat.textContent = '₹' + currentVal.toLocaleString();
          } else {
            stat.textContent = currentVal;
          }
          
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            stat.textContent = isCurrency ? '₹' + target.toLocaleString() : target;
          }
        }
        
        requestAnimationFrame(updateCounter);
        observer.unobserve(stat); // Only animate once
      }
    });
  }, { threshold: 0.1 });

  statNumbers.forEach(stat => observer.observe(stat));
})();

// ==========================================
// 17. MOBILE NAVIGATION DROPDOWN TOGGLE
// ==========================================
(function initNavDropdown() {
  const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
  const dropdownWrapper = document.querySelector('.nav-dropdown-wrapper');

  if (dropdownTrigger && dropdownWrapper) {
    dropdownTrigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 991) {
        e.preventDefault();
        dropdownWrapper.classList.toggle('active');
      }
    });
  }
})();

// ==========================================
// 18. ACCOMMODATION BOOKING SYSTEM CONTROLLER
// ==========================================
(function initAccommodationBooking() {
  const form = document.getElementById('accommodationForm');
  if (!form) return;

  const searchQuery = document.getElementById('searchQuery');
  const searchTeamId = document.getElementById('searchTeamId');
  const searchTeamBtn = document.getElementById('searchTeamBtn');
  const foundTeamCard = document.getElementById('foundTeamCard');
  const foundTeamName = document.getElementById('foundTeamName');
  const foundLeaderEmail = document.getElementById('foundLeaderEmail');

  const toStep2Btn = document.getElementById('toStep2Btn');
  const toStep3Btn = document.getElementById('toStep3Btn');
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  const backToStep2Btn = document.getElementById('backToStep2Btn');
  const submitBtn = document.getElementById('submitBtn');

  const section1 = document.getElementById('formSection1');
  const section2 = document.getElementById('formSection2');
  const section3 = document.getElementById('formSection3');

  const stepCountText = document.getElementById('formStepCount');
  const stepTitle = document.getElementById('formStepTitle');
  const progressFill = document.getElementById('formProgressFill');

  const boysSlotsText = document.getElementById('boysSlotsLeft');
  const girlsSlotsText = document.getElementById('girlsSlotsLeft');
  const membersContainer = document.getElementById('membersContainer');
  const accomodationSummary = document.getElementById('accomodationSummary');

  const paymentProofInput = document.getElementById('paymentProof');
  const fileDropZone = document.getElementById('fileDropZone');
  const fileDropText = document.getElementById('fileDropText');
  const formSuccess = document.getElementById('formSuccess');

  const suggestionsDropdown = document.getElementById('suggestionsDropdown');

  let currentTeam = null;
  let remainingBoys = 30;
  let remainingGirls = 30;

  // Search autocomplete / suggestions logic
  let debounceTimeout = null;

  const fetchAndShowSuggestions = async (value) => {
    try {
      const res = await fetch(`/api/accommodation/suggestions?q=${encodeURIComponent(value)}`);
      const suggestions = await res.json();

      if (res.ok && suggestions.length > 0) {
        suggestionsDropdown.innerHTML = suggestions.map(s => `
          <div class="suggestion-item" data-team="${s.team_name.replace(/"/g, '&quot;')}">
            <strong style="color: white;">${s.team_name}</strong>
            <span style="font-size: 0.8rem; color: var(--white-40); display: block;">Leader: ${s.leader_email}</span>
          </div>
        `).join('');
        suggestionsDropdown.style.display = 'block';

        // Click handler for suggestion items
        suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            searchQuery.value = item.getAttribute('data-team');
            suggestionsDropdown.style.display = 'none';
            suggestionsDropdown.innerHTML = '';
            // Trigger search automatically
            searchTeamBtn.click();
          });
        });
      } else {
        suggestionsDropdown.style.display = 'none';
        suggestionsDropdown.innerHTML = '';
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  searchQuery.addEventListener('focus', () => {
    fetchAndShowSuggestions(searchQuery.value.trim());
  });

  searchQuery.addEventListener('click', (e) => {
    e.stopPropagation();
    fetchAndShowSuggestions(searchQuery.value.trim());
  });

  searchQuery.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchAndShowSuggestions(searchQuery.value.trim());
    }, 200);
  });

  const toggleArrow = document.getElementById('toggleDropdownArrow');
  if (toggleArrow) {
    toggleArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      if (suggestionsDropdown.style.display === 'block') {
        suggestionsDropdown.style.display = 'none';
      } else {
        fetchAndShowSuggestions(searchQuery.value.trim());
      }
    });
  }

  // Hide suggestions dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (suggestionsDropdown && e.target !== searchQuery && e.target !== suggestionsDropdown && !suggestionsDropdown.contains(e.target)) {
      suggestionsDropdown.style.display = 'none';
    }
  });

  // Search Team
  searchTeamBtn.addEventListener('click', async () => {
    const query = searchQuery.value.trim();
    const teamIdVal = searchTeamId.value.trim();
    
    if (!query) {
      ToastCenter.show('Please enter a team name or email address.', 'error');
      return;
    }
    if (!teamIdVal) {
      ToastCenter.show('Please enter your Team ID (e.g. RH-0018).', 'error');
      return;
    }

    searchTeamBtn.disabled = true;
    searchTeamBtn.textContent = 'Searching...';

    try {
      const res = await fetch(`/api/accommodation/team?query=${encodeURIComponent(query)}&teamId=${encodeURIComponent(teamIdVal)}`);
      const data = await res.json();

      if (res.ok && data.id) {
        if (data.existingBooking) {
          ToastCenter.show(`This team already has an accommodation request (${data.existingBooking.status}).`, 'error');
          foundTeamCard.style.display = 'none';
          toStep2Btn.classList.add('disabled');
          toStep2Btn.disabled = true;
          return;
        }

        currentTeam = data;
        foundTeamName.textContent = data.team_name;
        foundLeaderEmail.textContent = data.leader_email;
        foundTeamCard.style.display = 'block';
        toStep2Btn.classList.remove('disabled');
        toStep2Btn.disabled = false;
        ToastCenter.show('Team found! Proceed to member selection.', 'success');
      } else {
        ToastCenter.show(data.error || 'Team not found or registration is not verified.', 'error');
        foundTeamCard.style.display = 'none';
        toStep2Btn.classList.add('disabled');
        toStep2Btn.disabled = true;
      }
    } catch (err) {
      console.error(err);
      ToastCenter.show('Connection error occurred.', 'error');
    } finally {
      searchTeamBtn.disabled = false;
      searchTeamBtn.textContent = 'Search';
    }
  });

  // Step transitions
  toStep2Btn.addEventListener('click', async () => {
    if (!currentTeam) return;
    
    // Fetch latest capacity status
    try {
      const res = await fetch('/api/accommodation/status');
      const data = await res.json();
      if (res.ok) {
        remainingBoys = data.boysRemaining;
        remainingGirls = data.girlsRemaining;
        boysSlotsText.textContent = remainingBoys;
        girlsSlotsText.textContent = remainingGirls;
      }
    } catch (err) {
      console.error('Failed to get status:', err);
    }

    renderMembersList();

    section1.classList.remove('active');
    section2.classList.add('active');
    stepCountText.textContent = '2';
    progressFill.style.width = '66%';
    if (stepTitle) stepTitle.textContent = 'Select Members';
    SoundEngine.playClick();
  });

  backToStep1Btn.addEventListener('click', () => {
    section2.classList.remove('active');
    section1.classList.add('active');
    stepCountText.textContent = '1';
    progressFill.style.width = '33%';
    if (stepTitle) stepTitle.textContent = 'Lookup Team';
    SoundEngine.playClick();
  });

  toStep3Btn.addEventListener('click', () => {
    // Check if any member selected
    const selectedRows = membersContainer.querySelectorAll('.accommodation-member-row.selected');
    if (selectedRows.length === 0) {
      ToastCenter.show('Please select at least one member requiring accommodation.', 'error');
      return;
    }

    // Validate that a gender is explicitly selected for each checked member
    for (let row of selectedRows) {
      const idx = row.getAttribute('data-index');
      const genderSelect = row.querySelector(`#m_${idx}_gender`);
      if (!genderSelect.value) {
        const name = row.querySelector('label strong').textContent;
        ToastCenter.show(`Please select a gender for ${name}.`, 'error');
        return;
      }
    }

    accomodationSummary.textContent = `For ${selectedRows.length} team member(s)`;

    section2.classList.remove('active');
    section3.classList.add('active');
    stepCountText.textContent = '3';
    progressFill.style.width = '100%';
    if (stepTitle) stepTitle.textContent = 'Payment';
    SoundEngine.playSuccess();
  });

  backToStep2Btn.addEventListener('click', () => {
    section3.classList.remove('active');
    section2.classList.add('active');
    stepCountText.textContent = '2';
    progressFill.style.width = '66%';
    if (stepTitle) stepTitle.textContent = 'Select Members';
    SoundEngine.playClick();
  });

  // Render members in step 2
  function renderMembersList() {
    membersContainer.innerHTML = '';
    const roster = currentTeam.members || [];

    roster.forEach((m, idx) => {
      const row = document.createElement('div');
      row.className = 'accommodation-member-row';
      row.setAttribute('data-index', idx);

      row.innerHTML = `
        <div class="member-select-chk">
          <input type="checkbox" id="m_${idx}_chk" />
          <label for="m_${idx}_chk" style="margin: 0; cursor: pointer;">
            <strong style="color: white;">${m.name}</strong>
            <span style="font-size: 0.8rem; color: var(--white-60); display: block;">${m.college || currentTeam.college}</span>
          </label>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <select id="m_${idx}_gender" class="member-gender-select" disabled>
            <option value="" disabled selected>Select Gender</option>
            <option value="boy">Boy ♂</option>
            <option value="girl">Girl ♀</option>
          </select>
        </div>
      `;

      const chk = row.querySelector(`#m_${idx}_chk`);
      const genderSelect = row.querySelector(`#m_${idx}_gender`);

      chk.addEventListener('change', () => {
        if (chk.checked) {
          row.classList.add('selected');
          genderSelect.disabled = false;
        } else {
          row.classList.remove('selected');
          genderSelect.disabled = true;
        }
        validateCapacityLimits();
      });

      genderSelect.addEventListener('change', () => {
        validateCapacityLimits();
      });

      membersContainer.appendChild(row);
    });

    validateCapacityLimits();
  }

  // Real-time capacity enforcement
  function validateCapacityLimits() {
    const selectedRows = membersContainer.querySelectorAll('.accommodation-member-row');
    
    let currentSelectedBoys = 0;
    let currentSelectedGirls = 0;

    selectedRows.forEach(row => {
      const chk = row.querySelector('input[type="checkbox"]');
      const gender = row.querySelector('.member-gender-select').value;
      if (chk.checked) {
        if (gender === 'boy') currentSelectedBoys++;
        else if (gender === 'girl') currentSelectedGirls++;
      }
    });

    const boysRemainingDynamic = remainingBoys - currentSelectedBoys;
    const girlsRemainingDynamic = remainingGirls - currentSelectedGirls;

    boysSlotsText.textContent = Math.max(0, boysRemainingDynamic);
    girlsSlotsText.textContent = Math.max(0, girlsRemainingDynamic);

    // Disable unselected checkboxes if capacity is reached
    selectedRows.forEach(row => {
      const chk = row.querySelector('input[type="checkbox"]');
      const genderSelect = row.querySelector('.member-gender-select');
      const label = row.querySelector('label');

      if (!chk.checked) {
        const gender = genderSelect.value;
        if (gender === 'boy' && boysRemainingDynamic <= 0) {
          chk.disabled = true;
          label.style.opacity = '0.5';
          row.style.opacity = '0.5';
        } else if (gender === 'girl' && girlsRemainingDynamic <= 0) {
          chk.disabled = true;
          label.style.opacity = '0.5';
          row.style.opacity = '0.5';
        } else {
          chk.disabled = false;
          label.style.opacity = '1';
          row.style.opacity = '1';
        }
      } else {
        chk.disabled = false;
        label.style.opacity = '1';
        row.style.opacity = '1';
      }
    });
  }

  // File drop/upload
  if (fileDropZone && paymentProofInput) {
    paymentProofInput.addEventListener('change', () => {
      const file = paymentProofInput.files[0];
      if (file) {
        if (file.size > 3 * 1024 * 1024) {
          ToastCenter.show('File size exceeds the 3MB limit. Please choose a smaller file.', 'error');
          paymentProofInput.value = '';
          if (fileDropText) fileDropText.textContent = 'Click to upload or drag \u0026 drop';
          fileDropZone.classList.remove('has-file');
          return;
        }
        if (fileDropText) fileDropText.textContent = `✓ ${file.name}`;
        fileDropZone.classList.add('has-file');
      }
    });

    fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('drag-over'); });
    fileDropZone.addEventListener('dragleave', () => { fileDropZone.classList.remove('drag-over'); });
    fileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type.match('image.*')) {
          paymentProofInput.files = e.dataTransfer.files;
          paymentProofInput.dispatchEvent(new Event('change'));
        } else {
          ToastCenter.show('Only image files (JPG, PNG, WEBP) are supported.', 'error');
        }
      }
    });
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = paymentProofInput.files[0];
    if (!file) {
      ToastCenter.show('Please upload a screenshot of your payment.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    const selectedRows = membersContainer.querySelectorAll('.accommodation-member-row.selected');
    const bookedMembers = [];

    selectedRows.forEach(row => {
      const idx = row.getAttribute('data-index');
      const memberData = currentTeam.members[idx];
      const gender = row.querySelector('.member-gender-select').value;
      bookedMembers.push({
        name: memberData.name,
        email: memberData.email,
        college: memberData.college || currentTeam.college,
        gender: gender
      });
    });

    const formData = new FormData();
    formData.append('registrationId', currentTeam.id);
    formData.append('teamName', currentTeam.team_name);
    formData.append('leaderEmail', currentTeam.leader_email);
    formData.append('bookedMembers', JSON.stringify(bookedMembers));
    formData.append('paymentProof', file);

    try {
      const res = await fetch('/api/accommodation/book', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        SoundEngine.playSuccess();
        form.style.display = 'none';
        document.getElementById('successTeamName').textContent = currentTeam.team_name;
        document.getElementById('successLeaderEmail').textContent = currentTeam.leader_email;
        formSuccess.style.display = 'block';
        ToastCenter.show('Accommodation request sent successfully!', 'success');
      } else {
        ToastCenter.show(data.error || 'Failed to submit accommodation request.', 'error');
      }
    } catch (err) {
      console.error(err);
      ToastCenter.show('Connection error submitting booking.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });

  // Handle prefilled team query param
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledTeam = urlParams.get('team');
  if (prefilledTeam) {
    searchQuery.value = prefilledTeam;
    setTimeout(() => {
      if (searchTeamId) searchTeamId.focus();
    }, 400);
  }
})();

// Hero Search Autocomplete for Accommodation
(function initHeroSearch() {
  const heroSearchInput = document.getElementById('heroSearchQuery');
  const heroSuggestionsDropdown = document.getElementById('heroSuggestionsDropdown');
  const heroBookBtn = document.getElementById('heroBookBtn');

  if (!heroSearchInput) return;

  let debounceTimeout = null;

  const fetchAndShowHeroSuggestions = async (value) => {
    try {
      const res = await fetch(`/api/accommodation/suggestions?q=${encodeURIComponent(value)}`);
      const suggestions = await res.json();

      if (res.ok && suggestions.length > 0) {
        heroSuggestionsDropdown.innerHTML = suggestions.map(s => `
          <div class="suggestion-item" data-team="${s.team_name.replace(/"/g, '&quot;')}">
            <strong style="color: white;">${s.team_name}</strong>
            <span style="font-size: 0.8rem; color: var(--white-40); display: block;">Leader: ${s.leader_email}</span>
          </div>
        `).join('');
        heroSuggestionsDropdown.style.display = 'block';

        // Click handler for suggestion items
        heroSuggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            heroSearchInput.value = item.getAttribute('data-team');
            heroSuggestionsDropdown.style.display = 'none';
            heroSuggestionsDropdown.innerHTML = '';
            // Redirect to accommodation page with team prefilled
            window.location.href = `accommodation.html?team=${encodeURIComponent(heroSearchInput.value)}`;
          });
        });
      } else {
        heroSuggestionsDropdown.style.display = 'none';
        heroSuggestionsDropdown.innerHTML = '';
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  heroSearchInput.addEventListener('focus', () => {
    fetchAndShowHeroSuggestions(heroSearchInput.value.trim());
  });

  heroSearchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    fetchAndShowHeroSuggestions(heroSearchInput.value.trim());
  });

  heroSearchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchAndShowHeroSuggestions(heroSearchInput.value.trim());
    }, 200);
  });

  const toggleHeroArrow = document.getElementById('toggleHeroDropdownArrow');
  if (toggleHeroArrow) {
    toggleHeroArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      if (heroSuggestionsDropdown.style.display === 'block') {
        heroSuggestionsDropdown.style.display = 'none';
      } else {
        fetchAndShowHeroSuggestions(heroSearchInput.value.trim());
      }
    });
  }

  // Hide dropdown on click outside
  document.addEventListener('click', (e) => {
    if (heroSuggestionsDropdown && e.target !== heroSearchInput && e.target !== heroSuggestionsDropdown && !heroSuggestionsDropdown.contains(e.target)) {
      heroSuggestionsDropdown.style.display = 'none';
    }
  });

  if (heroBookBtn) {
    heroBookBtn.addEventListener('click', () => {
      const val = heroSearchInput.value.trim();
      if (val) {
        window.location.href = `accommodation.html?team=${encodeURIComponent(val)}`;
      } else {
        window.location.href = 'accommodation.html';
      }
    });
  }
})();


