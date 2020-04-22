const aside = document.querySelector('aside');
const form = document.querySelector('#mailForm');
const menuButton = document.querySelector('.menu-toggle');
const animDelay = 500;
const resizeEvent = { e: window.document.createEvent('UIEvents') };
let toggled = false;

window.addEventListener('resize', () => {
  if (window.innerWidth > 600) aside.classList.remove('collapsed');
  else aside.classList.add('collapsed');
});

aside.addEventListener('click', e => {
  if (toggled && (e.target === e.currentTarget || e.target.tagName === 'A')) toggleAside();
});

form.addEventListener('submit', e => {
  const data = {};
  [...new FormData(form).entries()].forEach(val => {
    data[val[0]] = val[1];
  });
  e.preventDefault();
  fetch('https://formsubmit.co/ajax/675141c9d9b4b45f144322cd4220e3e2', {
    method: 'POST',
    body: data
  }).then(() => {
      let cur = form;
      cur.reset();
      cur.innerHTML = "";
      cur = form.appendChild(document.createElement('p'));
      cur.textContent = `Thank you for your submission.  I will be sending my response to your inbox '${data.get('_replyto')}' unless otherwise specified.`;
    }).catch(err => console.error(err));
});

menuButton.addEventListener('click', toggleAside);


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
