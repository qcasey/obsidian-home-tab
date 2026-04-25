export class LongPressDetector {
    private startX: number = 0
    private startY: number = 0
    private startTime: number = 0
    private timeout: ReturnType<typeof setTimeout> | null = null
    private longPressTriggered: boolean = false

    private static MOVE_THRESHOLD = 10

    constructor(
        private element: HTMLElement,
        private onTap: () => void,
        private onLongPress: () => void,
        private durationMs: number
    ) {
        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true })
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: true })
        this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
        this.element.addEventListener('contextmenu', this.handleContextMenu)
        this.element.addEventListener('click', this.handleClick)
    }

    private handleTouchStart = (e: TouchEvent) => {
        this.startX = e.touches[0].clientX
        this.startY = e.touches[0].clientY
        this.startTime = performance.now()
        this.longPressTriggered = false

        this.element.style.setProperty('--toolbar-pair-press-duration', `${this.durationMs}ms`)
        this.element.classList.add('toolbar-pair-pressing')

        this.timeout = setTimeout(() => {
            this.longPressTriggered = true
            this.element.classList.remove('toolbar-pair-pressing')
            this.element.classList.add('toolbar-pair-activated')
            try { navigator.vibrate(50) } catch { /* not supported */ }
            this.onLongPress()
            setTimeout(() => this.element.classList.remove('toolbar-pair-activated'), 200)
        }, this.durationMs)
    }

    private handleTouchMove = (e: TouchEvent) => {
        const dx = e.touches[0].clientX - this.startX
        const dy = e.touches[0].clientY - this.startY
        if (Math.sqrt(dx * dx + dy * dy) > LongPressDetector.MOVE_THRESHOLD) {
            this.cancel()
        }
    }

    private handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault()
        if (this.longPressTriggered) {
            this.longPressTriggered = false
            return
        }
        this.cancel()
        this.onTap()
    }

    private handleContextMenu = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
    }

    private handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
    }

    private cancel() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
        this.element.classList.remove('toolbar-pair-pressing')
    }

    destroy() {
        this.cancel()
        this.element.removeEventListener('touchstart', this.handleTouchStart)
        this.element.removeEventListener('touchmove', this.handleTouchMove)
        this.element.removeEventListener('touchend', this.handleTouchEnd)
        this.element.removeEventListener('contextmenu', this.handleContextMenu)
        this.element.removeEventListener('click', this.handleClick)
    }
}
