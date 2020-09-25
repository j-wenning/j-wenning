const aside = document.querySelector('aside');
const menuButton = document.querySelector('#menu');
const form = document.querySelector('#form');
const submitButton = document.querySelector('#submit');
const resizeEvent = { e: window.document.createEvent('UIEvents') };
const formVals = {};
const formValChecks = {
  name: false,
  phone: true,
  subject: false,
  msg: false
};
const animDelay = 500;
let toggled = false;
let canSubmit = false;

window.addEventListener('resize', () => {
  if (window.innerWidth > 600) aside.classList.remove('collapsed');
  else aside.classList.add('collapsed');
});

aside.addEventListener('click', e => {
  if (toggled && (e.target === e.currentTarget || e.target.tagName === 'A')) toggleAside();
});

menuButton.addEventListener('click', toggleAside);

form.addEventListener('submit', e => {
  checkAll();
  if (canSubmit) {
    const payload = new FormData(form);
    e.preventDefault();
    fetch('https://formsubmit.co/ajax/675141c9d9b4b45f144322cd4220e3e2', {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'same-origin',
      body: payload
    }).then(() => {
      let cur = form;
      cur.reset();
      cur.innerHTML = "";
      cur = form.appendChild(document.createElement('p'));
      cur.textContent = `Thank you for your submission.  I will be sending my response to your inbox '${payload.get('_replyto')}' unless otherwise specified.`;
    }).catch(err => console.error(err));
  }
});

form.addEventListener('input', e => {
  let temp;
  e = e.target;
  switch (e.id) {
    case 'name':
      e.value = e.value.replace(/\s+/g, ' ').replace(/(?!'| |\.)\W|\d/gi, '').trimStart().substr(0, 65);
      break;
    case 'phone':
      if (formVals.phone && formVals.phone.length < e.value.length) {
        e.value = e.value.replace(/\D/g, '');
        temp = e.value.match(/\d{3}/g);
        if (temp && temp[0]) {
          e.value = `(${temp[0]}) ${temp[1] ? temp[1] : e.value.substr(3)} ${e.value.substr(6, 4)}`
        }
      }
      break;
  }
  formVals[e.id] = e.value.trim();
  checkAll();
});

[...document.querySelectorAll('form input, form textarea')].forEach(elem => {
  elem.addEventListener('blur', () => handleBlur(elem.id));
});

[...document.querySelectorAll('li button')].forEach(elem => {
  elem.addEventListener('click', () => {
    const div = elem.nextElementSibling.classList;
    const icon = elem.lastElementChild.firstElementChild.classList;
    div.toggle('hidden');
    icon.toggle('fa-caret-down');
    icon.toggle('fa-caret-up');
  });
});

function handleBlur(id) {
  if (!formValChecks[id]) document.querySelector(`#${id}-err`).classList.remove('hidden');
}

function checkAll() {
  let canSubmitCheck = true;
  ['name', 'email', 'phone', 'subject', 'msg'].forEach(val => {
    if(!isValid(val)) canSubmitCheck = false;
  });
  canSubmit = canSubmitCheck;
  if (canSubmit) submitButton.removeAttribute('disabled');
}

function isValid(val) {
  switch (val) {
    case 'name':
      formValChecks[val] = formVals[val] && formVals[val].length > 4;
      break;
    case 'email':
      formValChecks[val] = formVals[val] && /\w+@\w+\.\w/g.test(formVals[val]);
      break;
    case 'phone':
      formValChecks[val] = !formVals[val] || (formVals[val] && (formVals[val].length === 14 || formVals[val].length === 0));
      break;
    case 'subject':
      formValChecks[val] = formVals[val] && formVals[val].length > 5;
      break;
    case 'msg':
      formValChecks[val] = formVals[val] && formVals[val].length > 9;
      break;
  }
  if (formValChecks[val]) document.querySelector(`#${val}-err`).classList.add('hidden');
  else canSubmit = false;
  return formValChecks[val];
}

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
