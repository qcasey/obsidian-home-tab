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

    constructor(plugin: HomeTab, view: View) {
        this.app = view.app;
        this.view = view;
        this.plugin = plugin;
    }

    public openQuickSwitcher(): void {
        this.app.commands.executeCommandById('switcher:open');
    }
}
