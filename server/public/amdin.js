const divMessages = document.getElementById('divMessages');
const formMessage = document.getElementById('formMessage');
const notification = new Audio('assets/sounds/notification.wav');
const NOTIFICATION_VOL = 0.25;
const SLEEP_TIMEOUT = 1.5 * (1000 * 60 * 60);

let sock;
let sendMsg;
let isResetting = false;
let isSleep = false;
let sleepTimeout;

const appendMsg = data => {
    const { author, timeStamp, msgContent } = data;
    const recipient = data.recipient;
    const el = document.createElement('pre');
    divMessages.appendChild(el);
    el.textContent = `${author} ${new Date(timeStamp).toLocaleString()}${recipient ? ' => ' + recipient: ''}\n${msgContent}`;
    divMessages.scrollTop = divMessages.scrollHeight;
    if (isSleep) notification.play();
};
const refreshSleepTimeout = () => {
    isSleep = false;
    if (sleepTimeout) window.clearTimeout(sleepTimeout);
    sleepTimeout = window.setTimeout(() => isSleep = true, SLEEP_TIMEOUT);
};

notification.volume = NOTIFICATION_VOL;

document.getElementById('formLogin').addEventListener('submit', e => {
    const data = new FormData(e.currentTarget);
    e.preventDefault();
    fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u: data.get('u'), p: data.get('p') })
    })  .then(res => res.json())
        .then (data => {
            while(divMessages.firstElementChild) divMessages.removeChild(divMessages.lastElementChild);
            JSON.parse(data).forEach(item => appendMsg(item));
            sock = io('wss://jwenning.digital', { query: { cookie: document.cookie } });
            sock.on('message', data => appendMsg(data));
            sendMsg = data => sock.send(data);
        })  .catch(err => console.error(err));
    e.currentTarget.reset();
});

formMessage.addEventListener('keydown', e =>{
    if (!e.shiftKey && e.code === 'Enter') formMessage.dispatchEvent(new Event('submit'));
});

formMessage.addEventListener('submit', e =>{
    const data = new FormData(e.currentTarget);
    const msg = data.get('msg');
    e.preventDefault();
    if (isResetting || msg === '') return;
    sendMsg(msg);
    isResetting = true;
    window.setTimeout(elem => {
        elem.reset();
        isResetting = false;
    }, 0, e.currentTarget); 
});

document.addEventListener('mousemove', () => refreshSleepTimeout());
document.addEventListener('keydown', () => refreshSleepTimeout());
window.addEventListener('focus', () => refreshSleepTimeout());
window.addEventListener('blur', () => isSleep = true);