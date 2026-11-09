/* Site-specific behaviour: generic modals and YouTube embeds. */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Modals: any element with data-modal="id" opens <div id="id" class="modal">
  // ---------------------------------------------------------------------
  var lastTrigger = null;

  function openModal(id, trigger) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastTrigger = trigger || null;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    var close = modal.querySelector('.close');
    if (close) close.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // stop any playing media inside the modal
    modal.querySelectorAll('video').forEach(function (v) { v.pause(); });
    modal.querySelectorAll('iframe').forEach(function (f) { f.src = f.src; });
    if (lastTrigger) lastTrigger.focus();
  }

  function openModals() {
    return Array.prototype.filter.call(document.querySelectorAll('.modal'), function (m) {
      return m.style.display === 'block';
    });
  }

  document.querySelectorAll('[data-modal]').forEach(function (el) {
    el.addEventListener('click', function () { openModal(el.getAttribute('data-modal'), el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(el.getAttribute('data-modal'), el);
      }
    });
  });

  document.querySelectorAll('.modal').forEach(function (modal) {
    var close = modal.querySelector('.close');
    if (close) {
      close.setAttribute('tabindex', '0');
      close.setAttribute('role', 'button');
      close.addEventListener('click', function () { closeModal(modal); });
      close.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(modal); }
      });
    }
    // click on the dimmed backdrop closes
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
    // links inside a modal that jump elsewhere on the page close it first
    modal.querySelectorAll('[data-close-modal]').forEach(function (a) {
      a.addEventListener('click', function () { lastTrigger = null; closeModal(modal); });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') openModals().forEach(closeModal);
  });

  // ---------------------------------------------------------------------
  // Demo media: <div class="demo-media" data-youtube="VIDEO_ID">
  // Empty data-youtube shows a "video coming soon" placeholder.
  // ---------------------------------------------------------------------
  document.querySelectorAll('.demo-media[data-youtube]').forEach(function (box) {
    var id = (box.getAttribute('data-youtube') || '').trim();
    if (!id) {
      box.innerHTML = '<div class="demo-placeholder"><i class="ion-ios-videocam-outline"></i>Video coming soon</div>';
      return;
    }
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0';
    iframe.title = 'Demo video';
    iframe.loading = 'lazy';
    // YouTube rejects embeds without a Referer (error 153); send the origin explicitly.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    box.appendChild(iframe);
  });
})();
