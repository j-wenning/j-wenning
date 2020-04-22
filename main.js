const aside = document.querySelector('aside');
const menuButton = document.querySelector('.menu-toggle');
const animDelay = 500;
const resizeEvent = { e: window.document.createEvent('UIEvents') };
let toggled = false;

window.addEventListener('resize', () => {
  if (window.innerWidth > 425) aside.classList.remove('collapsed');
  else aside.classList.add('collapsed');
});

menuButton.addEventListener('click', toggleAside);

aside.addEventListener('click', e => {
  if (toggled && e.target === e.currentTarget) toggleAside();
});

function toggleAside() {
  toggled = !toggled;
  aside.classList.toggle('collapsed');
  aside.classList.add('animating');
  setTimeout(() => {
    aside.classList.remove('animating');
  }, animDelay);
}

resizeEvent.e.initUIEvent('resize', true, false, window, 0);
window.dispatchEvent(resizeEvent.e);
delete resizeEvent.e;
