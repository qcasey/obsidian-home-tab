const DURATION = 350
const EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

function waitForTransition(el: HTMLElement): Promise<void> {
    return new Promise(resolve => {
        const handler = () => {
            el.removeEventListener('transitionend', handler)
            resolve()
        }
        el.addEventListener('transitionend', handler)
    })
}

export async function animateOpen(
    workspaceEl: HTMLElement,
    overviewEl: HTMLElement,
    activeCardEl: HTMLElement | null
): Promise<void> {
    // Prepare workspace for animation
    workspaceEl.style.willChange = 'transform, border-radius, opacity'
    workspaceEl.style.transition = `transform ${DURATION}ms ${EASING}, border-radius ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`

    // Prepare overview
    overviewEl.style.willChange = 'opacity'
    overviewEl.style.opacity = '0'
    overviewEl.style.transition = `opacity ${DURATION}ms ${EASING}`
    overviewEl.style.display = 'flex'

    // Prepare active card
    if (activeCardEl) {
        activeCardEl.style.willChange = 'transform'
        activeCardEl.style.transition = `transform ${DURATION}ms ${EASING}`
        activeCardEl.style.transform = 'scale(1.15)'
    }

    // Stagger other cards
    const cards = overviewEl.querySelectorAll<HTMLElement>('.tab-card:not(.tab-card--active)')
    cards.forEach((card, i) => {
        card.style.willChange = 'opacity, transform'
        card.style.opacity = '0'
        card.style.transform = 'scale(0.9)'
        card.style.transition = `opacity ${DURATION}ms ${EASING} ${i * 30}ms, transform ${DURATION}ms ${EASING} ${i * 30}ms`
    })

    // Force layout flush
    void overviewEl.offsetHeight

    // Animate
    workspaceEl.style.transform = 'scale(0.85)'
    workspaceEl.style.borderRadius = '12px'
    workspaceEl.style.opacity = '0.4'
    overviewEl.style.opacity = '1'

    if (activeCardEl) {
        activeCardEl.style.transform = 'scale(1)'
    }
    cards.forEach(card => {
        card.style.opacity = '1'
        card.style.transform = 'scale(1)'
    })

    await waitForTransition(overviewEl)

    // Cleanup will-change
    workspaceEl.style.willChange = ''
    overviewEl.style.willChange = ''
    if (activeCardEl) activeCardEl.style.willChange = ''
    cards.forEach(card => { card.style.willChange = '' })
}

export async function animateClose(
    workspaceEl: HTMLElement,
    overviewEl: HTMLElement,
    selectedCardEl: HTMLElement | null
): Promise<void> {
    workspaceEl.style.willChange = 'transform, border-radius, opacity'
    workspaceEl.style.transition = `transform ${DURATION}ms ${EASING}, border-radius ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`

    overviewEl.style.willChange = 'opacity'
    overviewEl.style.transition = `opacity ${DURATION}ms ${EASING}`

    if (selectedCardEl) {
        selectedCardEl.style.willChange = 'transform'
        selectedCardEl.style.transition = `transform ${DURATION}ms ${EASING}`
    }

    const otherCards = overviewEl.querySelectorAll<HTMLElement>('.tab-card:not(.tab-card--active)')
    otherCards.forEach(card => {
        card.style.willChange = 'opacity'
        card.style.transition = `opacity ${DURATION * 0.6}ms ${EASING}`
    })

    // Force layout flush
    void overviewEl.offsetHeight

    // Animate
    workspaceEl.style.transform = 'scale(1)'
    workspaceEl.style.borderRadius = '0px'
    workspaceEl.style.opacity = '1'
    overviewEl.style.opacity = '0'

    if (selectedCardEl) {
        selectedCardEl.style.transform = 'scale(1.15)'
    }
    otherCards.forEach(card => {
        card.style.opacity = '0'
    })

    await waitForTransition(workspaceEl)

    // Reset all inline styles
    workspaceEl.style.cssText = ''
    overviewEl.style.display = 'none'
    overviewEl.style.cssText = ''

    if (selectedCardEl) selectedCardEl.style.cssText = ''
    otherCards.forEach(card => { card.style.cssText = '' })
}
