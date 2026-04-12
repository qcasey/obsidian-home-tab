import type { App, View } from "obsidian";
import type HomeTab from "./main";

declare module 'obsidian' {
    interface App {
        commands: {
            executeCommandById(id: string): boolean;
        }
    }
}

export default class HomeTabSearchBar{
    private app: App
    protected view: View
    protected plugin: HomeTab
    private lastOpenedTime: number = 0
    private static readonly REOPEN_COOLDOWN_MS = 500

    constructor(plugin: HomeTab, view: View) {
        this.app = view.app;
        this.view = view;
        this.plugin = plugin;
    }

    public openQuickSwitcher(): void {
        const now = Date.now();
        if (now - this.lastOpenedTime < HomeTabSearchBar.REOPEN_COOLDOWN_MS) {
            return;
        }
        this.lastOpenedTime = now;

        // Prefer Quick Switcher++ if available
        const switcherPlusId = 'darlal-switcher-plus:switcher-plus:open';
        if (this.app.commands.executeCommandById(switcherPlusId)) {
            return;
        }
        this.app.commands.executeCommandById('switcher:open');
    }
}
