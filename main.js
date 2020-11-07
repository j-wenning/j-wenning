(() => {
    const MS_TO_S = 1000
    const X_SWIPE_MIN = 75
    const Y_SWIPE_MAX = 150
    const mailStr = 'wenning[dot]justin[at]gmail[dot]com'.replace(/\[dot\]/g, '.').replace(/\[at\]/g, '@')
    const phoneStr = '[lpar]714[rpar] 726[hyph]3180'.replace(/\[lpar\]/g, '(').replace(/\[rpar\]/g, ')').replace(/\[hyph\]/g, '-')
    const menuButton = document.querySelector('#menuButton')
    const menuCloser = document.querySelector('#menuCloser')
    const menu = document.querySelector('#menu')
    const mail = document.querySelector('#mail')
    const phone = document.querySelector('#phone')
    const sections = []
    let curIndex = 0
    let sectionDelay = 200
    let curSectionInterval
    let touchPointIni
    let touchPointEnd
    let touchPointDif

    const getSection = index => index < 0 ? sections?.length + (index % sections?.length) : index % sections?.length
    const getAdjSection = (direction, index = curIndex) => getSection(index + Math.sign(direction))
    const nextSection = direction => {
        const indexNext = getAdjSection(direction)
        let curSection = sections[curIndex]
        let sectionL = sections[getAdjSection(-1)]
        let sectionR = sections[getAdjSection(1)]

        curSection.classList.add('fixed')
        curSection.classList.add('hidden')
        sectionL.classList.add('hidden')
        sectionR.classList.add('hidden')
        sectionL.classList.remove('-z-1')
        sectionR.classList.remove('-z-1')
        sectionL.classList.remove('-translate-x-full')
        sectionR.classList.remove('translate-x-full')

        curIndex = indexNext
        curSection = sections[curIndex]
        sectionL = sections[getAdjSection(-1)]
        sectionR = sections[getAdjSection(1)]

        curSection.classList.remove('fixed')
        curSection.classList.remove('hidden')
        sectionL.classList.remove('hidden')
        sectionR.classList.remove('hidden')
        sectionL.classList.add('-z-1')
        sectionR.classList.add('-z-1')
        sectionL.classList.add('-translate-x-full')
        sectionR.classList.add('translate-x-full')
    }
    const setSection = (index, interval = sectionDelay) => {
        const nextIndex = getSection(index)
        let _curIndex = curIndex
        let distanceR = 0
        let distanceL = 0

        while (_curIndex != nextIndex) {
            _curIndex = getAdjSection(1, _curIndex)
            ++distanceR
        }
        _curIndex = curIndex
        while (_curIndex != nextIndex) {
            _curIndex = getAdjSection(-1, _curIndex)
            ++distanceL
        }
        _curIndex = curIndex
        clearInterval(curSectionInterval)
        curSectionInterval = setInterval(() => {
            if (distanceR === 0 && distanceL === 0) nextSection(0)
            else nextSection(distanceR <= distanceL ? 1 : -1)
            if (curIndex === nextIndex) clearInterval(curSectionInterval)
        }, interval)
    }
    const setMenuOffset = () => document.documentElement.style.setProperty(
        '--menu-offset',
        (['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom']
            .reduce((a, prop) =>
                a += parseInt(getComputedStyle(menuButton).getPropertyValue(prop))
            , 0) || 0) + 'px'
    )
    const getMouseAsTouch = (e, touchName) => Object.assign(new Event(touchName), {
        touches: [ { clientX: e.clientX, clientY: e.clientY } ]
    })

    {
        const menuTransitionDur = parseFloat(getComputedStyle(menu).transitionDuration) * MS_TO_S

        document.querySelectorAll('#menu button').forEach((el, index) => {
            if (el.classList.contains('forSection')) {
                sections.push(document.querySelector('#' + el.id.replace('Button', 'Section')))
                el.addEventListener('click', () => setSection(index))
            }
            else if (el.classList.contains('nextSection')) {
                el.addEventListener('click', () => nextSection(parseInt(el.getAttribute('data-dir'))))
                return
            }
            el.addEventListener('click', () => {
                menu.classList.toggle('menu-translate-y')
                setTimeout(
                    () => menuCloser.classList.toggle('hidden'),
                    menu.classList.contains('menu-translate-y') ? 0 : menuTransitionDur
                )
            })
        })
    }

    document.querySelectorAll('#appsSection button').forEach(el => {
        const nextElTiming = parseFloat(getComputedStyle(el.nextElementSibling).transitionDuration) * MS_TO_S
        el.addEventListener('click', () => {
            const toggled = el.nextElementSibling.classList.contains('hidden')
            el.classList.toggle('border-solid')
            setTimeout(() => el.nextElementSibling.classList.toggle('hidden'), toggled ? 0 : nextElTiming)
            setTimeout(() => el.nextElementSibling.classList.toggle('scale-y-0'), 10)
        })
    })

    document.addEventListener('mousedown', e => document.dispatchEvent(getMouseAsTouch(e, 'touchstart')))
    document.addEventListener('mousemove', e => {
        if (!window.getSelection().toString())
        document.dispatchEvent(getMouseAsTouch(e, 'touchmove'))
    })
    document.addEventListener('mouseup', e => document.dispatchEvent(getMouseAsTouch(e, 'touchend')))
    document.addEventListener('touchstart', e => touchPointIni = { x: e.touches[0].clientX, y: e.touches[0].clientY })
    document.addEventListener('touchmove', e => {
        touchPointEnd = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        touchPointDif = { x: touchPointEnd?.x - touchPointIni?.x, y: touchPointIni?.y - touchPointEnd?.y }
        if (Math.abs(touchPointDif.x) > X_SWIPE_MIN / 2) {
            document.documentElement.style.setProperty('--swipe-offset', -touchPointDif.x / 2 + 'px')
        }
    })
    document.addEventListener('touchend', e => {
        if (Math.abs(touchPointDif?.x) > X_SWIPE_MIN && Math.abs(touchPointDif?.y) < Y_SWIPE_MAX) {
            nextSection(-touchPointDif.x)
        }
        touchPointIni = touchPointEnd = touchPointDif = null
        document.documentElement.style.setProperty('--swipe-offset', '0px')
    })

    document.addEventListener('dragstart', e => document.dispatchEvent(new Event('touchend')))

    document.addEventListener('keydown', e => {
        const key = e.key
        if (key === 'ArrowLeft' || key === 'a') nextSection(-1)
        else if (key === 'ArrowRight' || key === 'd') nextSection(1)
    })

    window.addEventListener('resize', () => {
        menu.classList.add('menu-translate-y')
        menuCloser.classList.add('hidden')
        setMenuOffset()
    })

    mail.setAttribute('href', 'mailto:' + mailStr)

    phone.setAttribute('href', 'tel:' + phoneStr)

    mail.textContent = mailStr

    phone.textContent = phoneStr

    sectionDelay = parseFloat(getComputedStyle(sections[0]).transitionDuration) * MS_TO_S

    setSection(0, 0)

    setMenuOffset()
})()
