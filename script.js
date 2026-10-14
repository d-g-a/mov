// Mobile navigation toggle
const toggle = document.querySelector('.nav__toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  links.classList.toggle('is-open', !open);
});

links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    links.classList.remove('is-open');
  }
});

// Newsletter form (front-end only — connect to your email provider here)
const form = document.getElementById('join-form');
const msg = document.getElementById('join-msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email address.';
    form.email.focus();
    return;
  }
  msg.textContent = '¡Gracias! You’re on the list.';
  form.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
