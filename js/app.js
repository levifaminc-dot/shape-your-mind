/**
 * ShapeUrMind (Shape Your Mind Consult) - Interactive Application Logic
 * Domain: shapeurmind.org
 * Support: +234 806 002 8943
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initNavbarScroll();
  initWellnessAssessment();
  initBreathingWidget();
  initServiceFilters();
  initModals();
  initBookingForms();
  initFaqAccordion();
  initBlogReader();
});

/* ==========================================================================
   1. Navbar & Mobile Menu
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    const isOpen = navMenu.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close when clicking normal nav links (not dropdown toggles)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.classList.contains('dropdown-toggle')) {
        // On mobile, keep drawer open so user can select dropdown links
        if (window.innerWidth <= 1024) {
          e.preventDefault();
        }
        return;
      }
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close when clicking dropdown links
  document.querySelectorAll('.dropdown-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   2. Interactive Mental Wellness Screener (PHQ-4 Evidence-Based Screener)
   ========================================================================== */
const assessmentQuestions = [
  {
    title: "1. Over the last 2 weeks, how often have you felt little interest or pleasure in doing things?",
    subtitle: "Loss of motivation or engagement in usual passions and daily activities.",
    options: [
      { text: "Not at all", pts: 0 },
      { text: "Several days", pts: 1 },
      { text: "More than half the days", pts: 2 },
      { text: "Nearly every day", pts: 3 }
    ]
  },
  {
    title: "2. Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
    subtitle: "Persistent low mood, feelings of despair, or emotional heaviness.",
    options: [
      { text: "Not at all", pts: 0 },
      { text: "Several days", pts: 1 },
      { text: "More than half the days", pts: 2 },
      { text: "Nearly every day", pts: 3 }
    ]
  },
  {
    title: "3. Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
    subtitle: "Heightened tension, restlessness, or physical agitation.",
    options: [
      { text: "Not at all", pts: 0 },
      { text: "Several days", pts: 1 },
      { text: "More than half the days", pts: 2 },
      { text: "Nearly every day", pts: 3 }
    ]
  },
  {
    title: "4. Over the last 2 weeks, how often have you been unable to stop or control worrying?",
    subtitle: "Overthinking, racing thoughts, or feeling overwhelmed by uncertainties.",
    options: [
      { text: "Not at all", pts: 0 },
      { text: "Several days", pts: 1 },
      { text: "More than half the days", pts: 2 },
      { text: "Nearly every day", pts: 3 }
    ]
  }
];

let currentStep = 0;
let userAnswers = [];

function initWellnessAssessment() {
  const container = document.getElementById('assessmentContainer');
  if (!container) return;

  renderAssessmentStep(0);
}

function renderAssessmentStep(stepIndex) {
  const body = document.getElementById('assessmentBody');
  const progressFill = document.getElementById('assessmentProgressFill');
  const stepCountText = document.getElementById('assessmentStepIndicator');

  if (!body) return;

  if (stepIndex < assessmentQuestions.length) {
    const q = assessmentQuestions[stepIndex];
    const pct = ((stepIndex + 1) / assessmentQuestions.length) * 100;
    
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (stepCountText) stepCountText.textContent = `Question ${stepIndex + 1} of ${assessmentQuestions.length}`;

    body.innerHTML = `
      <div class="question-step active">
        <h4 class="question-title">${q.title}</h4>
        <p class="question-sub">${q.subtitle}</p>
        <div class="option-grid">
          ${q.options.map((opt, i) => `
            <button type="button" class="option-btn" data-pts="${opt.pts}">
              <span class="label">${opt.text}</span>
              <span class="pts">${opt.pts} pts</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    body.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pts = parseInt(btn.getAttribute('data-pts'), 10);
        userAnswers[stepIndex] = pts;
        
        btn.classList.add('selected');
        setTimeout(() => {
          currentStep++;
          if (currentStep < assessmentQuestions.length) {
            renderAssessmentStep(currentStep);
          } else {
            renderAssessmentResults();
          }
        }, 300);
      });
    });
  }
}

function renderAssessmentResults() {
  const body = document.getElementById('assessmentBody');
  const progressFill = document.getElementById('assessmentProgressFill');
  const stepCountText = document.getElementById('assessmentStepIndicator');

  if (progressFill) progressFill.style.width = '100%';
  if (stepCountText) stepCountText.textContent = 'Assessment Completed';

  const totalScore = userAnswers.reduce((a, b) => a + b, 0);

  let badgeClass = 'low';
  let tierTitle = 'Minimal Emotional Distress';
  let advice = "Your responses suggest you are currently managing daily emotional stressors well. Maintaining proactive self-care, mindfulness exercises, and work-life balance is recommended.";

  if (totalScore >= 3 && totalScore <= 5) {
    badgeClass = 'medium';
    tierTitle = 'Mild Stress & Anxiety Indicator';
    advice = "Your responses indicate mild levels of tension or mood fluctuation. This is common during demanding seasons. Consider our guided mindfulness tools or a single confidential consultation with a licensed counselor to prevent burnout.";
  } else if (totalScore >= 6 && totalScore <= 8) {
    badgeClass = 'medium';
    tierTitle = 'Moderate Anxiety / Depressive Symptoms';
    advice = "Your score points to noticeable symptoms of psychological distress impacting your focus or peace of mind. A structured therapeutic check-in or comprehensive assessment can equip you with targeted coping mechanisms.";
  } else if (totalScore >= 9) {
    badgeClass = 'high';
    tierTitle = 'High Distress / Supportive Guidance Recommended';
    advice = "You are experiencing considerable emotional strain. You do not have to carry this alone. ShapeUrMind's certified specialists are available for confidential one-on-one sessions, or you can reach our helpline directly.";
  }

  body.innerHTML = `
    <div class="assessment-result">
      <div class="score-badge ${badgeClass}">${totalScore}/12</div>
      <h4 class="result-title">${tierTitle}</h4>
      <p class="result-desc">${advice}</p>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary" onclick="openBookingModal('Self-Assessment Follow-up (Score: ${totalScore}/12)')">
          <i data-lucide="calendar"></i> Book Session with This Score
        </button>
        <button type="button" class="btn btn-outline" onclick="resetAssessment()">
          <i data-lucide="rotate-ccw"></i> Retake Screener
        </button>
      </div>

      <div style="margin-top: 1.5rem; font-size: 0.78rem; color: var(--text-light);">
        * Disclaimer: This screener (PHQ-4) provides supportive insights and is not a formal medical diagnosis. For clinical diagnosis, request a Comprehensive Diagnostic Assessment with our clinical psychologists.
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

window.resetAssessment = function() {
  currentStep = 0;
  userAnswers = [];
  renderAssessmentStep(0);
};

/* ==========================================================================
   3. 1-Minute Mindful Breathing Exercise Widget
   ========================================================================== */
let breathingTimer = null;
let isBreathingActive = false;

function initBreathingWidget() {
  const startBtn = document.getElementById('startBreathingBtn');
  const circle = document.getElementById('breathingCircle');
  const text = document.getElementById('breathingText');
  const timerDisplay = document.getElementById('breathingTimerDisplay');

  if (!startBtn || !circle || !text) return;

  const phases = [
    { name: 'Inhale deeply...', duration: 4000, cls: 'inhale' },
    { name: 'Hold gently...', duration: 4000, cls: 'hold' },
    { name: 'Exhale slowly...', duration: 4000, cls: 'exhale' },
    { name: 'Rest and relax...', duration: 2000, cls: '' }
  ];

  let phaseIndex = 0;
  let remainingSeconds = 60;
  let countdownInterval = null;

  function runCycle() {
    if (!isBreathingActive) return;

    const current = phases[phaseIndex];
    circle.className = 'breathing-circle-outer ' + current.cls;
    text.textContent = current.name;

    breathingTimer = setTimeout(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      runCycle();
    }, current.duration);
  }

  startBtn.addEventListener('click', () => {
    if (!isBreathingActive) {
      // Start
      isBreathingActive = true;
      startBtn.innerHTML = `<i data-lucide="pause"></i> Pause Exercise`;
      phaseIndex = 0;
      remainingSeconds = 60;
      if (timerDisplay) timerDisplay.textContent = `${remainingSeconds}s`;
      runCycle();

      countdownInterval = setInterval(() => {
        remainingSeconds--;
        if (timerDisplay) timerDisplay.textContent = `${remainingSeconds}s`;
        if (remainingSeconds <= 0) {
          stopBreathing();
          text.textContent = "Great job! Feel free to repeat whenever tension arises.";
          showToast("1-minute mindful breathing session completed!", "success");
        }
      }, 1000);
    } else {
      stopBreathing();
    }
    if (window.lucide) window.lucide.createIcons();
  });

  function stopBreathing() {
    isBreathingActive = false;
    clearTimeout(breathingTimer);
    clearInterval(countdownInterval);
    circle.className = 'breathing-circle-outer';
    text.textContent = "Press start to begin your 1-minute calming breath.";
    startBtn.innerHTML = `<i data-lucide="play"></i> Start 1-Min Calming Breath`;
    if (timerDisplay) timerDisplay.textContent = "60s";
    if (window.lucide) window.lucide.createIcons();
  }
}

/* ==========================================================================
   4. Service Filter Tabs & Service Details Modal
   ========================================================================== */
const serviceData = {
  individual: {
    title: "Individual Counseling & Psychotherapy",
    category: "Personal Well-being",
    duration: "50-60 Minutes per session",
    format: "Online (Encrypted Video) or In-Person (Lagos & Abuja)",
    desc: "A safe, confidential therapeutic sanctuary to process emotional distress, anxiety, depressive episodes, unresolved trauma, relationship fractures, and major life transitions.",
    highlights: [
      "Cognitive Behavioral Therapy (CBT) & Psychodynamic approaches",
      "Confidential 1-on-1 care with licensed clinical psychologists",
      "Evidence-based coping toolkits for anxiety & panic regulation",
      "Flexible evening and weekend telehealth slots"
    ]
  },
  diagnostic: {
    title: "Comprehensive Diagnostic Assessments",
    category: "Clinical Evaluation",
    duration: "2-3 Sessions + Comprehensive Written Report",
    format: "Clinical in-person evaluation & validated psychometric batteries",
    desc: "Rigorous psychological evaluations designed to offer definitive clarity on complex behavioral, cognitive, or mood symptoms.",
    highlights: [
      "Clinical evaluations for ADHD, Mood Disorders, and Personality profiles",
      "Standardized psychometric test administration and interpretation",
      "Formal diagnostic reports for medical, academic, or legal settings",
      "Personalized actionable treatment roadmap tailored to findings"
    ]
  },
  corporate: {
    title: "Corporate & Workplace Solutions (EAPs)",
    category: "Organizational Health",
    duration: "Customized retainers & workshops",
    format: "On-site seminars, executive 1-on-1s, 24/7 staff hotline",
    desc: "Comprehensive Employee Assistance Programs (EAPs) designed to curb burnout, boost employee morale, build psychological safety, and boost sustainable productivity.",
    highlights: [
      "Workplace mental health audits and stress assessments",
      "Confidential counseling retainers for executive and junior staff",
      "Manager training: Identifying and addressing team burnout early",
      "Quarterly mental health webinars and de-escalation workshops"
    ]
  },
  child: {
    title: "Child & Adolescent Therapy",
    category: "Youth & Family Care",
    duration: "45-50 Minutes per session",
    format: "Child-friendly clinic setting & collaborative family sessions",
    desc: "Compassionate, developmental care assisting children and teenagers through academic pressure, bullying, behavioral defiance, ADHD management, and family transitions.",
    highlights: [
      "Play therapy and expressive art techniques for younger children",
      "Adolescent emotional regulation and identity development support",
      "Parenting coaching and collaborative school support plans",
      "Safe space to overcome social anxiety and peer stressors"
    ]
  },
  crisis: {
    title: "Crisis Intervention & Rapid Support",
    category: "Emergency & Urgent",
    duration: "Immediate triage & stabilization",
    format: "24/7 Crisis helpline (+234 806 002 8943) & rapid telehealth",
    desc: "Compassionate crisis de-escalation for individuals or corporate teams coping with sudden trauma, bereavement, acute panic, or suicidal ideation.",
    highlights: [
      "Direct line to licensed crisis de-escalation professionals",
      "Critical Incident Stress Debriefing (CISD) for organizations",
      "Immediate stabilization techniques and safety planning",
      "Warm handoff to long-term psychiatric or counseling care"
    ]
  },
  capacity: {
    title: "Capacity Building & Community Seminars",
    category: "Psychoeducation",
    duration: "Half-day, Full-day, or multi-week certification",
    format: "Interactive workshops, webinars, and field simulations",
    desc: "Empowering educators, healthcare workers, religious leaders, and community volunteers with Psychological First Aid and basic counseling competencies.",
    highlights: [
      "Psychological First Aid (PFA) and Mental Health First Responder training",
      "Destigmatization campaigns in schools and religious institutions",
      "Certified psychoeducational workshops with verifiable credentials",
      "Custom curricula for NGOs and non-profit field teams"
    ]
  }
};

function initServiceFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  const serviceCards = document.querySelectorAll('.service-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filterValue = pill.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

window.viewServiceDetails = function(serviceKey) {
  const data = serviceData[serviceKey];
  if (!data) return;

  const modalBody = document.getElementById('serviceModalContent');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <span class="topbar-badge" style="display: inline-block; margin-bottom: 0.75rem;">${data.category}</span>
    <h3 style="font-size: 1.6rem; font-weight: 800; color: var(--color-primary-dark); margin-bottom: 0.5rem;">${data.title}</h3>
    <div style="display: flex; gap: 1.25rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
      <span><strong>Duration:</strong> ${data.duration}</span>
      <span><strong>Format:</strong> ${data.format}</span>
    </div>
    <p style="font-size: 0.95rem; line-height: 1.65; color: var(--text-main); margin-bottom: 1.5rem;">${data.desc}</p>
    
    <h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--color-primary-dark);">Key Clinical Highlights:</h5>
    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 2rem;">
      ${data.highlights.map(h => `
        <li style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; color: var(--text-main);">
          <span style="color: var(--color-secondary); font-weight: bold;">✓</span> ${h}
        </li>
      `).join('')}
    </ul>

    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <button type="button" class="btn btn-primary" onclick="closeModal('serviceModal'); openBookingModal('${data.title}')">
        Schedule This Service
      </button>
      <a href="tel:+2348060028943" class="btn btn-outline">
        Speak with Consultant (+234 806 002 8943)
      </a>
    </div>
  `;

  openModal('serviceModal');
};

/* ==========================================================================
   5. Modal Manager
   ========================================================================== */
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.openBookingModal = function(preselectedService) {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    const serviceSelect = document.getElementById('modalServiceSelect');
    if (serviceSelect && preselectedService) {
      let matched = false;
      for (let opt of serviceSelect.options) {
        if (opt.text.toLowerCase().includes(preselectedService.toLowerCase()) || 
            preselectedService.toLowerCase().includes(opt.value.toLowerCase())) {
          opt.selected = true;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const newOpt = new Option(preselectedService, 'custom', true, true);
        serviceSelect.add(newOpt);
      }
    }
    openModal('bookingModal');
  } else {
    // Navigate to dedicated multi-page booking portal
    const param = preselectedService ? `?service=${encodeURIComponent(preselectedService)}` : '';
    window.location.href = `book.html${param}`;
  }
};

/* ==========================================================================
   6. Booking & Contact Forms Handling (Email Dispatch Configuration)
   ========================================================================== */
const FORM_CONFIG = {
  // Service mode: 'web3forms' (Active) | 'php' | 'formspree'
  serviceMode: 'web3forms',
  web3formsKey: '04652774-7bdc-41f9-b34f-ab8360c4d280', // Active Web3Forms access key
  destinationEmail: 'info@shapeurmind.org',
  fallbackEndpoint: 'send_mail.php'
};

async function dispatchFormEmail(payload) {
  try {
    if (FORM_CONFIG.serviceMode === 'web3forms' && FORM_CONFIG.web3formsKey && FORM_CONFIG.web3formsKey !== 'YOUR_ACCESS_KEY_HERE') {
      payload.access_key = FORM_CONFIG.web3formsKey;
      payload.from_name = 'Shape Your Mind Web Intake';
      const clientIdentifier = payload.Client_Full_Name || payload.Client_Name || payload.fullName || payload.name || payload.email || 'Client';
      payload.subject = `[ShapeUrMind Intake] ${payload.form_type || 'New Lead'} - ${clientIdentifier}`;
      
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Web3Forms Email successfully dispatched to inbox:', data);
      } else {
        console.warn('⚠️ Web3Forms responded with error:', data.message);
      }
    } else {
      console.info('%c[ShapeUrMind Form]%c Web3Forms is active! Access key is ready and configured.', 'background: #80365d; color: white; padding: 2px 6px; border-radius: 4px;', '');
      // Automatic fallback to self-hosted send_mail.php if running on PHP server
      await fetch(FORM_CONFIG.fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.log('Local fallback notice:', e));
    }
  } catch (err) {
    console.warn('Form dispatch background note:', err);
  }
}

function initBookingForms() {
  // Main Section Booking Form
  const mainBookingForm = document.getElementById('mainBookingForm');
  if (mainBookingForm) {
    mainBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleBookingSubmission(new FormData(mainBookingForm));
      mainBookingForm.reset();
    });
  }

  // Modal Booking Form
  const modalBookingForm = document.getElementById('modalBookingForm');
  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleBookingSubmission(new FormData(modalBookingForm));
      modalBookingForm.reset();
      closeModal('bookingModal');
    });
  }

  // Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(contactForm).entries());
      const payload = {
        form_type: 'General Contact Inquiry',
        Client_Name: raw.name || '',
        Client_Email: raw.email || '',
        Client_Phone: raw.phone || '',
        Category: raw.category || 'General Consultation',
        Subject: raw.subject || `Inquiry from ${raw.name || 'Website Visitor'}`,
        Message: raw.message || ''
      };
      dispatchFormEmail(payload);

      const name = raw.name || 'Friend';
      showToast(`Thank you, ${name}! Your inquiry has been dispatched to our clinic desk. We will reach out shortly.`, 'success');
      contactForm.reset();
    });
  }

  // Newsletter Forms
  document.querySelectorAll('form#newsletterForm, .newsletter-box-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const emailVal = emailInput ? emailInput.value : '';
      if (!emailVal) return;
      const payload = {
        form_type: 'Monthly Wellness Digest Subscription',
        Newsletter_Subscriber_Email: emailVal,
        email: emailVal
      };
      dispatchFormEmail(payload);

      showToast("Thank you for subscribing to ShapeUrMind insights!", "success");
      form.reset();
    });
  });
}

function handleBookingSubmission(formData) {
  const clientName = formData.get('fullName') || 'Client';
  const service = formData.get('service') || 'Consultation';
  const date = formData.get('preferredDate') || 'Upcoming date';
  const time = formData.get('preferredTime') || 'Selected time';
  const specialist = formData.get('specialist') || 'Any Available Specialist';
  const phone = formData.get('phone') || '';
  const refCode = 'SUM-' + Math.floor(100000 + Math.random() * 900000);

  // Dispatch email in background with formatted keys for Web3Forms email table
  const payload = {
    form_type: 'Consultation Appointment Booking',
    Booking_Reference_Code: refCode,
    Client_Full_Name: clientName,
    Client_Email: formData.get('email') || '',
    WhatsApp_Phone: phone,
    Requested_Service: service,
    Session_Format: formData.get('format') || 'Virtual Video (Encrypted Telehealth)',
    Assigned_Specialist: specialist,
    Scheduled_Date: date,
    Scheduled_Time: time,
    Previous_Therapy_Experience: formData.get('previousTherapy') || 'Not specified',
    Referral_Source: formData.get('referral') || 'Direct Web',
    Clinical_Notes_and_Goals: formData.get('notes') || 'No additional notes provided.'
  };
  dispatchFormEmail(payload);

  // Show detailed confirmation in success modal
  const confirmationModal = document.getElementById('confirmationModal');
  const detailsBox = document.getElementById('confirmationDetails');
  
  if (detailsBox) {
    detailsBox.innerHTML = `
      <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: var(--radius-md); text-align: left; margin: 1.5rem 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">Booking Reference:</span>
          <strong style="color: var(--color-primary); font-family: monospace;">${refCode}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">Client Name:</span>
          <strong>${clientName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">Requested Service:</span>
          <strong>${service}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">Assigned Specialist:</span>
          <strong>${specialist}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">Scheduled Slot:</span>
          <strong>${date} at ${time}</strong>
        </div>
      </div>
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">
        Your consultation request has been dispatched to our intake team at <strong>info@shapeurmind.org</strong>. You can also connect immediately on WhatsApp with your booking reference.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="https://wa.me/2348060028943?text=Hello%20Shape%20Your%20Mind%2C%20I%20just%20booked%20reference%20${refCode}%20for%20${encodeURIComponent(service)}%20with%20${encodeURIComponent(specialist)}" target="_blank" class="btn btn-accent">
          <i data-lucide="message-circle"></i> Connect via WhatsApp
        </a>
        <button type="button" class="btn btn-outline" onclick="closeModal('confirmationModal')">
          Close
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    openModal('confirmationModal');
  } else {
    showToast(`Appointment request received! Reference: ${refCode}`, 'success');
  }
}

/* ==========================================================================
   7. Blog Reader System (Authentic shapeurmind.org Articles & Galleries)
   ========================================================================== */
const blogPosts = {
  "pm-plus-group": {
    title: "Problem Management Plus (Group PM+)",
    author: "Owoicho Ajayi (Founder & Lead Director)",
    date: "August 23, 2026",
    category: "Clinical Training",
    readTime: "3 min read",
    featuredImage: "images/blog/IMG-20260814-WA0029.jpg",
    gallery: ["images/blog/IMG-20260814-WA0027-768x1024.jpg", "images/blog/IMG-20260814-WA0030-576x1024.jpg", "images/blog/IMG-20260814-WA0028-1024x576.jpg", "images/blog/IMG-20260814-WA0029-1024x576.jpg", "images/blog/IMG-20260814-WA0026-576x1024.jpg"],
    content: `<p>Over the past five days, <strong>Shape Your Mind Consult</strong> successfully concluded a high-impact five-day <strong>Group Problem Management Plus (Group PM+)</strong> training workshop.</p>
      
      <p>Over five engaging sessions, participants strengthened their understanding of the World Health Organization Group PM+ model, facilitation skills, and strategies for supporting individuals and families affected by adversity and severe stress.</p>
      
      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Core Competencies Delivered</h4>
      <ul style="padding-left: 1.5rem; margin-bottom: 1.25rem;">
        <li><strong>Managing Stress & Somatic Calming:</strong> Training facilitators on slow breathing exercises to stabilize autonomic arousal.</li>
        <li><strong>Problem-Solving Techniques:</strong> Guiding participants to break overwhelming practical problems into manageable, actionable steps.</li>
        <li><strong>Behavioral Activation:</strong> Re-engaging with positive and restorative daily routines even in high-stress humanitarian settings.</li>
        <li><strong>Strengthening Social Support:</strong> Building peer-led psychosocial networks within communities.</li>
      </ul>

      <p>Through practical exercises, structured role plays, and peer learning, participants built the confidence to deliver quality, context-adapted psychosocial interventions within vulnerable communities. Grateful to all participants for their commitment, active engagement, and passion for expanding access to quality and scalable mental health care.</p>`
  },
  "pm-plus-maiduguri": {
    title: "Strengthening Frontline Humanitarian Response Through PM+ Training of Trainers in Maiduguri",
    author: "Owoicho Ajayi (Founder & Lead Director)",
    date: "March 31, 2026",
    category: "Humanitarian & Training",
    readTime: "4 min read",
    featuredImage: "images/blog/IMG-20260330-WA0008.jpg",
    gallery: ["images/blog/IMG-20260330-WA0004-1024x768.jpg", "images/blog/IMG-20260330-WA0005-1024x768.jpg", "images/blog/IMG-20260330-WA0006-1024x768.jpg", "images/blog/IMG-20260330-WA0007-1024x768.jpg", "images/blog/IMG-20260330-WA0008-1024x768.jpg"],
    content: `<p>In the month of March, <strong>Shape Your Mind Consult</strong> facilitated a transformative five-day <strong>PM+ (Problem Management Plus) Training of Trainers (ToT)</strong> in Maiduguri, Borno State.</p>

      <p>This intensive clinical refresher brought together Doctors, Nurses, Clinical Psychologists, case managers, HR leads, project directors, and Community Health Extension Workers (CHEWs) serving on the frontlines of humanitarian response in Northeast Nigeria.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Clinical Rigor & Scalable Impact</h4>
      <p>The five-day session focused on sharpening clinical precision, building facilitation confidence, updating intervention protocols, and fostering cross-organizational knowledge exchange. Participants were guided through case conceptualization, managing complex trauma, and safeguarding ethical standards.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Sustainable Community Capacity</h4>
      <p>By strengthening the pedagogical and technical skills of these master trainers, Shape Your Mind has directly enhanced psychosocial service delivery across conflict-affected communities. This refresher training empowered participants to mentor frontline lay workers, ensuring that life-saving psychosocial support remains sustainable, ethical, and deeply rooted in empathy.</p>`
  },
  "optimizing-performance-2025": {
    title: "Optimizing Performance: A Holistic Approach to Success in the Workplace",
    author: "Owoicho Ajayi (Clinical Director)",
    date: "March 7, 2025",
    category: "Workplace Wellness",
    readTime: "5 min read",
    featuredImage: "images/blog/people-office-work-day.jpg",
    gallery: [],
    content: `<p>Achieving peak performance in the modern workplace involves far more than merely meeting project deadlines and delivering quarterly targets. It demands a holistic, sustainable approach that balances mental resilience, physical health, and emotional well-being.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Understanding the Dynamics of Workplace Performance</h4>
      <p>Workplace performance is influenced by complex interconnected factors, including the physical environment, organizational leadership culture, emotional job demands, and individual coping strategies. When employees feel supported, psychologically safe, and valued, they consistently innovate and perform at their peak.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Key Strategies for Enhancing Workplace Performance</h4>
      <ol style="padding-left: 1.5rem; margin-bottom: 1.25rem;">
        <li><strong>Cultivate Psychological Safety:</strong> Foster an organizational culture where team members can voice concerns, ask questions, and share creative ideas without fear of retribution.</li>
        <li><strong>Prioritize Preventive Employee Wellness:</strong> Deploy tailored Employee Assistance Programs (EAPs) with Shape Your Mind Consult to address burnout before it causes absenteeism.</li>
        <li><strong>Continuous Capacity Building:</strong> Deliver regular mental fitness webinars, stress-management workshops, and leadership de-escalation training.</li>
        <li><strong>Enforce Work-Life Boundaries:</strong> Protect cognitive recovery by establishing boundaries around after-hours communication and encouraging deliberate rest cycles.</li>
      </ol>`
  },
  "social-behavioural-workshop": {
    title: "Social Behavioural Workshop: Empowering Community Caregivers",
    author: "Thlama Mperiju & Owoicho Ajayi",
    date: "August 8, 2024",
    category: "Workshops & Community",
    readTime: "4 min read",
    featuredImage: "images/blog/DSC_1669.jpg",
    gallery: ["images/blog/DSC_1646.jpg", "images/blog/DSC_1669.jpg", "images/blog/close-up-of-group-therapy-attenders-holding-hands-DGUQWYG.jpg"],
    content: `<p>On the 29th to 31st of July 2024, <strong>Shape Your Mind Consult Ltd</strong> facilitated an immersive 3-day workshop in partnership with <strong>Supertouch Kindness Foundation (SKF)</strong>.</p>

      <p>The workshop gathered dedicated humanitarian workers, volunteers, and community caregivers for an intensive training in social behavioral modification, empathetic listening, and psychological first aid.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Mental Health Can and Must Be Discussed</h4>
      <p>A core pillar of the engagement focused on dismantling social taboos. Participants examined how community stigma prevents vulnerable individuals from seeking timely clinical help. Through guided role-play scenarios, caregivers learned how to hold space for emotional distress, validate personal struggles, and refer individuals safely to specialized clinical care.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Care for the Caregiver</h4>
      <p>Secondary trauma and compassion fatigue represent silent threats to community workers. Our specialists equipped participants with personal grounding exercises, peer check-in frameworks, and self-compassion toolkits to protect their own psychological endurance.</p>`
  },
  "mental-awareness-month": {
    title: "Mental Health Awareness Month: Breaking the Silence",
    author: "Ene Margaret (Psychiatric Nurse)",
    date: "June 5, 2024",
    category: "Advocacy",
    readTime: "5 min read",
    featuredImage: "images/blog/SHAPE-YOUR-MIND-3-scaled.jpg",
    gallery: ["images/blog/close-up-of-group-therapy-attenders-holding-hands-DGUQWYG.jpg"],
    content: `<p>At <strong>Shape Your Mind Consult</strong>, we recognize that mental health is an indispensable cornerstone of overall human vitality. In commemoration of Mental Health Awareness Month, we joined global advocates in urging individuals, families, and corporations to prioritize emotional well-being.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Why Mental Health Matters Everyday</h4>
      <p>Mental health governs how we process cognition, regulate emotions, withstand physical stress, make sound decisions, and cultivate relationships. When mental equilibrium is compromised, every facet of life—from career trajectory to marital harmony—suffers consequences.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Breaking Generational Stigma</h4>
      <p>Awareness is the first step toward breaking the silence. For far too long, individuals struggling with anxiety, depression, and trauma have suffered behind closed doors due to fear of judgment. Seeking professional psychotherapeutic care is an act of profound self-respect, wisdom, and inner courage.</p>`
  },
  "academic-stress-guide": {
    title: "Navigating Stress in the Academic Journey: A Guide to Mental Wellness",
    author: "Samuel Ogwuche (Occupational Therapist)",
    date: "November 15, 2023",
    category: "Youth & Education",
    readTime: "5 min read",
    featuredImage: "images/blog/Balance.jpg",
    gallery: ["images/blog/close-up-of-group-therapy-attenders-holding-hands-DGUQWYG.jpg"],
    content: `<p>Embarking on an academic journey can be an exhilarating milestone filled with intellectual growth, career prospects, and personal transformation. However, demanding curricula, continuous examinations, financial pressures, and social adjustments frequently induce intense psychological strain.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Signs of Chronic Academic Burnout</h4>
      <ul style="padding-left: 1.5rem; margin-bottom: 1.25rem;">
        <li>Persistent mental fog and inability to concentrate during lectures or study sessions.</li>
        <li>Disrupted circadian sleep cycles and chronic morning exhaustion.</li>
        <li>Imposter syndrome: Feeling unworthy of academic achievements or terrified of perceived failure.</li>
        <li>Social isolation and neglecting physical nourishment or recreation.</li>
      </ul>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Practical Wellness Recommendations</h4>
      <p>Prioritizing mental wellness is essential for authentic academic success. Implement targeted revision intervals (the Pomodoro technique), maintain consistent sleep hygiene, engage in physical movement to dissipate cortisol, and seek confidential guidance from our counselors whenever academic anxiety impairs daily functioning.</p>`
  },
  "workplace-performance-foundations": {
    title: "Optimizing Performance: Foundations of Work-Life Equilibrium",
    author: "Owoicho Ajayi (Founder & Lead Director)",
    date: "November 15, 2023",
    category: "Workplace Wellness",
    readTime: "5 min read",
    featuredImage: "images/blog/work-life.jpg",
    gallery: ["images/blog/close-up-of-group-therapy-attenders-holding-hands-DGUQWYG.jpg"],
    content: `<p>True professional excellence cannot be decoupled from emotional and psychological equilibrium. In today's hyper-connected enterprise landscape, the boundary between professional demands and restorative personal time has become increasingly blurred.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">The Cognitive Cost of Hyper-Connectivity</h4>
      <p>When employees remain continuously tethered to emails, messaging applications, and project boards, the nervous system remains locked in sympathetic arousal. Over time, cognitive bandwidth narrows, emotional reactivity increases, and creative problem-solving diminishes.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Institutionalizing Sustainable Habits</h4>
      <p>Organizations must partner with mental health professionals to institute wellness audits, clear digital boundary protocols, and accessible counseling retainers. When enterprises protect employee mental bandwidth, staff retention increases and institutional performance reaches its highest potential.</p>`
  },
  "nurturing-mental-wellbeing": {
    title: "Nurturing Mental Well-being: A Vital Aspect of a Successful Life",
    author: "Shape Your Mind Clinical Team",
    date: "November 15, 2023",
    category: "Life Hacks",
    readTime: "5 min read",
    featuredImage: "images/blog/iStock-1365669010_Five-wellness-tips-for-positive-mental-health-at-work-1120x630-1.jpg",
    gallery: ["images/blog/close-up-of-group-therapy-attenders-holding-hands-DGUQWYG.jpg"],
    content: `<p>In the fast-paced modern world where success is often measured predominantly by professional accolades, financial metrics, and social stature, mental well-being is frequently sidelined. Yet psychological balance is the bedrock upon which all enduring success is constructed.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">The Connection Between Mental Health & Sustainable Success</h4>
      <p>Without emotional stability, external triumphs feel hollow and unsustainable. Chronic internal turmoil clouds decision-making, strains personal bonds, and eventually triggers physical health collapses. Nurturing mental well-being is an active, daily practice of self-attunement and intentional living.</p>

      <h4 style="margin: 1.5rem 0 0.5rem; color: var(--color-primary-dark);">Five Clinical Habits for Daily Resilience</h4>
      <ol style="padding-left: 1.5rem; margin-bottom: 1.25rem;">
        <li><strong>Mindful Self-Reflection:</strong> Dedicate 10 minutes daily to journaling or silent introspection to process unresolved thoughts.</li>
        <li><strong>Nourish Meaningful Connections:</strong> Cultivate deep relationships where you can share authentic emotions without fear of judgment.</li>
        <li><strong>Somatic Movement:</strong> Engage in regular moderate physical exercise to stimulate endorphins and dissipate physical tension.</li>
        <li><strong>Boundaries as Self-Care:</strong> Learn to say 'no' without guilt to demands that over-extend your psychological resources.</li>
        <li><strong>Routine Clinical Check-Ins:</strong> Engage professional therapists at Shape Your Mind Consult for routine emotional maintenance.</li>
      </ol>`
  },
};

function initBlogReader() {
  window.openArticle = function(slug) {
    const post = blogPosts[slug];
    if (!post) return;

    const modalBody = document.getElementById('blogModalContent');
    if (!modalBody) return;

    let galleryHtml = '';
    if (post.gallery && post.gallery.length > 0) {
      galleryHtml = `
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-light);">
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="camera" style="width: 18px; height: 18px; color: var(--color-secondary);"></i>
            <span>Field & Workshop Photo Gallery (${post.gallery.length} Photos)</span>
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            ${post.gallery.map(img => `
              <div style="border-radius: var(--radius-md); overflow: hidden; height: 140px; box-shadow: var(--shadow-sm); cursor: pointer;" onclick="window.open('${img}', '_blank')">
                <img src="${img}" alt="Field photo" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              </div>
            `).join('')}
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Click any photo to view full resolution.</p>
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <span class="topbar-badge" style="background: var(--color-secondary-light); color: var(--color-primary); font-weight: 700;">${post.category}</span>
          <span style="font-size: 0.82rem; color: var(--text-light);">${post.readTime}</span>
        </div>
        <h2 style="font-size: 1.85rem; font-weight: 800; color: var(--color-primary-dark); line-height: 1.25; margin-bottom: 0.75rem;">${post.title}</h2>
        <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.85rem; color: var(--text-muted); padding-bottom: 1rem; border-bottom: 1px solid var(--border-light);">
          <span><i data-lucide="user" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> By <strong>${post.author}</strong></span>
          <span>•</span>
          <span><i data-lucide="calendar" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> ${post.date}</span>
        </div>
      </div>
      
      ${post.featuredImage ? `
        <div style="margin-bottom: 1.75rem; border-radius: var(--radius-md); overflow: hidden; max-height: 380px;">
          <img src="${post.featuredImage}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      ` : ''}

      <div class="article-rich-text" style="font-size: 0.98rem; line-height: 1.75; color: var(--text-main);">
        ${post.content}
      </div>

      ${galleryHtml}

      <div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.88rem; color: var(--text-muted); font-weight: 600;">Want specialized training or psychological consultations?</span>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <a href="https://wa.me/2348060028943?text=Hello%20Shape%20Your%20Mind,%20I%20am%20inquiring%20about%20the%20article:%20${encodeURIComponent(post.title)}" target="_blank" class="btn btn-soft btn-sm">
            <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
            <span>Ask via WhatsApp</span>
          </a>
          <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('blogModal'); window.location.href='appointment.html'">
            <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
            <span>Book Consultation</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    openModal('blogModal');
  };

  // Category filter buttons on blog.html
  const filterBtns = document.querySelectorAll('.blog-filter-btn');
  const blogCards = document.querySelectorAll('.blog-grid .blog-card');
  
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');

        blogCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (filter === 'all' || cardCat.toLowerCase().includes(filter.toLowerCase())) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Open article if specified in URL hash (e.g. blog.html#pm-plus-maiduguri)
  const hash = window.location.hash.replace('#', '');
  if (hash && blogPosts[hash]) {
    setTimeout(() => {
      window.openArticle(hash);
    }, 200);
  }
}

/* ==========================================================================
   8. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      const isOpen = parent.classList.contains('open');

      // Close other opened FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   9. Toast Notifications
   ========================================================================== */
function showToast(message, type = 'info') {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  const iconName = type === 'success' ? 'check-circle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${iconName}" style="color: #34d399;"></i>
    <span>${message}</span>
  `;

  if (window.lucide) window.lucide.createIcons();

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
