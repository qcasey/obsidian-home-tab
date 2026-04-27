import {
	App,
	Notice,
	Platform,
	Plugin,
	WorkspaceLeaf,
	WorkspaceMobileDrawer,
	WorkspaceSplit,
	WorkspaceTabs,
	ItemView,
	ViewStateResult,
	MarkdownView
} from 'obsidian';
import { EmbeddedHomeTab, HomeTabView, VIEW_TYPE } from 'src/homeView';
import { HomeTabSettingTab, DEFAULT_SETTINGS, type HomeTabSettings } from './settings'
import { pluginSettingsStore, bookmarkedFiles } from './store'
import { bookmarkedFilesManager } from './bookmarkedFiles';

import { TabsOverviewManager } from './tabsOverviewManager';


declare module 'obsidian'{
	interface App{
		internalPlugins: InternalPlugins
		plugins: Plugins
		dom: any
		isMobile: boolean
	}
	interface InternalPlugins{
		getPluginById: Function
		plugins: {
			bookmarks: BookmarksPlugin
		}
	}
	interface Plugins{
		getPlugin: (id: string) => Plugin
	}
	interface BookmarksPlugin extends Plugin{
		instance: {
			items: BookmarkItem[]
			getBookmarks: () => BookmarkItem[]
			removeItem: (item: BookmarkItem) => void
		}
	}
	interface BookmarkItem{
		type: string,
		title: string | undefined,
		path: string
	}
	interface config{
		nativeMenus: boolean
	}
	interface Vault{
		config: config
	}
	interface Workspace{
		createLeafInTabGroup: Function
	}
	interface WorkspaceLeaf{
		rebuildView: Function
		parent: WorkspaceTabs | WorkspaceMobileDrawer
		activeTime: number
		app: App
	}
	interface WorkspaceSplit{
		children: WorkspaceLeaf[]
	}
	interface TFile{
		deleted: boolean
	}
}

export default class HomeTab extends Plugin {
	settings: HomeTabSettings;
	bookmarkedFileManager: bookmarkedFilesManager
	activeEmbeddedHomeTabViews: EmbeddedHomeTab[]
	private tabsOverviewManager: TabsOverviewManager | null = null

	
	async onload() {
		console.log('Loading home-tab plugin')
		
		await this.loadSettings();
		this.addSettingTab(new HomeTabSettingTab(this.app, this))
		this.registerView(VIEW_TYPE, (leaf) => new HomeTabView(leaf, this));		

		// Replace new tabs with home tab view
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onLayoutChange()))
		// Open quick switcher when switching to home tab
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf) => {if(leaf.view instanceof HomeTabView){leaf.view.searchBar.openQuickSwitcher()}}))

		pluginSettingsStore.set(this.settings) // Store the settings for the svelte components

		this.activeEmbeddedHomeTabViews = []

		this.addCommand({
			id: 'open-new-home-tab',
			name: 'Open new Home tab',
			callback: () => this.activateView(false, true)})
		this.addCommand({
			id: 'open-home-tab',
			name: 'Replace current tab',
			callback: () => this.activateView(true)})

		if(Platform.isMobile){
			this.addCommand({
				id: 'open-tabs-overview',
				name: 'Open tabs overview',
				callback: () => {
					if(this.settings.enableTabsOverview && this.tabsOverviewManager){
						this.tabsOverviewManager.toggle()
					} else {
						new Notice('Enable "Custom tabs overview" in Home tab settings first.')
					}
				}
			})
		}

		// Wait for all plugins to load before check if the bookmarked plugin is enabled
		this.app.workspace.onLayoutReady(() => {
			if(this.app.internalPlugins.getPluginById('bookmarks')){
				this.bookmarkedFileManager = new bookmarkedFilesManager(this.app, this, bookmarkedFiles)
				this.bookmarkedFileManager.load()
			}

			this.registerMarkdownCodeBlockProcessor('search-bar', (source, el, ctx) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView)
				if(view){
					let embeddedHomeTab = new EmbeddedHomeTab(el, view, this, source)
					this.activeEmbeddedHomeTabViews.push(embeddedHomeTab)
					ctx.addChild(embeddedHomeTab)
				}
			})

			// Initialize tabs overview on mobile if enabled
			if(Platform.isMobile && this.settings.enableTabsOverview){
				this.initTabsOverview()
			}


			if(this.settings.newTabOnStart){
				// If an Home tab leaf is already open focus it
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE)
				if(leaves.length > 0){
					this.app.workspace.revealLeaf(leaves[0])
					// If more than one home tab leaf is open close them
					leaves.forEach((leaf, index) => {
						if(index < 1) return
						leaf.detach()
					})
				}
				else{
					this.activateView(false, true)
				}
				// Close all other open leaves
				if(this.settings.closePreviousSessionTabs){
					// Get open leaves type
					const leafTypes: string[] = []
					this.app.workspace.iterateRootLeaves((leaf) => {
						const leafType = leaf.view.getViewType()
						if(leafTypes.indexOf(leafType) === -1 && leafType != VIEW_TYPE){
							leafTypes.push(leafType)
						}
					})
					leafTypes.forEach((type) => this.app.workspace.detachLeavesOfType(type))
				}
			}
		})
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE)
		this.activeEmbeddedHomeTabViews.forEach(view => view.unload())
		this.bookmarkedFileManager.unload()
		this.destroyTabsOverview()
	}

	private initTabsOverview(): void {
		this.tabsOverviewManager = new TabsOverviewManager(this.app)
	}

	private destroyTabsOverview(): void {
		this.tabsOverviewManager?.destroy()
		this.tabsOverviewManager = null
	}

	public toggleTabsOverview(enabled: boolean): void {
		if(enabled){
			this.initTabsOverview()
		} else {
			this.destroyTabsOverview()
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)
		pluginSettingsStore.update(() => this.settings)
	}

	private onLayoutChange(): void{
		if(this.settings.replaceNewTabs){
			this.activateView()
		}
	}

	public activateView(overrideView?: boolean, openNewTab?: boolean):void {
		const leaf = openNewTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getMostRecentLeaf()
		// const leaf = newTab ? this.app.workspace.getLeaf() : this.app.workspace.getMostRecentLeaf()
		if(leaf && (overrideView || leaf.getViewState().type === 'empty')){
			leaf.setViewState({
				type: VIEW_TYPE,
			})
			// Focus newly opened tab
			if(openNewTab){this.app.workspace.revealLeaf(leaf)}
		}
	}

	public refreshOpenViews(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.rebuildView())
	}
}