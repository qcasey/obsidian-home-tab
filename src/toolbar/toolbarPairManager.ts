import { App, setIcon } from 'obsidian'
import type { ToolbarPair } from './toolbarPairTypes'
import { LongPressDetector } from './longPressDetector'

export class ToolbarPairManager {
    private detectors: LongPressDetector[] = []
    private overlays: HTMLElement[] = []
    private hiddenButtons: HTMLElement[] = []
    private observer: MutationObserver | null = null
    private debounceTimer: ReturnType<typeof setTimeout> | null = null

    constructor(
        private app: App,
        private pairs: ToolbarPair[],
        private defaultDuration: number
    ) {}

    init(): void {
        this.applyPairs()
        this.observeToolbar()
    }

    updatePairs(pairs: ToolbarPair[], defaultDuration: number): void {
        this.cleanup()
        this.pairs = pairs
        this.defaultDuration = defaultDuration
        this.applyPairs()
    }

    destroy(): void {
        this.cleanup()
        this.observer?.disconnect()
        this.observer = null
    }

    private applyPairs(): void {
        const optionsList = document.querySelector('.mobile-toolbar-options-list')
        if (!optionsList) return

        const buttons = Array.from(optionsList.querySelectorAll<HTMLElement>('.mobile-toolbar-option'))
        if (buttons.length === 0) return

        const toolbarCommandIds: string[] = (this.app.vault as any).getConfig('mobileToolbarCommands') ?? []
        const commands = (this.app as any).commands.commands as Record<string, { id: string; name: string; icon?: string }>

        for (const pair of this.pairs) {
            if (!pair.enabled) continue

            const primaryCmd = commands[pair.primaryCommandId]
            const secondaryCmd = commands[pair.secondaryCommandId]
            if (!primaryCmd || !secondaryCmd) continue

            const primaryButton = this.findButton(buttons, pair.primaryCommandId, toolbarCommandIds, commands)
            const secondaryButton = this.findButton(buttons, pair.secondaryCommandId, toolbarCommandIds, commands)
            if (!primaryButton) continue

            // Hide secondary button
            if (secondaryButton) {
                secondaryButton.style.display = 'none'
                this.hiddenButtons.push(secondaryButton)
            }

            // Make primary button the pair container
            primaryButton.style.position = 'relative'

            // Create overlay
            const overlay = document.createElement('div')
            overlay.className = 'toolbar-pair-overlay'

            const primaryIcon = overlay.createDiv({ cls: 'toolbar-pair-icon' })
            setIcon(primaryIcon, primaryCmd.icon ?? 'circle')

            overlay.createDiv({ cls: 'toolbar-pair-separator', text: '/' })

            const secondaryIcon = overlay.createDiv({ cls: 'toolbar-pair-icon' })
            setIcon(secondaryIcon, secondaryCmd.icon ?? 'circle')

            primaryButton.appendChild(overlay)
            this.overlays.push(overlay)

            // Hide original icon content (but keep the button for sizing)
            const originalIcon = primaryButton.querySelector<HTMLElement>('.clickable-icon')
            if (originalIcon) {
                originalIcon.style.visibility = 'hidden'
            }

            const duration = pair.longPressDuration ?? this.defaultDuration
            const detector = new LongPressDetector(
                overlay,
                () => (this.app as any).commands.executeCommandById(pair.primaryCommandId),
                () => (this.app as any).commands.executeCommandById(pair.secondaryCommandId),
                duration
            )
            this.detectors.push(detector)
        }
    }

    private findButton(
        buttons: HTMLElement[],
        commandId: string,
        toolbarCommandIds: string[],
        commands: Record<string, { id: string; name: string; icon?: string }>
    ): HTMLElement | null {
        const cmd = commands[commandId]
        if (!cmd) return null

        // Strategy 1: aria-label matching
        const byLabel = buttons.find(btn => btn.getAttribute('aria-label') === cmd.name)
        if (byLabel) return byLabel

        // Strategy 2: index-based matching
        const idx = toolbarCommandIds.indexOf(commandId)
        if (idx >= 0 && idx < buttons.length) {
            return buttons[idx]
        }

        return null
    }

    private observeToolbar(): void {
        const toolbar = document.querySelector('.mobile-toolbar')
        if (!toolbar) return

        this.observer = new MutationObserver(() => {
            if (this.debounceTimer) clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => {
                this.cleanup()
                this.applyPairs()
            }, 50)
        })

        this.observer.observe(toolbar, { childList: true, subtree: true })
    }

    private cleanup(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }

        this.detectors.forEach(d => d.destroy())
        this.detectors = []

        this.overlays.forEach(el => el.remove())
        this.overlays = []

        // Restore hidden buttons
        this.hiddenButtons.forEach(btn => {
            btn.style.display = ''
        })
        this.hiddenButtons = []
    }
}
