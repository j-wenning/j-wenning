const MS_TO_S = 1000;
const W_MOBILE = 800;
const POS = 1;
const ZRO = 0;
const NEG = -1;
const BUTTON_SCALE_PADDLE = 0.2;
const divTop = document.getElementById("divTop");
const divBot = document.getElementById("divBot");
const navTop = document.getElementById("navTop");
const navBot = document.getElementById("navBot");
const buttonsNav = [...document.getElementsByClassName("button-nav")];
const divWelcome = document.getElementById("divWelcome");
const buttonPaddleL = document.getElementById("buttonPaddleL");
const buttonPaddleR = document.getElementById("buttonPaddleR");
const buttonEnter = document.getElementById("buttonEnter");
const buttonResume = document.getElementById("buttonResume");
const divDownload = document.getElementById("divDownload");
const buttonDownloadClose = document.getElementById("buttonDownloadClose");
const linkDownload = document.getElementById("linkDownload")
const linesUrlMobile = "assets/images/lines-mobile.svg";
const linesUrlDesktop = "assets/images/lines-desktop.svg";
const divWelcomeTime = parseFloat(getComputedStyle(divWelcome).transitionDuration) * MS_TO_S;

const divs = new Array();
let divsTime;
let indexCur = ZRO;
let intervalCur;

const getDiv = index => index < 0 ? divs.length + (index % divs.length) : index % divs.length;
const getDivAdj = (direction, index = indexCur) => getDiv(index + Math.sign(direction));
const divNext = direction => {
    const indexNext = getDivAdj(direction);
    let divCur = divs[indexCur];
    let divL = divs[getDivAdj(NEG)];
    let divR = divs[getDivAdj(POS)];

    divCur.classList.add("closed");
    divL.classList.add("closed");
    divL.classList.remove("left", "translate-left-84", "opacity-f5");
    divL.firstElementChild.classList.remove("scale-f75");
    divR.classList.add("closed");
    divR.classList.remove("right", "translate-right-84", "opacity-f5");
    divR.firstElementChild.classList.remove("scale-f75");

    indexCur = indexNext
    divCur = divs[indexCur];
    divL = divs[getDivAdj(NEG)];
    divR = divs[getDivAdj(POS)];

    divCur.classList.remove("closed");
    divL.classList.remove("closed");
    divL.classList.add("left", "translate-left-84", "opacity-f5");
    divL.firstElementChild.classList.add("scale-f75");
    divR.classList.remove("closed");
    divR.classList.add("right", "translate-right-84", "opacity-f5");
    divR.firstElementChild.classList.add("scale-f75");
}
const divCurSet = (index, interval = divsTime, force = false) => {
    if (index === indexCur && !force) return indexCur;

    const indexNext = getDiv(index);
    let _indexCur = indexCur;
    let distanceR = ZRO;
    let distanceL = ZRO;
    
    while (_indexCur != indexNext) {
        _indexCur = getDivAdj(POS, _indexCur);
        ++distanceR;
    }    
    _indexCur = indexCur;
    while (_indexCur != indexNext) {
        _indexCur = getDivAdj(NEG, _indexCur);
        ++distanceL;
    }
    _indexCur = indexCur;
    clearInterval(intervalCur);
    intervalCur = setInterval(() => {
        divNext(distanceR <= distanceL ? POS : NEG);
        if (indexCur === indexNext) clearInterval(intervalCur);
    }, interval);
    
    return indexCur;
}

buttonsNav.forEach((button, index) => {
    divs.push(document.getElementById(button.id.replace("button", "div")));
    button.addEventListener("click", () => divCurSet(index));
});

divsTime = parseFloat(getComputedStyle(divs[ZRO]).transitionDuration) * MS_TO_S;

Object.freeze(divs);

buttonEnter.addEventListener("click", () => {
    divWelcome.classList.add("opacity-0");
    divTop.classList.add("pos-rt");
    divBot.classList.add("pos-rt");
    navTop.classList.remove("translate-left-125");
    navBot.classList.remove("translate-right-125");
    setTimeout(() => {
        divWelcome.classList.add("closed");
        divWelcome.classList.remove("opacity-0");
    }, divWelcomeTime);
});

buttonPaddleL.addEventListener("click", () => divNext(NEG));
buttonPaddleR.addEventListener("click", () => divNext(POS));

divCurSet(indexCur, ZRO, true);

divDownload.addEventListener("click", e => {
    if (e.target !== e.currentTarget) return;
    divDownload.classList.toggle("closed");
});
[buttonResume, buttonDownloadClose, linkDownload].forEach(elem => 
    elem.addEventListener("click", () => divDownload.classList.toggle("closed")));

window.addEventListener("resize", () => {
    divTop.setAttribute("src", window.innerWidth < W_MOBILE ? linesUrlMobile : linesUrlDesktop);
    divBot.setAttribute("src", window.innerWidth < W_MOBILE ? linesUrlMobile : linesUrlDesktop);
    buttonPaddleL.getElementsByClassName("imgPaddle")[ZRO].setAttribute("height", window.innerHeight * BUTTON_SCALE_PADDLE);
    buttonPaddleR.getElementsByClassName("imgPaddle")[ZRO].setAttribute("height", window.innerHeight * BUTTON_SCALE_PADDLE);
});

document.addEventListener("wheel", e => {
    if (!divWelcome.classList.contains("closed")) return;
    divNext(e.deltaY);
});

document.addEventListener("dragstart", e => e.preventDefault());

window.dispatchEvent(new Event("resize"));