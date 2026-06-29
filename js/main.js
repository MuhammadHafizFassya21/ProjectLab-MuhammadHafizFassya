document.addEventListener('DOMContentLoaded', () => {
  // Update year
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Nav toggle (mobile)
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('navMenu');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      nav.classList.toggle('active');
      if (!nav.classList.contains('active')) {
        nav.style.display = ''; // Clear inline styles to let CSS handle display
      }
    });
  }
});
