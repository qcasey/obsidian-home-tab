import { App, Setting, PluginSettingTab, normalizePath, Platform } from 'obsidian'
import type HomeTab from './main'
import type { ToolbarPair } from './toolbar/toolbarPairTypes'
import iconSuggester from './suggester/iconSuggester'
import { lucideIcons, type LucideIcon } from './utils/lucideIcons'
import ImageFileSuggester from './suggester/imageSuggester'
import cssUnitValidator from './utils/cssUnitValidator'
import isLink from './utils/isLink'
import fontSuggester from './suggester/fontSuggester'
import type { bookmarkedFileStore } from './bookmarkedFiles'
import { checkFont } from './utils/fontValidator'

type ColorChoices = 'default' | 'accentColor' | 'custom'
type LogoChoiches = 'default' | 'imagePath' | 'imageLink' | 'lucideIcon' | 'oldLogo' | 'none'
type FontChoiches = 'interfaceFont' | 'textFont' | 'monospaceFont' | 'custom'

interface ObjectKeys {
    [key: string]: any
}

interface logoStore extends ObjectKeys{
    lucideIcon: LucideIcon | ''
    imagePath: string
    imageLink: string
}

export interface HomeTabSettings extends ObjectKeys{
    logoType: LogoChoiches
    logo: logoStore
    logoScale: number
    iconColor?: string
    iconColorType: ColorChoices
    wordmark: string
    customFont: FontChoiches
    font?: string
    fontSize: string
    fontColor?: string
    fontColorType: ColorChoices
    fontWeight: number
    showbookmarkedFiles: boolean
    showRecentFiles: boolean
    selectionHighlight: ColorChoices
    bookmarkedFileStore: bookmarkedFileStore[]
    replaceNewTabs: boolean
    newTabOnStart: boolean
    closePreviousSessionTabs: boolean
    enableTabsOverview: boolean
    swipeGestureEnabled: boolean
    enableToolbarPairs: boolean
    toolbarPairs: ToolbarPair[]
    defaultLongPressDuration: number
}

export const DEFAULT_SETTINGS: HomeTabSettings = {
    logoType: 'default',
    logo: {
        lucideIcon: '',
        imagePath: '',
        imageLink: '',},
    logoScale: 1.2,
    iconColorType: 'default',
    wordmark: 'Obsidian',
    customFont: 'interfaceFont',
    fontSize: '4em',
    fontColorType: 'default',
    fontWeight: 600,
    showbookmarkedFiles: app.internalPlugins.getPluginById('bookmarks') ? true : false,
    showRecentFiles: true,
    selectionHighlight: 'default',
    bookmarkedFileStore: [],
    replaceNewTabs: true,
    newTabOnStart: false,
    closePreviousSessionTabs: false,
    enableTabsOverview: false,
    swipeGestureEnabled: true,
    enableToolbarPairs: false,
    toolbarPairs: [],
    defaultLongPressDuration: 2000,
}


export class HomeTabSettingTab extends PluginSettingTab{
    plugin: HomeTab
    
    constructor(app: App, plugin: HomeTab){
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void{
        const {containerEl} = this
        containerEl.empty()

		containerEl.createEl('h3', {text: 'Home tab settings'});

        containerEl.createEl('h2', {text: 'General settings'});
        new Setting(containerEl)
        .setName('Replace new tabs with Home tab')
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.replaceNewTabs)
            .onChange(value => {this.plugin.settings.replaceNewTabs = value; this.plugin.saveSettings()}))

        new Setting(containerEl)
        .setName('Open new Home tab on Obsidian start')
        .setDesc('If a Home tab is already open it\'ll focus it instead of opening a new one.')
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.newTabOnStart)
            .onChange(value => {this.plugin.settings.newTabOnStart = value; this.plugin.saveSettings(); this.display()}))

        if(this.plugin.settings.newTabOnStart){
            new Setting(containerEl)
                .setName('Close previous session tabs on start')
                .setDesc('Enable this to close all the tabs and leave only one Home tab on Obsidian opening.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.closePreviousSessionTabs)
                    .onChange(value => {this.plugin.settings.closePreviousSessionTabs = value; this.plugin.saveSettings()}))
        }

        if(Platform.isMobile){
            containerEl.createEl('h2', {text: 'Mobile tabs overview'});
            new Setting(containerEl)
                .setName('Enable tabs overview')
                .setDesc('Adds a Safari-like tabs overview with swipe-up gesture and zoom animation.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableTabsOverview)
                    .onChange(value => {
                        this.plugin.settings.enableTabsOverview = value
                        this.plugin.saveSettings()
                        this.plugin.toggleTabsOverview(value)
                        this.display()
                    }))

            if(this.plugin.settings.enableTabsOverview){
                new Setting(containerEl)
                    .setName('Swipe-up gesture')
                    .setDesc('Swipe up from the bottom of the screen to open the tabs overview.')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.swipeGestureEnabled)
                        .onChange(value => {
                            this.plugin.settings.swipeGestureEnabled = value
                            this.plugin.saveSettings()
                            this.plugin.toggleSwipeGesture(value)
                        }))
            }

            containerEl.createEl('h2', {text: 'Toolbar pairs'});
            new Setting(containerEl)
                .setName('Enable toolbar pairs')
                .setDesc('Combine two toolbar actions into one button. Tap for primary, long-press for secondary.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.enableToolbarPairs)
                    .onChange(value => {
                        this.plugin.settings.enableToolbarPairs = value
                        this.plugin.saveSettings()
                        this.plugin.toggleToolbarPairs(value)
                        this.display()
                    }))

            if(this.plugin.settings.enableToolbarPairs){
                new Setting(containerEl)
                    .setName('Long-press duration')
                    .setDesc('Default hold time in milliseconds to trigger the secondary action.')
                    .addSlider(slider => slider
                        .setLimits(500, 5000, 100)
                        .setDynamicTooltip()
                        .setValue(this.plugin.settings.defaultLongPressDuration)
                        .onChange(value => {
                            this.plugin.settings.defaultLongPressDuration = value
                            this.plugin.saveSettings()
                            this.plugin.updateToolbarPairs()
                        }))

                const allCommands = Object.values((this.app as any).commands.commands as Record<string, { id: string; name: string }>)
                    .sort((a, b) => a.name.localeCompare(b.name))

                for (const pair of this.plugin.settings.toolbarPairs) {
                    const pairSetting = new Setting(containerEl)
                        .setClass('toolbar-pair-setting')
                        .addDropdown(dropdown => {
                            dropdown.addOption('', 'Select primary...')
                            allCommands.forEach(cmd => dropdown.addOption(cmd.id, cmd.name))
                            dropdown.setValue(pair.primaryCommandId)
                            dropdown.onChange(value => {
                                pair.primaryCommandId = value
                                this.plugin.saveSettings()
                                this.plugin.updateToolbarPairs()
                            })
                        })
                        .addDropdown(dropdown => {
                            dropdown.addOption('', 'Select secondary...')
                            allCommands.forEach(cmd => dropdown.addOption(cmd.id, cmd.name))
                            dropdown.setValue(pair.secondaryCommandId)
                            dropdown.onChange(value => {
                                pair.secondaryCommandId = value
                                this.plugin.saveSettings()
                                this.plugin.updateToolbarPairs()
                            })
                        })
                        .addToggle(toggle => toggle
                            .setValue(pair.enabled)
                            .onChange(value => {
                                pair.enabled = value
                                this.plugin.saveSettings()
                                this.plugin.updateToolbarPairs()
                            }))
                        .addExtraButton(button => button
                            .setIcon('trash')
                            .setTooltip('Remove pair')
                            .onClick(() => {
                                this.plugin.settings.toolbarPairs = this.plugin.settings.toolbarPairs.filter(p => p.id !== pair.id)
                                this.plugin.saveSettings()
                                this.plugin.updateToolbarPairs()
                                this.display()
                            }))
                }

                new Setting(containerEl)
                    .addButton(button => button
                        .setButtonText('Add pair')
                        .onClick(() => {
                            this.plugin.settings.toolbarPairs.push({
                                id: Date.now().toString(),
                                primaryCommandId: '',
                                secondaryCommandId: '',
                                enabled: true,
                            })
                            this.plugin.saveSettings()
                            this.display()
                        }))
            }
        }

        containerEl.createEl('h2', {text: 'Files display'});
        
        if(app.internalPlugins.getPluginById('bookmarks')){
            new Setting(containerEl)
            .setName('Show bookmarked files')
            .setDesc('Shows bookmarked files under the search bar.')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.showbookmarkedFiles)
                .onChange((value) => {this.plugin.settings.showbookmarkedFiles = value; this.plugin.saveSettings(); this.plugin.refreshOpenViews()
                    // if(value && !this.plugin.bookmarkedFileManager){
                    //     this.plugin.bookmarkedFileManager = new bookmarkedFileManager(this.app, this.plugin, bookmarkedFiles)
                    // }
                    // value ? this.plugin.bookmarkedFileManager.load() : this.plugin.bookmarkedFileManager.unload() // Detach bookmarkedFileManager instance
                }))
        }

        new Setting(containerEl)
            .setName('Show recent files')
            .setDesc('Displays recent files under the search bar.')
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.showRecentFiles)
                .onChange((value) => {this.plugin.settings.showRecentFiles = value; this.plugin.saveSettings(); this.plugin.refreshOpenViews()}))

        containerEl.createEl('h2', {text: 'Appearance'});

        const logoTypeSetting = new Setting(containerEl)
            .setName('Logo')
            .setDesc('Remove or set a custom logo. Accepts local files, links to images or lucide icon ids.')

        logoTypeSetting.descEl.parentElement?.addClass('ultra-compressed')

        let invalidInputIcon: HTMLElement
        logoTypeSetting
            .addExtraButton((button) => {button
                .setIcon('alert-circle')
                .setTooltip('The path/link/icon is not valid.')
                invalidInputIcon = button.extraSettingsEl
                invalidInputIcon.toggleVisibility(false)
                invalidInputIcon.addClass('mod-warning')})

        if(this.plugin.settings.logoType === 'imagePath' || this.plugin.settings.logoType === 'imageLink' || this.plugin.settings.logoType === 'lucideIcon'){
            logoTypeSetting
                .addSearch((text) => {
                    if(this.plugin.settings.logoType === 'imagePath'){
                        new ImageFileSuggester(this.app, text.inputEl, {
                            isScrollable: true,
                            style: `max-height: 200px`
                        })
                    }
                    else if(this.plugin.settings.logoType === 'lucideIcon'){
                        new iconSuggester(this.app, text.inputEl, {
                            isScrollable: true,
                            style: `max-height: 200px`}, 
                            true)
                    }
                    text
                        // .setPlaceholder(this.plugin.settings.logo[this.plugin.settings.logoType] != '' ? this.plugin.settings.logo[this.plugin.settings.logoType] : 'Type anything ... ')
                        .setPlaceholder('Type anything ... ')
                        .setValue(this.plugin.settings.logo[this.plugin.settings.logoType] != '' ? this.plugin.settings.logo[this.plugin.settings.logoType] : '')
                        .onChange(async (value) => {
                            if(value === '' || value == '/'){
                                invalidInputIcon.toggleVisibility(false)
                                return
                            }
                            if(this.plugin.settings.logoType === 'imagePath'){
                                const normalizedPath = normalizePath(value)
                                if (await app.vault.adapter.exists(normalizedPath)){
                                    invalidInputIcon.toggleVisibility(false)
                                    this.plugin.settings.logo['imagePath'] = normalizedPath
                                    this.plugin.saveSettings()
                                }
                                else{
                                    invalidInputIcon.toggleVisibility(true)
                                }
                            }
                            else if(this.plugin.settings.logoType === 'imageLink'){
                                if(isLink(value)){
                                    invalidInputIcon.toggleVisibility(false)
                                    this.plugin.settings.logo['imageLink'] = value
                                    this.plugin.saveSettings()
                                }
                                else{
                                    invalidInputIcon.toggleVisibility(true)
                                }
                            }
                            else if(this.plugin.settings.logoType === 'lucideIcon'){
                                if(lucideIcons.includes(value as LucideIcon)){
                                    this.plugin.settings.logo['lucideIcon'] = value as LucideIcon
                                    this.plugin.saveSettings()
                                    invalidInputIcon.toggleVisibility(false)
                                }
                                else{
                                    invalidInputIcon.toggleVisibility(true)
                                }
                            }
                        })
                        .inputEl.parentElement?.addClass('wide-input-container')
                })
        }

        logoTypeSetting
            .addDropdown((dropdown) => dropdown
                .addOption('default', 'Obsidian logo')
                .addOption('oldLogo', 'Obsidian old logo')
                .addOption('imagePath', 'Local image')
                .addOption('imageLink', 'Link')
                .addOption('lucideIcon', 'Lucide icon')
                .addOption('none', 'Empty')
                .setValue(this.plugin.settings.logoType)
                .onChange((value: LogoChoiches) => {this.plugin.settings.logoType = value; this.plugin.saveSettings(); this.display()}))
            .then((settingEl) => this.addResetButton(settingEl, 'logoType'))
        
        if(this.plugin.settings.logoType === 'lucideIcon'){
            const iconColorSetting = new Setting(containerEl)
                .setName('Logo icon color')
                .setDesc('Set the icon color')
                
            if (this.plugin.settings.iconColorType === 'custom'){
                iconColorSetting.addColorPicker((colorPicker) => colorPicker
                    .setValue(this.plugin.settings.iconColor ? this.plugin.settings.iconColor : '#000000')
                    .onChange((value) => {this.plugin.settings.iconColor = value; this.plugin.saveSettings()}))
            }
                
            iconColorSetting
                .addDropdown((dropdown) => dropdown
                    .addOption('default', 'Theme default')
                    .addOption('accentColor', 'Accent color')
                    .addOption('custom', 'Custom')
                    .setValue(this.plugin.settings.iconColorType)
                    .onChange((value: ColorChoices) => {this.plugin.settings.iconColorType = value; this.plugin.saveSettings(); this.display()}))
            .then((settingEl) => this.addResetButton(settingEl, 'iconColorType'))
        }
        
        new Setting(containerEl)
            .setName('Logo scale')
            .setDesc('Set the logo dimensions relative to the title font size.')
            .addSlider((slider) => slider
                .setDynamicTooltip()
                .setLimits(0.3,3, 0.1)
                .setValue(this.plugin.settings.logoScale)
                .onChange((value) => {
                    this.plugin.settings.logoScale = value
                    this.plugin.saveSettings()
            }))
            .then((settingEl) => this.addResetButton(settingEl, 'logoScale'))
        
        new Setting(containerEl)
            .setName('Title')
            // .setDesc('Set a custom title')
            .addText((text) => text
                .setValue(this.plugin.settings.wordmark)
                .onChange((value) => {
                    this.plugin.settings.wordmark = value
					this.plugin.saveSettings()
                }))
            .then((settingEl) => this.addResetButton(settingEl, 'wordmark'))


        const titleFontSettings = new Setting(containerEl)
            .setName('Title font')
            .setDesc('Interface font, text font, and monospace font options match the fonts set in the Appearance setting tab.')
            // .setDesc(createFragment(f => {
            //     f.appendText('Interface font, text font, and monospace font options');
            //     f.createEl('br')
            //     f.appendText('match the fonts set in the Appearance setting tab.')
            //   }))

        titleFontSettings.descEl.parentElement?.addClass('compressed')

        if(this.plugin.settings.customFont === 'custom'){
            let invalidFontIcon: HTMLElement
            titleFontSettings
                .addExtraButton((button) => {button
                    .setIcon('alert-circle')
                    .setTooltip('The font is not valid.')
                    invalidFontIcon = button.extraSettingsEl
                    invalidFontIcon.toggleVisibility(false)
                    invalidFontIcon.addClass('mod-warning')})

            titleFontSettings.addSearch((text) => {
                text.setValue(this.plugin.settings.font ? this.plugin.settings.font.replace(/"/g, ''): '')
                text.setPlaceholder('Type anything ... ')
                const suggester: fontSuggester | undefined = Platform.isMobile || Platform.isMacOS ? undefined : new fontSuggester(this.app, text.inputEl, {
                    isScrollable: true,
                    style: `max-height: 200px;
                    width: fit-content;
                    min-width: 200px;`}, 
                    true)

                text.onChange(async (value) => {
                    value = value.indexOf(' ') >= 0 ? `"${value}"` : value //Restore "" if font name contains whitespaces
                    if((suggester && (await suggester.getInstalledFonts()).includes(value)) || checkFont(value) ){
                        this.plugin.settings.font = value
                        this.plugin.saveSettings()
                        invalidFontIcon.toggleVisibility(false)
                    }
                    else{
                        invalidFontIcon.toggleVisibility(true)
                    }
                })
                .inputEl.parentElement?.addClass('wide-input-container')
            })
        }

        titleFontSettings
            .addDropdown(dropdown => dropdown
                .addOption('interfaceFont', 'Interface font')
                .addOption('textFont', 'Text font')
                .addOption('monospaceFont', 'Monospace font')
                .addOption('custom', 'Custom font')
                .setValue(this.plugin.settings.customFont)
                .onChange((value: FontChoiches) => {
                    this.plugin.settings.customFont = value
                    this.plugin.saveSettings()
                    this.display()
                })
            )
        this.addResetButton(titleFontSettings, 'customFont')

        let invalidFontSizeIcon: HTMLElement
        new Setting(containerEl)
            .setName('Title font size')
            .setDesc('Accepts any CSS font-size value.')
            .addExtraButton((button) => {button
                .setIcon('alert-circle')
                .setTooltip('The CSS unit is not valid.')
                invalidFontSizeIcon = button.extraSettingsEl
                invalidFontSizeIcon.addClass('mod-warning')
                invalidFontSizeIcon.toggleVisibility(false)
            })
            .addText((text) => text
                .setValue(this.plugin.settings.fontSize)
                .onChange((value) => {
                    if(cssUnitValidator(value)){
                        this.plugin.settings.fontSize = value
                        this.plugin.saveSettings()
                        invalidFontSizeIcon.toggleVisibility(false)
                    }
                    else{
                        invalidFontSizeIcon.toggleVisibility(true)
                    }
                }))
            .then((settingEl) => this.addResetButton(settingEl, 'fontSize'))

        new Setting(containerEl)
            .setName('Title font weight')
            // .setDesc('Set title font weight')
            .addSlider((slider) => slider
                .setLimits(100, 900, 100)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.fontWeight)
                .onChange((value) => {
                    this.plugin.settings.fontWeight = value
                    this.plugin.saveSettings()
                }))
            .then((settingEl) => this.addResetButton(settingEl, 'fontWeight'))

        const titleColorSetting = new Setting(containerEl)
            .setName('Title color')

        if (this.plugin.settings.fontColorType === 'custom'){
            titleColorSetting.addColorPicker((colorPicker) => colorPicker
                .setValue(this.plugin.settings.fontColor?this.plugin.settings.fontColor : '#000000')
                .onChange((value) => {this.plugin.settings.fontColor = value; this.plugin.saveSettings()}))
        }

        titleColorSetting
            .addDropdown((dropdown) => dropdown
                .addOption('default', 'Theme default')
                .addOption('accentColor', 'Accent color')
                .addOption('custom', 'Custom')
                .setValue(this.plugin.settings.fontColorType)
                .onChange((value: ColorChoices) => {this.plugin.settings.fontColorType = value; this.plugin.saveSettings(); this.display()}))
            .then((settingEl) => this.addResetButton(settingEl, 'fontColorType'))
    
        new Setting(containerEl)
        .setName('Selection highlight')
        .setDesc('Set the color of the selected item.')
        .addDropdown((dropdown) => dropdown
            .addOption('default', 'Theme default')
            .addOption('accentColor', 'Accent color')
            .setValue(this.plugin.settings.selectionHighlight)
            .onChange((value: ColorChoices) => {this.plugin.settings.selectionHighlight = value; this.plugin.saveSettings(); this.plugin.refreshOpenViews()}))
        .then((settingEl) => this.addResetButton(settingEl, 'selectionHighlight'))

    }

    addResetButton(settingElement: Setting, settingKey: string, refreshView: boolean = true){
        settingElement
            .addExtraButton((button) => button
                    .setIcon('reset')
                    .setTooltip('Reset to default')
                    .onClick(() => {
                        this.plugin.settings[settingKey] = DEFAULT_SETTINGS[settingKey]
                        this.plugin.saveSettings()
                        if(refreshView){this.display()}
                    }))
    }
}