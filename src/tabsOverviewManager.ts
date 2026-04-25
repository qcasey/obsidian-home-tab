import type { App, WorkspaceLeaf } from 'obsidian'
import TabsOverview from './ui/tabsOverview.svelte'
import { animateOpen, animateClose } from './animations/tabTransition'
import { tabsOverviewOpen } from './store'

export class TabsOverviewManager {
    private app: App
    private containerEl: HTMLElement
    private component: TabsOverview | null = null
    private isAnimating: boolean = false
    private isOpen: boolean = false

    constructor(app: App) {
        this.app = app
        this.containerEl = document.body.createDiv({ cls: 'tab-overview-container' })
        this.containerEl.style.display = 'none'
    }

    async open() {
        if (this.isAnimating || this.isOpen) return
        this.isAnimating = true
        this.isOpen = true
        tabsOverviewOpen.set(true)

        // Mount Svelte component
        this.component = new TabsOverview({
            target: this.containerEl,
            props: { app: this.app }
        })

        this.component.$on('tabSelect', (e: CustomEvent<{ leaf: WorkspaceLeaf; leafId: string }>) => {
            this.selectTab(e.detail.leaf, e.detail.leafId)
        })
        this.component.$on('close', () => this.close())
        this.component.$on('empty', () => this.close())

        // Animate
        const workspaceEl = this.app.workspace.containerEl
        const activeCardEl = this.containerEl.querySelector<HTMLElement>('.tab-card--active')

        await animateOpen(workspaceEl, this.containerEl, activeCardEl)
        this.isAnimating = false
    }

    async close() {
        if (this.isAnimating || !this.isOpen) return
        this.isAnimating = true

        const workspaceEl = this.app.workspace.containerEl
        const activeCardEl = this.containerEl.querySelector<HTMLElement>('.tab-card--active')

        await animateClose(workspaceEl, this.containerEl, activeCardEl)

        this.component?.$destroy()
        this.component = null
        this.isOpen = false
        this.isAnimating = false
        tabsOverviewOpen.set(false)
    }

    private async selectTab(leaf: WorkspaceLeaf, leafId: string) {
        if (this.isAnimating) return
        this.isAnimating = true

        const workspaceEl = this.app.workspace.containerEl
        const selectedCard = this.containerEl.querySelector<HTMLElement>(`[data-leaf-id="${leafId}"]`)

        // Mark selected card as active for animation
        this.containerEl.querySelectorAll('.tab-card').forEach(el => el.classList.remove('tab-card--active'))
        selectedCard?.classList.add('tab-card--active')

        await animateClose(workspaceEl, this.containerEl, selectedCard)

        this.app.workspace.revealLeaf(leaf)

        this.component?.$destroy()
        this.component = null
        this.isOpen = false
        this.isAnimating = false
        tabsOverviewOpen.set(false)
    }

    toggle() {
        if (this.isOpen) {
            this.close()
        } else {
            this.open()
        }
    }

    destroy() {
        this.component?.$destroy()
        this.containerEl.remove()
        tabsOverviewOpen.set(false)
    }
}
