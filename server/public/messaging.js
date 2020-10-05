const MS_TO_S = 1000;
const S_TO_MIN = 60;
const RESTAMP_WAIT_TIME = 5 * MS_TO_S * S_TO_MIN;
const SLEEP_TIMEOUT = 1.5 * MS_TO_S * S_TO_MIN;
const NOTIFICATION_VOLUME = 0.15;
const divModal = document.getElementById('divModal');
const h2Author = document.getElementById('h2Author');
const formAuthor = document.getElementById('formAuthor');
const inputAuthor = document.getElementById('inputAuthor');
const pAuthor = document.getElementById('pAuthor');
const spanAuthor = document.getElementById('spanAuthor');
const buttonConnect = document.getElementById('buttonConnect');
const buttonSubmit = document.getElementById('buttonSubmit');
const divMessages = document.getElementById('divMessages');
const formMessage = document.getElementById('formMessage');
const notificationSound = new Audio('assets/sounds/notification.wav');
let isConnected = false;
let isResetting = false;
let isSleeping = false;
let author = 'anonymous';
let socketSend;
let socketNameChange;
let timeoutSleep;

const fullTrim = str => str.trim().replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g,'  ');
const dispatchNewMsg = (isOwnMsg, author, timeStamp, msgContent) => divMessages.dispatchEvent(new CustomEvent('newMsg', {
        detail: { isOwnMsg, author, timeStamp, msgContent }
}));
const dispatchNameChange = author => document.dispatchEvent(new CustomEvent('nameChange', {
        detail: { author }
}));
const sendMessage = msg => {
    const timeStamp = Date.now();
    const msgContent = fullTrim(msg);
    socketSend(author, timeStamp, msgContent);
    dispatchNewMsg(true, author, timeStamp, msgContent);
};
const refreshSleepTimeout = () => {
    isSleeping = false;
    if (timeoutSleep) window.clearTimeout(timeoutSleep);
    timeoutSleep = window.setTimeout(() => {
        isSleeping = true
        timeoutSleep = null;
    }, SLEEP_TIMEOUT);
};

notificationSound.volume = NOTIFICATION_VOLUME;

formAuthor.addEventListener('submit', e => {
    const data = new FormData(e.currentTarget)
    const author = fullTrim(data.get('author')).substr(0, 16);
    e.preventDefault();
    dispatchNameChange(author);
});

pAuthor.addEventListener('click', () => {
    h2Author.textContent = 'Would you like to change your name?';
    inputAuthor.val = author;
    divModal.classList.remove('closed');
});

buttonConnect.addEventListener('click', () => {
    const socket = io(`wss://jwenning.digital`);
    socket.on('message', data => {
        const { author, timeStamp, msgContent } = data;
        dispatchNewMsg(false, author, timeStamp, msgContent);
    });
    socketSend = (author, timeStamp, msgContent) => socket.send({ author, timeStamp, msgContent });
    socketNameChange = author => socket.emit('nameChange', { author });
    socketNameChange(author);
    buttonConnect.classList.add('closed');
    buttonSubmit.classList.remove('closed');
    spanAuthor.parentElement.TEXT_NODE = spanAuthor.parentElement.textContent.replace('Connecting', 'Connected');
    isConnected = true;
});

formMessage.addEventListener('submit', e => {
    const data = new FormData(e.currentTarget);
    const msg = data.get('message');
    e.preventDefault();
    if (isResetting || msg === '') return;
    sendMessage(msg);
    isResetting = true;
    window.setTimeout(elem => {
        elem.reset();
        isResetting = false;
    }, 0, e.currentTarget); 
});

formMessage.addEventListener('keydown', e => {
    if (!e.shiftKey && e.code === 'Enter' && isConnected) {
        formMessage.dispatchEvent(new Event('submit'));
    }
});

divMessages.addEventListener('newMsg', e => {
    const { isOwnMsg, author, timeStamp, msgContent } = e.detail;
    const msg = document.createElement('div');
    const date = new Date(timeStamp);
    const pMsgDetails = document.createElement('p');
    const pMsgContent = document.createElement('p');
    msg.setAttribute('isOwnMsg', isOwnMsg);
    msg.setAttribute('timeStamp', timeStamp);
    msg.setAttribute('author', author)
    if (!isOwnMsg && isSleeping && !/^\[Justin is currently offline\]$/.test(msgContent)) {
        notificationSound.play();
    }
    if (!divMessages.lastElementChild) msg.appendChild(pMsgDetails);
    else {
        if (divMessages.lastElementChild.getAttribute('isOwnMsg') === `${isOwnMsg}`) {
            msg.classList.add('p-t-0');
        } 
        if (divMessages.lastElementChild.getAttribute('isOwnMsg') !== `${isOwnMsg}`
            || divMessages.lastElementChild.getAttribute('author') !== author
            || Date.now() - parseInt(divMessages.lastElementChild.getAttribute('timeStamp')) > RESTAMP_WAIT_TIME) {
            msg.appendChild(pMsgDetails);
        }
    }
    if (author === 'System' && !isOwnMsg) msg.classList.add('color-darkred', 'bg-yellow')
    msg.classList.add('w-100', 'p-f5', e.detail.isOwnMsg ? 'bg-gray' : 'bg-white');
    pMsgContent.classList.add('whitespace-pre');
    pMsgDetails.textContent = `${author}\t[${date.toLocaleDateString()} - ${date.toLocaleTimeString()}]`;
    pMsgContent.textContent = `${msgContent}`.replace(/\n/g, '\r\n');
    msg.appendChild(pMsgContent);
    divMessages.appendChild(msg);
    divMessages.scrollTop = divMessages.scrollHeight;
});

document.addEventListener('nameChange', e => {
    if (e.detail.author === '') return;
    if (e.detail.author !== author) {
        author = e.detail.author;
        spanAuthor.textContent = author;
        if (socketNameChange) socketNameChange(author);
    }
    divModal.classList.add('closed');
});

document.addEventListener('mousemove', () => refreshSleepTimeout());
document.addEventListener('keydown', () => refreshSleepTimeout());
window.addEventListener('focus', () => refreshSleepTimeout());
window.addEventListener('blur', () => isSleeping = true);