const elements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && elements.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
} else {
  elements.forEach((el) => el.classList.add('is-visible'));
}
