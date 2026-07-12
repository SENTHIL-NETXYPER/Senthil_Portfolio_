// ==========================================================================
// PRELOADER — CURTAIN SPLIT OPEN ON PAGE LOAD
// ==========================================================================
(function () {
  const preloader    = document.getElementById('preloader');
  const preloaderLogo= document.getElementById('preloader-logo');
  const body         = document.body;
  const HOLD_TIME    = 1200;
  const ANIM_TIME    = 900;

  function dismissPreloader() {
    if (preloaderLogo) preloaderLogo.style.opacity = '0';
    setTimeout(() => {
      if (preloader) preloader.classList.add('is-done');
      body.classList.remove('is-loading');
      setTimeout(() => {
        if (preloader)     preloader.style.display = 'none';
        if (preloaderLogo) preloaderLogo.style.display = 'none';
        triggerHeroEntrance();
      }, ANIM_TIME + 50);
    }, 380);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(dismissPreloader, HOLD_TIME));
  } else {
    setTimeout(dismissPreloader, HOLD_TIME);
  }
})();

// ==========================================================================
// HERO ENTRANCE — slide letters up after preloader
// ==========================================================================
function triggerHeroEntrance() {
  const heroSection = document.getElementById('home');
  if (heroSection) heroSection.classList.add('hero-entered');
}

// ==========================================================================
// UNIFIED WHOLE-PAGE SCROLL-DRIVEN ANIMATION ENGINE
// Every animation on every section is driven by scroll position via RAF.
// ==========================================================================
function initWholePageScrollAnimations() {
  const ease  = t => 1 - Math.pow(1 - t, 3);

  // 0. Realtime Portfolio Count Update
  const statsTotalVal = document.getElementById('stats-total-projects');
  if (statsTotalVal) {
    const projectCount = document.querySelectorAll('.project-card').length;
    if (projectCount > 0) {
      statsTotalVal.textContent = `${projectCount}+`;
    }
  }

  // 1. LERP-based Scroll Reveal Engine
  const revealElements = [...document.querySelectorAll('.reveal, .reveal-line, .reveal-fade, .reveal-stagger > *')];
  const progressMap = new WeakMap();

  revealElements.forEach(el => {
    progressMap.set(el, { current: 0, target: 0 });
    el.style.transition = 'none'; // Disable CSS transitions to avoid animation fights
    el.style.opacity = '0';
    
    let initialTransform = 'translateY(40px)';
    if (el.classList.contains('reveal-left')) {
      initialTransform = 'translateX(-52px)';
    } else if (el.classList.contains('reveal-right')) {
      initialTransform = 'translateX(52px)';
    } else if (el.classList.contains('reveal-scale')) {
      initialTransform = 'scale(0.92) translateY(24px)';
    }
    el.style.transform = initialTransform;
  });

  function getTargetProgress(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    
    let staggerDelay = 0;
    if (el.parentElement && el.parentElement.classList.contains('reveal-stagger')) {
      const siblings = Array.from(el.parentElement.children).filter(child => {
        return child.classList.contains('process-step') || 
               child.classList.contains('project-card') || 
               child.classList.contains('why-feature-row') || 
               child.classList.contains('testimonial-card') ||
               child.classList.contains('contact-action-col') ||
               child.matches('.reveal, .reveal-line, .reveal-fade, .reveal-scale');
      });
      const idx = siblings.indexOf(el);
      if (idx !== -1) {
        const parent = el.parentElement;
        if (parent.classList.contains('projects-grid') || parent.classList.contains('testimonials-grid')) {
          // 2-column grid: stagger horizontally only, do not accumulate vertically
          staggerDelay = (idx % 2) * 50;
        } else if (parent.classList.contains('process-timeline')) {
          // 4-column horizontal timeline
          staggerDelay = idx * 40;
        } else if (parent.classList.contains('contact-action-columns')) {
          // 3-column contact grid
          staggerDelay = (idx % 3) * 40;
        } else {
          // Vertical layout: small sequence stagger
          staggerDelay = Math.min(2, idx) * 30;
        }
      }
    }

    const virtualTop = rect.top + staggerDelay;
    
    // Snappy scroll triggers: start fade 5% before entering screen, full solid 25% up
    const start = vh * 1.05;
    const end = vh * 0.75;

    if (virtualTop > start) return 0;
    if (virtualTop < end) return 1;
    return (start - virtualTop) / (start - end);
  }

  function tick() {
    revealElements.forEach(el => {
      const state = progressMap.get(el);
      if (!state) return;

      const target = getTargetProgress(el);
      state.target = target;

      // Smooth LERP interpolation (8% catch-up speed)
      state.current += (state.target - state.current) * 0.08;

      // Apply opacity
      el.style.opacity = state.current.toFixed(3);

      // Apply transform based on element reveal type
      if (el.classList.contains('reveal-left')) {
        el.style.transform = `translateX(${(1 - state.current) * -52}px)`;
      } else if (el.classList.contains('reveal-right')) {
        el.style.transform = `translateX(${(1 - state.current) * 52}px)`;
      } else if (el.classList.contains('reveal-scale')) {
        el.style.transform = `scale(${0.92 + (1 - 0.92) * state.current}) translateY(${(1 - state.current) * 24}px)`;
      } else {
        el.style.transform = `translateY(${(1 - state.current) * 40}px)`;
      }
    });

    // 2. Process Timeline line fill and step text lighting
    const processTimeline = document.querySelector('.process-timeline');
    const processLineFill = document.getElementById('process-line-fill');
    const processSteps = document.querySelectorAll('.process-step');
    if (processTimeline) {
      const rect = processTimeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.95;
      const end = vh * 0.25;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

      if (processLineFill) {
        processLineFill.style.width = `${progress * 100}%`;
      }

      const thresholds = [0.05, 0.35, 0.65, 0.9];
      processSteps.forEach((step, idx) => {
        if (progress >= thresholds[idx]) {
          step.classList.add('step-lit');
        } else {
          step.classList.remove('step-lit');
        }
      });
    }

    // 3. Hero Parallax scroll effect
    const heroSection = document.getElementById('home');
    const heroTitle = document.querySelector('.hero-visual-title');
    const heroInfoRow = document.querySelector('.hero-info-row');
    const heroScroll = document.querySelector('.scroll-indicator');
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      if (rect.bottom >= 0) {
        const scrollOut = Math.max(0, Math.min(1, -rect.top / window.innerHeight));
        if (heroTitle) {
          heroTitle.style.transform = `translateY(${scrollOut * -70}px)`;
          heroTitle.style.opacity = (1 - scrollOut * 1.8).toFixed(2);
        }
        if (heroInfoRow) {
          heroInfoRow.style.transform = `translateY(${scrollOut * 35}px)`;
          heroInfoRow.style.opacity = (1 - scrollOut * 2.2).toFixed(2);
        }
        if (heroScroll) {
          heroScroll.style.opacity = (1 - scrollOut * 5).toFixed(2);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // 4. Stats counters Observer (runs independently once when intersecting)
  const counted = new WeakSet();
  function runCounter(el, target, suffix, dur = 1400) {
    const t0 = performance.now();
    const step = now => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      el.textContent = Math.floor(ease(p) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const vEl = entry.target;
        if (!counted.has(vEl)) {
          counted.add(vEl);
          const raw = vEl.textContent;
          const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
          const sfx = raw.replace(/[0-9.]/g, '').trim();
          runCounter(vEl, num, sfx);
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.stats-value').forEach(el => statsObserver.observe(el));

  requestAnimationFrame(tick);
} // end initWholePageScrollAnimations






// ==========================================================================
// MAIN DOM READY HANDLER (original code follows)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initWholePageScrollAnimations();


  // ==========================================================================
  // DYNAMIC HEADER SECTION TRACKER (SCROLL SPY)
  // ==========================================================================
  const sections = document.querySelectorAll('section[id], header');
  const activeSectionName = document.getElementById('active-section-name');

  const sectionNamesMap = {
    'home': 'HOME',
    'about': 'ABOUT ME',
    'services': 'SERVICES',
    'technologies': 'MY TOOLKIT',
    'portfolio': 'DIGITAL PORTFOLIO',
    'process': 'WORKFLOW',
    'testimonials': 'CLIENT FEEDBACK',
    'contact': 'CONTACT'
  };

  const scrollSpy = () => {
    let currentSectionId = 'home';
    const scrollPosition = window.scrollY + 180; // Trigger offset

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const id = section.getAttribute('id');

      if (id && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = id;
      }
    });

    if (activeSectionName) {
      activeSectionName.innerText = sectionNamesMap[currentSectionId] || currentSectionId.toUpperCase();
    }
  };

  window.addEventListener('scroll', scrollSpy);
  scrollSpy(); // Run initially

  // ==========================================================================
  // INTERACTIVE SERVICES MENU TRANSITIONS
  // ==========================================================================
  const servicesData = [
    {
      title: "Intelligent<br>Context,<br>Semantic<br>Search",
      desc: "Designing and deploying robust Retrieval-Augmented Generation (RAG) systems over massive document libraries. Implementing dense and keyword hybrid retrieval, vector indexing, and multilingual capabilities to provide accurate, context-aware AI outputs.",
      tags: ["LangChain", "FAISS", "ChromaDB", "Multilingual NLP", "NER Anonymization", "OpenAI / Claude APIs"],
      bgImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200"
    },
    {
      title: "High<br>Performance,<br>Asynchronous<br>Services",
      desc: "Building high-performance REST APIs and microservices to serve machine learning models and data extraction pipelines. Writing type-safe Python code with Pydantic, designing asynchronous tasks, and integrating third-party database systems.",
      tags: ["Python", "FastAPI", "REST API", "Pydantic", "Docker", "Convex (BaaS)"],
      bgImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200"
    },
    {
      title: "Zero<br>Friction,<br>Accelerated<br>Pipelines",
      desc: "Automating manual data entry, page scraping, and system verification tasks. Building playbooks that bypass CAPTCHAs, interact with complex web portals, and orchestrate serverless workflow schedules.",
      tags: ["Playwright", "ddddocr (CAPTCHA Auto)", "n8n", "Google API Integrations", "Email Automation"],
      bgImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200"
    },
    {
      title: "Predictive<br>Modeling,<br>Analytical<br>Insights",
      desc: "Cleaning and analyzing structured and unstructured data, running statistical modeling, and deploying standard NLP algorithms. Creating custom dashboards and analytical tools to extract actionable insights.",
      tags: ["Machine Learning", "NLP", "SQL", "Pandas", "NumPy", "Streamlit"],
      bgImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200"
    }
  ];

  const serviceButtons = document.querySelectorAll('.service-menu-item');
  const previewBg = document.getElementById('services-preview-bg');
  const previewTitle = document.getElementById('services-preview-title');
  const previewDesc = document.getElementById('services-preview-desc');
  const previewTags = document.getElementById('services-preview-tags');

  // Set transition styles programmatically to keep CSS simple
  if (previewTitle && previewDesc && previewTags) {
    previewTitle.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    previewDesc.style.transition = 'opacity 0.25s ease';
    previewTags.style.transition = 'opacity 0.25s ease';
  }

  const updateServicePreview = (index) => {
    const data = servicesData[index];
    if (!data) return;

    // Fade out preview content
    previewTitle.style.opacity = 0;
    previewTitle.style.transform = 'translateY(10px)';
    previewDesc.style.opacity = 0;
    previewTags.style.opacity = 0;

    setTimeout(() => {
      // Update background and texts
      if (previewBg) {
        previewBg.style.backgroundImage = `url('${data.bgImage}')`;
      }
      previewTitle.innerHTML = data.title;
      previewDesc.innerText = data.desc;

      // Rebuild tags list
      previewTags.innerHTML = '';
      data.tags.forEach(tag => {
        const span = document.createElement('span');
        span.innerText = tag;
        previewTags.appendChild(span);
      });

      // Fade in preview content
      previewTitle.style.opacity = 1;
      previewTitle.style.transform = 'translateY(0)';
      previewDesc.style.opacity = 1;
      previewTags.style.opacity = 1;

      // Re-trigger hover listeners for cursor follow-up on dynamic elements
      if (typeof updateHoverListeners === 'function') {
        updateHoverListeners();
      }
    }, 250);
  };

  serviceButtons.forEach(btn => {
    const triggerAction = () => {
      // Toggle active states on menu items
      serviceButtons.forEach(otherBtn => {
        otherBtn.classList.remove('active');
        const icon = otherBtn.querySelector('.menu-item-icon');
        if (icon) {
          icon.style.transform = 'translateY(0)';
        }
      });
      btn.classList.add('active');
      
      const serviceIndex = parseInt(btn.getAttribute('data-service'), 10);
      updateServicePreview(serviceIndex);
    };

    // Trigger on click
    btn.addEventListener('click', triggerAction);
    
    // Trigger on hover for desktop fluidity
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        triggerAction();
      }
    });
  });

  // ==========================================================================
  // CUSTOM CURSOR SMOOTHING & LERP TRAIL
  // ==========================================================================
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('custom-cursor-follower');

  let mouseX = 0;
  let mouseY = 0;
  let followerX = 0;
  let followerY = 0;

  let targetScale = 1;
  let followerScale = 1;
  let targetDotScale = 1;
  let dotScale = 1;

  if (cursor && follower) {
    let firstMove = true;

    // Detect mouse coordinates
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      if (firstMove) {
        followerX = mouseX;
        followerY = mouseY;
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
        firstMove = false;
      }
    });

    // Linear Interpolation (lerp) tracking animation loop
    const renderCursor = () => {
      if (!firstMove) {
        // trailing circle catches up by 12% distance per frame
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;

        // Smoothly interpolate size scale changes
        followerScale += (targetScale - followerScale) * 0.15;
        dotScale += (targetDotScale - dotScale) * 0.15;

        // Position the small core dot
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`;

        // Position the trailing follower circle
        follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%) scale(${followerScale})`;
      }

      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    // Hover state bindings for links and buttons
    const hoverSelectors = 'a, button, .service-menu-item, .services-scroll-btn, .social-icon-btn, .tech-pill, .signature-img';
    
    window.updateHoverListeners = () => {
      const interactiveElements = document.querySelectorAll(hoverSelectors);
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', addCursorHover);
        el.removeEventListener('mouseleave', removeCursorHover);
        
        el.addEventListener('mouseenter', addCursorHover);
        el.addEventListener('mouseleave', removeCursorHover);
      });
    };

    function addCursorHover() {
      targetScale = 1.45;
      targetDotScale = 0;
      follower.classList.add('hover');
    }

    function removeCursorHover() {
      targetScale = 1;
      targetDotScale = 1;
      follower.classList.remove('hover');
    }

    updateHoverListeners();

    // Re-bind hover listeners dynamically if DOM modifications occur
    document.addEventListener('click', () => {
      setTimeout(updateHoverListeners, 150);
    });
  }

  // ==========================================================================
  // PROFESSIONAL 3D PARALLAX & TILT INTERACTIVE ANIMATIONS
  // ==========================================================================
  
  // 1. 3D Tilt Effect for Project Cards
  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    card.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out';
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation angles (subtle max 8 degrees)
      const rotateX = ((centerY - y) / centerY) * 8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.boxShadow = '0 15px 35px rgba(255, 59, 48, 0.12)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.boxShadow = 'none';
    });
  });

  // 2. 3D Parallax Effect for Hero Portrait Image + Cursor-Proximity Title Zoom
  const heroWrapper = document.querySelector('.hero-visual-wrapper');
  const heroPortrait = document.querySelector('.hero-portrait-img');
  const heroTitle = document.querySelector('.hero-visual-title');
  
  if (heroWrapper && heroPortrait) {
    heroPortrait.style.transition = 'transform 0.2s ease-out';
    
    heroWrapper.addEventListener('mousemove', (e) => {
      const rect = heroWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Subtle tilt (max 3 degrees) and position shift (max 12px) — portrait only
      const rotateX = ((centerY - y) / centerY) * 3;
      const rotateY = ((x - centerX) / centerX) * 3;
      const translateX = ((x - centerX) / centerX) * 12;
      const translateY = ((y - centerY) / centerY) * 12;
      
      heroPortrait.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 0)`;
    });
    
    heroWrapper.addEventListener('mouseleave', () => {
      heroPortrait.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      heroPortrait.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    });
  }

  // ===========================================================================
  // CURSOR PROXIMITY REVEAL for hero title (SENTHIL / KUMAR)
  // When cursor approaches: SENTHIL slides LEFT, KUMAR slides RIGHT
  // This reveals the hidden "L" from behind the portrait — portrait untouched.
  // ===========================================================================
  if (heroTitle) {
    const PROXIMITY_NEAR = 0;    // px from edge — full effect at this distance
    const PROXIMITY_FAR  = 280;  // px — effect starts fading in from here

    const senthilWord = heroTitle.querySelector('.hero-reveal-word:first-of-type');
    const kumarWord   = heroTitle.querySelector('.hero-reveal-word:last-of-type');
    const MAX_SLIDE   = 42; // px — how far SENTHIL shifts left (reveals L)

    // Reset letter-spacing to default on all spans
    heroTitle.querySelectorAll('.hero-reveal-word > span').forEach(sp => {
      sp.style.letterSpacing = '';
    });

    window.addEventListener('mousemove', (e) => {
      const rect = heroTitle.getBoundingClientRect();
      const closestX = Math.max(rect.left, Math.min(e.clientX, rect.right));
      const closestY = Math.max(rect.top,  Math.min(e.clientY, rect.bottom));
      const dist = Math.hypot(e.clientX - closestX, e.clientY - closestY);

      // t = 0 when far away, t = 1 when cursor is on/very near the title
      const t = 1 - Math.max(0, Math.min(1, (dist - PROXIMITY_NEAR) / (PROXIMITY_FAR - PROXIMITY_NEAR)));
      const slide = t * MAX_SLIDE;

      if (senthilWord) senthilWord.style.transform = `translateX(${-slide}px)`;
      if (kumarWord)   kumarWord.style.transform   = `translateX(${slide}px)`;
    });
  }

  // ==========================================================================
  // 3D NEURAL NETWORK / PARTICLE WEB CANVAS ANIMATION
  // ==========================================================================
  const aiCanvas = document.getElementById('about-ai-canvas');
  if (aiCanvas) {
    const ctx = aiCanvas.getContext('2d');
    let width = aiCanvas.clientWidth;
    let height = aiCanvas.clientHeight;
    
    // Set internal resolution
    const resizeCanvas = () => {
      width = aiCanvas.clientWidth;
      height = aiCanvas.clientHeight;
      aiCanvas.width = width;
      aiCanvas.height = height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 3D Particles Definition
    const numParticles = 40;
    const particles = [];
    const maxDistance = 110; // link distance
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 350,
        y: (Math.random() - 0.5) * 350,
        z: (Math.random() - 0.5) * 350,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.8
      });
    }
    
    // Rotate coordinates around Y and X axes
    const rotateY = (point, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = point.x * cos - point.z * sin;
      const z = point.z * cos + point.x * sin;
      return { ...point, x, z };
    };
    
    const rotateX = (point, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const y = point.y * cos - point.z * sin;
      const z = point.z * cos + point.y * sin;
      return { ...point, y, z };
    };
    
    let angleY = 0.0015; // slow spin speed
    let angleX = 0.0008;
    
    // Mouse coordinates relative to canvas center
    let mouse = { x: 0, y: 0, active: false };
    const wrapper = document.querySelector('.about-visual-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        mouse.x = e.clientX - rect.left - rect.width / 2;
        mouse.y = e.clientY - rect.top - rect.height / 2;
        mouse.active = true;
      });
      wrapper.addEventListener('mouseleave', () => {
        mouse.active = false;
      });
    }
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update particle positions and rotate in 3D
      const projected = [];
      const fov = 300; // perspective projection field of view
      const centerX = width / 2;
      const centerY = height / 2;
      
      particles.forEach(p => {
        // Move particles in their velocity direction
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        
        // Bounce particles back if they go too far from center
        const boundary = 180;
        if (Math.abs(p.x) > boundary) p.vx *= -1;
        if (Math.abs(p.y) > boundary) p.vy *= -1;
        if (Math.abs(p.z) > boundary) p.vz *= -1;
        
        // Rotate points
        let rotated = rotateY(p, angleY);
        rotated = rotateX(rotated, angleX);
        
        // Dynamic mouse attraction
        if (mouse.active) {
          const dx = mouse.x - rotated.x;
          const dy = mouse.y - rotated.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            rotated.x += (dx / dist) * 0.5;
            rotated.y += (dy / dist) * 0.5;
          }
        }
        
        // Perspective projection: map 3D (x, y, z) to 2D (sx, sy)
        const scale = fov / (fov + rotated.z);
        const sx = centerX + rotated.x * scale;
        const sy = centerY + rotated.y * scale;
        
        projected.push({ sx, sy, scale, z: rotated.z });
      });
      
      // Draw Connections (Lines) based on 3D distance
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          
          // Calculate distance in 3D space
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const dist = Math.hypot(dx, dy, dz);
          
          if (dist < maxDistance) {
            // Draw line
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            
            // Fade lines based on distance and depth (z-coordinate)
            const alpha = (1 - dist / maxDistance) * 0.28 * projected[i].scale;
            ctx.strokeStyle = `rgba(255, 59, 48, ${alpha})`; // Red system accent color
            ctx.lineWidth = 0.8 * projected[i].scale;
            ctx.stroke();
          }
        }
      }
      
      // Draw Nodes (Circles)
      projected.forEach(p => {
        ctx.beginPath();
        // Dot size scales with perspective depth
        const radius = Math.max(0.5, 3.2 * p.scale);
        ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
        
        // Outer glow/gradient for the nodes
        ctx.fillStyle = `rgba(255, 59, 48, ${0.4 + (p.scale * 0.4)})`;
        ctx.fill();
        
        if (p.scale > 0.9) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 59, 48, ${0.12 * p.scale})`;
          ctx.fill();
        }
      });
      
      requestAnimationFrame(render);
    };
    
    render();
  }

  // ==========================================================================
  // GSAP UI SUITE — Interactive Spotlight Glow, 3D Perspective Tilt & Magnetic Pull
  // ==========================================================================
  const gsapCards = document.querySelectorAll('.project-card, .experience-item, .contact-card');
  gsapCards.forEach(card => {
    card.classList.add('gsap-ui-card');
    let spotlight = card.querySelector('.gsap-ui-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.className = 'gsap-ui-spotlight';
      card.appendChild(spotlight);
    }

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update spotlight position
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // 3D Card Tilt Calculation
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg tilt
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale3d(1.015, 1.015, 1.015)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
    });
  });

  // GSAP UI Magnetic Hover Buttons
  const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary');
  magneticBtns.forEach(btn => {
    btn.classList.add('gsap-ui-magnetic');
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
    });
  });

});

/* ==========================================================================
   RESUME MODAL CONTROLS
   ========================================================================== */
window.openResumeModal = function() {
  const modal = document.getElementById('resume-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
};

window.closeResumeModal = function() {
  const modal = document.getElementById('resume-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

// Close modal when pressing ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.closeResumeModal();
  }
});

// Close modal when clicking on background overlay
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('resume-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        window.closeResumeModal();
      }
    });
  }
});
