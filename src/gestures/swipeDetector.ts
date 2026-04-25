export class SwipeDetector {
    private overlay: HTMLElement
    private startY: number = 0
    private startTime: number = 0
    private onSwipeUp: () => void

    private static SWIPE_THRESHOLD = 80
    private static VELOCITY_THRESHOLD = 0.3

    constructor(containerEl: HTMLElement, onSwipeUp: () => void) {
        this.onSwipeUp = onSwipeUp
        this.overlay = containerEl.createDiv({ cls: 'tab-overview-swipe-zone' })

        this.overlay.addEventListener('touchstart', this.handleTouchStart, { passive: true })
        this.overlay.addEventListener('touchend', this.handleTouchEnd, { passive: true })
    }

    private handleTouchStart = (e: TouchEvent) => {
        this.startY = e.touches[0].clientY
        this.startTime = performance.now()
    }

    private handleTouchEnd = (e: TouchEvent) => {
        const endY = e.changedTouches[0].clientY
        const deltaY = this.startY - endY
        const elapsed = performance.now() - this.startTime
        const velocity = deltaY / elapsed

        if (deltaY > SwipeDetector.SWIPE_THRESHOLD && velocity > SwipeDetector.VELOCITY_THRESHOLD) {
            this.onSwipeUp()
        }
    }

    destroy() {
        this.overlay.removeEventListener('touchstart', this.handleTouchStart)
        this.overlay.removeEventListener('touchend', this.handleTouchEnd)
        this.overlay.remove()
    }
}
