// ============================================================================
// Flammy — interações do site
// Tudo em JavaScript puro (sem bibliotecas). Cada bloco é independente.
// ============================================================================

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO — edite aqui os contatos usados nos botões de WhatsApp
// ---------------------------------------------------------------------------
const FLAMMY = {
  // Número com DDI + DDD, só dígitos. (Ex.: 5571999999999)
  // ATENÇÃO: este é o número de exemplo que já estava no site; troque pelo real.
  whatsapp: '5571984441582',
};

// Usuário pediu menos movimento? Então desligamos animações contínuas.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppLinks();
  initMobileMenu();
  initHeader();
  initReveal();
  initSectionTitles();
  initCatalogFilter();
  initNetworks();
  initMascotTilt();
  initSlider(document.getElementById('equipe'));
  initLiquidButtons();
});

// ---------------------------------------------------------------------------
// 1) Links de WhatsApp
//    Qualquer elemento com data-wa="mensagem" vira um link wa.me com a
//    mensagem já preenchida. Sem JS, o href original (#contato) continua valendo.
// ---------------------------------------------------------------------------
function initWhatsAppLinks() {
  document.querySelectorAll('[data-wa]').forEach(el => {
    const msg = encodeURIComponent(el.dataset.wa);
    el.href = `https://wa.me/${FLAMMY.whatsapp}?text=${msg}`;
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

// ---------------------------------------------------------------------------
// 2) Menu mobile (abre/fecha com o botão hambúrguer)
// ---------------------------------------------------------------------------
function initMobileMenu() {
  const burger = document.querySelector('.burger');
  const mnav = document.getElementById('mnav');
  if (!burger || !mnav) return;

  const setOpen = (open) => {
    mnav.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  burger.addEventListener('click', () => setOpen(mnav.hidden));
  mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
}

// ---------------------------------------------------------------------------
// 3) Cabeçalho: ganha fundo "vidro" ao rolar e destaca o link da seção atual
// ---------------------------------------------------------------------------
function initHeader() {
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Marca como ativo o link do menu correspondente à seção visível
  const links = [...document.querySelectorAll('.navlinks a')];
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.remove('active'));
      const link = byId.get(entry.target.id);
      if (link) link.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' }); // considera "atual" a seção no meio da tela

  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

// ---------------------------------------------------------------------------
// 4) Entrada em cascata ao rolar
//    Itens com a classe .pop aparecem (animação "popUp" do CSS) quando entram
//    na tela. O --delay faz um item entrar logo depois do outro.
// ---------------------------------------------------------------------------
function initReveal() {
  const items = document.querySelectorAll('.pop');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    // Só os que acabaram de aparecer, na ordem em que estão na página
    const visible = entries.filter(e => e.isIntersecting);
    visible.forEach((entry, i) => {
      entry.target.style.setProperty('--delay', `${i * 80}ms`);
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  items.forEach(el => io.observe(el));
}

// ---------------------------------------------------------------------------
// 4b) Entrada dos títulos de seção
//    Títulos com a classe .section-title sobem 16px com fade-in na primeira
//    vez que entram na tela. O estado escondido só existe depois que o
//    observador é criado (.titles-anim no <html>), então sem JS, sem
//    IntersectionObserver ou com "movimento reduzido" eles ficam visíveis.
// ---------------------------------------------------------------------------
function initSectionTitles() {
  const titles = document.querySelectorAll('.section-title');
  if (!titles.length || !('IntersectionObserver' in window) || reduceMotion) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  document.documentElement.classList.add('titles-anim');
  titles.forEach(el => io.observe(el));
}

// ---------------------------------------------------------------------------
// 5) Catálogo: filtros por categoria
//    Cada .svc tem data-cat="sistemas automacao ..."; o botão tem data-filter.
// ---------------------------------------------------------------------------
function initCatalogFilter() {
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('.svc');
  if (!chips.length) return;

  chips.forEach(chip => chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));

    let shown = 0;
    cards.forEach(card => {
      const match = filter === 'todos' || card.dataset.cat.split(' ').includes(filter);
      card.hidden = !match;
      if (!match) return;
      // Reinicia a animação de entrada dos cards que continuam visíveis
      card.classList.remove('in');
      void card.offsetWidth;                         // força o navegador a "reler" o estilo
      card.style.setProperty('--delay', `${shown++ * 70}ms`);
      card.classList.add('in');
    });
  }));
}

// ---------------------------------------------------------------------------
// 6) Rede animada de pontos e linhas (fundo do hero e do contato)
//    Pontos flutuam devagar; os próximos se ligam por linhas, e o mouse
//    "puxa" linhas dos pontos ao redor. Pausa quando sai da tela.
// ---------------------------------------------------------------------------
function initNetworks() {
  document.querySelectorAll('canvas.net').forEach(canvas => createNetwork(canvas));
}

function createNetwork(canvas) {
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  const LINK = 150;          // distância máxima para dois pontos se ligarem (px)
  const GRAB = 200;          // distância em que o mouse puxa linhas (px)
  const pointer = { x: 0, y: 0, active: false };
  let w = 0, h = 0, nodes = [], raf = 0, last = 0, running = false;

  const newNode = () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.3;
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 1 + Math.random() * 1.8,
      hot: Math.random() < 0.7,           // 70% vermelhos, 30% brancos
    };
  };

  // Ajusta o canvas ao tamanho da seção (com nitidez em telas retina)
  function resize() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Quantidade de pontos proporcional à área (entre 26 e 90)
    const target = Math.round(Math.min(90, Math.max(26, (w * h) / 16000)));
    while (nodes.length < target) nodes.push(newNode());
    nodes.length = target;
    if (reduceMotion) draw();             // sem animação: desenha um quadro só
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Linhas entre pontos próximos (mais transparentes quanto mais longe)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(255,60,60,${(1 - d / LINK) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // Linhas do mouse até os pontos próximos
      if (pointer.active) {
        const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (d < GRAB) {
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d / GRAB) * 0.4})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
        }
      }
    }

    // Pontos
    nodes.forEach(n => {
      ctx.fillStyle = n.hot ? 'rgba(255,60,60,.9)' : 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min((t - last) / 16.67, 3);   // 1 = um quadro a 60fps
    last = t;
    nodes.forEach(n => {
      n.x += n.vx * dt; n.y += n.vy * dt;
      // Quica nas bordas
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });
    draw();
    raf = requestAnimationFrame(frame);
  }

  let onScreen = true;       // a seção está visível na tela?
  const start = () => { if (running || reduceMotion || !onScreen || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  // Mouse/toque sobre a seção
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
  });
  host.addEventListener('pointerleave', () => { pointer.active = false; });

  window.addEventListener('resize', resize);
  resize();

  // Só anima enquanto a seção está visível e a aba está aberta (economiza bateria)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? start() : stop(); }).observe(host);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// ---------------------------------------------------------------------------
// 7) Mascote do hero inclina de leve seguindo o mouse
// ---------------------------------------------------------------------------
function initMascotTilt() {
  const mascot = document.getElementById('mascot');
  const hero = document.querySelector('.hero');
  if (!mascot || !hero || reduceMotion) return;

  let pending = false, nx = 0, ny = 0;
  hero.addEventListener('pointermove', e => {
    const r = mascot.getBoundingClientRect();
    // posição do mouse em relação ao centro do mascote, de -1 a 1
    nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      mascot.style.setProperty('--ry', `${(nx * 14).toFixed(2)}deg`);
      mascot.style.setProperty('--rx', `${(-ny * 10).toFixed(2)}deg`);
      pending = false;
    });
  });
  hero.addEventListener('pointerleave', () => {
    mascot.style.setProperty('--ry', '0deg');
    mascot.style.setProperty('--rx', '0deg');
  });
}

// ---------------------------------------------------------------------------
// 8) Slider da equipe (Sobre nós)
//    - setas, bolinhas, teclado (← →) e arrastar com o dedo/mouse
//    - rotação automática que pausa com mouse/foco e tem botão de pausa
// ---------------------------------------------------------------------------
function initSlider(root) {
  if (!root) return;
  const viewport = root.querySelector('.slider-viewport');
  const track = root.querySelector('.slider-track');
  const slides = [...track.children];
  const dotsBox = root.querySelector('.slider-dots');
  const counter = root.querySelector('.slider-count');
  const btnPrev = root.querySelector('[data-prev]');
  const btnNext = root.querySelector('[data-next]');
  const btnToggle = root.querySelector('[data-toggle]');
  const AUTOPLAY_MS = 7000;

  let index = 0;
  let autoplay = !reduceMotion;     // usuário com "movimento reduzido" não recebe rotação automática
  let hovering = false;
  let timer = null;

  // Cria uma bolinha por slide
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.setAttribute('aria-label', `Ver integrante ${i + 1} de ${slides.length}`);
    b.addEventListener('click', () => goTo(i, true));
    dotsBox.appendChild(b);
    return b;
  });

  // Vai para o slide i (dá a volta no início/fim)
  function goTo(i, fromUser = false) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((s, n) => {
      s.toggleAttribute('inert', n !== index);        // slides fora da tela não recebem foco
      s.setAttribute('aria-hidden', String(n !== index));
    });
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    if (counter) counter.textContent = `${index + 1} de ${slides.length}`;
    if (fromUser) schedule();
  }

  // Rotação automática
  function schedule() {
    clearTimeout(timer);
    if (!autoplay || hovering) return;
    timer = setTimeout(() => { goTo(index + 1); schedule(); }, AUTOPLAY_MS);
  }

  btnPrev.addEventListener('click', () => goTo(index - 1, true));
  btnNext.addEventListener('click', () => goTo(index + 1, true));

  // Botão de pausar/retomar
  const syncToggle = () => {
    btnToggle.setAttribute('aria-label', autoplay ? 'Pausar rotação automática' : 'Retomar rotação automática');
    btnToggle.querySelector('use').setAttribute('href', autoplay ? '#i-pause' : '#i-play');
  };
  btnToggle.addEventListener('click', () => { autoplay = !autoplay; syncToggle(); schedule(); });
  syncToggle();

  // Pausa enquanto o mouse ou o foco estiver sobre o slider
  root.addEventListener('mouseenter', () => { hovering = true; clearTimeout(timer); });
  root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
  root.addEventListener('focusin', () => { hovering = true; clearTimeout(timer); });
  root.addEventListener('focusout', () => { hovering = false; schedule(); });

  // Teclado: ← e → quando o slider está em foco
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { goTo(index - 1, true); e.preventDefault(); }
    if (e.key === 'ArrowRight') { goTo(index + 1, true); e.preventDefault(); }
  });

  // Arrastar (mouse e toque)
  let startX = 0, dx = 0, dragging = false;
  viewport.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button')) return;
    dragging = true; startX = e.clientX; dx = 0;
    track.classList.add('dragging');
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', e => {
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    const limit = Math.min(90, viewport.clientWidth * 0.15);   // quanto precisa arrastar para trocar
    if (dx < -limit) goTo(index + 1, true);
    else if (dx > limit) goTo(index - 1, true);
    else goTo(index);                                           // volta para o mesmo slide
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  goTo(0);
  schedule();
}

// ---------------------------------------------------------------------------
// 9) Botões Liquid Glass (.btn e .link-btn)
//    O visual está todo no CSS. Aqui só entram dois estados que o CSS sozinho
//    não cobre bem:
//    - .is-pressed: pressionado por mouse, toque ou teclado (Enter; Espaço em
//      <button>), já que :active não vale para toque no iOS nem para Enter;
//    - --lg-x / --lg-y: posição do ponteiro, para o reflexo acompanhar o mouse.
//    Os ouvintes ficam no document, são passivos e não cancelam nada, então
//    não interferem em cliques, links ou outros ouvintes dos botões.
// ---------------------------------------------------------------------------
function initLiquidButtons() {
  const SELECTOR = '.btn, .link-btn';
  const MIN_PRESS_MS = 140;          // toque rápido ou Enter ainda mostram o "afundar"
  const pressed = new Map();         // botão -> instante em que foi pressionado
  const buttonOf = target => (target instanceof Element ? target.closest(SELECTOR) : null);
  const press = el => { el.classList.add('is-pressed'); pressed.set(el, performance.now()); };
  const release = el => {
    const since = pressed.get(el);
    if (since === undefined) return;
    pressed.delete(el);
    const wait = MIN_PRESS_MS - (performance.now() - since);
    if (wait <= 0) { el.classList.remove('is-pressed'); return; }
    setTimeout(() => { if (!pressed.has(el)) el.classList.remove('is-pressed'); }, wait);
  };
  const releaseAll = () => [...pressed.keys()].forEach(release);
  const passive = { passive: true };

  document.addEventListener('pointerdown', e => {
    const el = buttonOf(e.target);
    if (el && (e.pointerType !== 'mouse' || e.button === 0)) press(el);
  }, passive);
  document.addEventListener('pointerup', releaseAll, passive);
  document.addEventListener('pointercancel', releaseAll, passive);
  // Saiu de cima do botão ainda segurando: solta (equivale ao mouseleave)
  document.addEventListener('pointerout', e => {
    const el = buttonOf(e.target);
    if (el && pressed.has(el) && !el.contains(e.relatedTarget)) release(el);
  }, passive);

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const el = buttonOf(e.target);
    if (!el) return;
    if (e.key === 'Enter' || (e.key === ' ' && el.tagName === 'BUTTON')) press(el);
  });
  document.addEventListener('keyup', releaseAll);
  document.addEventListener('focusout', e => { const el = buttonOf(e.target); if (el) release(el); });
  window.addEventListener('blur', releaseAll);
  // Voltar pelo histórico do navegador não pode trazer um botão "afundado"
  window.addEventListener('pageshow', releaseAll);

  // Foco pelo teclado: o reflexo volta para o centro do topo (padrão do CSS)
  document.addEventListener('focusin', e => {
    const el = buttonOf(e.target);
    if (el && el.matches(':focus-visible')) { el.style.removeProperty('--lg-x'); el.style.removeProperty('--lg-y'); }
  });

  // Reflexo segue o ponteiro (só mouse/caneta; sem isso ele fica fixo no topo)
  if (reduceMotion) return;
  let frame = 0, last = null;
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const el = buttonOf(e.target);
    if (!el) return;
    last = { el, x: e.clientX, y: e.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = last.el.getBoundingClientRect();
      last.el.style.setProperty('--lg-x', `${(last.x - r.left).toFixed(1)}px`);
      last.el.style.setProperty('--lg-y', `${(last.y - r.top).toFixed(1)}px`);
    });
  }, passive);
}
