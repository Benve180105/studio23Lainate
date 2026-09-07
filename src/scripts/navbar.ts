import { getActiveSection } from '../lib/scroll-utils';

const sectionIds = ['home', 'servizi', 'team', 'contatti'];

function updateActiveLink() {
  const sections = sectionIds
    .map((id) => {
      const el = document.getElementById(id);
      return el ? { id, top: el.offsetTop - 80 } : null;
    })
    .filter((s): s is { id: string; top: number } => s !== null);

  if (sections.length === 0) return;

  const activeId = getActiveSection(sections, window.scrollY);
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.classList.toggle('text-brand-primary', link.getAttribute('data-nav-link') === activeId);
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
window.addEventListener('load', updateActiveLink);

const toggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav-links');

toggle?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.toggle('flex');
  mobileNav?.classList.toggle('hidden');
  toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.add('hidden');
    mobileNav.classList.remove('flex');
    toggle?.setAttribute('aria-expanded', 'false');
  });
});
