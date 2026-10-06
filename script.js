// Flammy — interações do site

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const mnav = document.getElementById('mnav');

  // Abre/fecha o menu mobile
  if (burger && mnav) {
    burger.addEventListener('click', () => {
      const isOpen = mnav.style.display === 'block';
      mnav.style.display = isOpen ? 'none' : 'block';
      burger.setAttribute('aria-expanded', String(!isOpen));
    });

    // Fecha o menu mobile ao clicar em um link
    mnav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mnav.style.display = 'none';
      });
    });
  }

  // Header muda de aparência ao rolar a página
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 12);
    });
  }
});
