/* Nelani Gunawardhana — site behaviour */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function initTheme() {
    var root = document.documentElement, btn = $('#theme-toggle');
    if (!btn) return;
    function apply(t) {
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('ng-theme', t); } catch (e) {}
      btn.textContent = t === 'dark' ? '☀' : '☾';
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    apply(root.getAttribute('data-theme') || 'light');
    btn.addEventListener('click', function () { apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  }

  function initMenu() {
    var toggle = $('#menu-toggle'), nav = $('#primary-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    var groups = $$('.nav-group', nav);
    function closeAll() { groups.forEach(function (o) { o.classList.remove('open'); $('.nav-btn', o).setAttribute('aria-expanded', 'false'); }); }
    groups.forEach(function (g) {
      var b = $('.nav-btn', g);
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var willOpen = !g.classList.contains('open');
        closeAll();
        if (willOpen) { g.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
    nav.addEventListener('click', function (ev) { ev.stopPropagation(); });
    document.addEventListener('click', function () { closeAll(); nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { closeAll(); nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  function initReveal() {
    var items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.04, rootMargin: '0px 0px -30px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* CV buttons: if the PDF is missing (checked only over http/https), show "coming soon". */
  function initCv() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    $$('.cv-link').forEach(function (a) {
      fetch(a.getAttribute('href'), { method: 'HEAD' }).then(function (r) { if (!r.ok) throw new Error('missing'); }).catch(function () {
        a.textContent = a.dataset.fallback || 'CV — coming soon';
        a.removeAttribute('download'); a.classList.add('is-disabled'); a.setAttribute('aria-disabled', 'true');
        a.addEventListener('click', function (e) { e.preventDefault(); });
      });
    });
  }

  /* Scroll progress, header shadow, back-to-top */
  function initScroll() {
    var bar = $('.progress'), header = $('.site-header'), top = $('.to-top');
    function on() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight, y = window.pageYOffset;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (top) top.classList.toggle('show', y > 700);
    }
    window.addEventListener('scroll', on, { passive: true }); on();
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* Tables: add data-labels so they stack as cards on phones */
  function initTables() {
    $$('.table-wrap').forEach(function (w) {
      var t = $('table', w); if (!t) return;
      var heads = $$('thead th', t).map(function (th) { return th.textContent.trim(); });
      if (!heads.length) return;
      w.classList.add('table-wrap--stack');
      $$('tbody tr', t).forEach(function (tr) {
        $$('td', tr).forEach(function (td, i) { if (heads[i]) td.setAttribute('data-label', heads[i]); });
      });
    });
  }

  /* GPA ring */
  function initRing() {
    var r = $('.gpa-bar'); if (!r) return;
    if (!('IntersectionObserver' in window)) { r.classList.add('is-visible'); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { r.classList.add('is-visible'); io.disconnect(); } }); }, { threshold: 0.3 });
    io.observe(r);
  }

  /* Lightbox: any <a class="shot" data-lightbox="group"> */
  function initLightbox() {
    var links = $$('a[data-lightbox]'); if (!links.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<button class="lb-btn lb-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
      '<div class="lb-stage"><img alt=""></div>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
      '<div class="lb-cap"></div>';
    document.body.appendChild(box);
    var img = $('img', box), cap = $('.lb-cap', box), prev = $('.lb-prev', box), next = $('.lb-next', box);
    var set = [], idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + set.length) % set.length;
      var a = set[idx];
      img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-alt') || '';
      cap.innerHTML = '';
      var t = document.createElement('span'); t.textContent = a.getAttribute('data-caption') || ''; cap.appendChild(t);
      if (set.length > 1) { var s = document.createElement('small'); s.textContent = (idx + 1) + ' / ' + set.length; cap.appendChild(s); }
      prev.hidden = next.hidden = set.length < 2;
    }
    function open(a) {
      var g = a.getAttribute('data-lightbox');
      set = links.filter(function (l) { return l.getAttribute('data-lightbox') === g; });
      lastFocus = document.activeElement;
      box.classList.add('open'); document.body.style.overflow = 'hidden';
      show(set.indexOf(a)); $('.lb-close', box).focus();
    }
    function close() { box.classList.remove('open'); document.body.style.overflow = ''; img.src = ''; if (lastFocus) lastFocus.focus(); }
    links.forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(a); }); });
    prev.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    $('.lb-close', box).addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null;
    });
  }

  /* Copy email */
  function initCopy() {
    $$('.btn-copy').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copy'), label = $('span', b), old = label.textContent;
        function done() { b.classList.add('is-done'); label.textContent = 'Copied!'; setTimeout(function () { b.classList.remove('is-done'); label.textContent = old; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () { window.prompt('Copy the email address:', txt); }); }
        else { window.prompt('Copy the email address:', txt); }
      });
    });
  }

  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    initTheme(); initMenu(); initTables(); initReveal(); initCv(); initScroll(); initRing(); initLightbox(); initCopy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
