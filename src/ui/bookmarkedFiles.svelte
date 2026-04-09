<script lang="ts">
	import { App, Menu, Notice, TFile, View } from "obsidian";
	import type { HomeTabSettings } from "src/settings";
	import { IconSelectionModal } from "src/iconSelectionModal";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";
	import type { bookmarkedFile, bookmarkedFilesManager } from "src/bookmarkedFiles";

    export let view: View
    export let bookmarkedFiles: bookmarkedFile[]
    export let pluginSettings: HomeTabSettings
    export let bookmarkedFileManager: bookmarkedFilesManager

    const app: App = view.leaf.app

    let selectedFile: TFile

    const selectIconModal: IconSelectionModal = new IconSelectionModal(app, undefined, (icon) => bookmarkedFileManager.updateFileIcon(selectedFile, icon))

    const contextualMenu: Menu = new Menu()
            .addItem((item) => item
                .setTitle('Remove bookmark')
                .setIcon('trash-2')
                .onClick(() => bookmarkedFileManager.removeBookmark(selectedFile)))
            .addSeparator()
            .addItem((item) => item
                .setTitle('Set custom icon')
                .setIcon('plus')
                .onClick(() => selectIconModal.open()))
            .setUseNativeMenu(app.vault.config.nativeMenus)  
</script>

<div class="home-tab-bookmarked-files-container">
    <div class="home-tab-bookmarked-files-title">Bookmarks</div>
    {#each bookmarkedFiles as item (item.file.path)}
        <FileDisplayItem file={item.file} customIcon={item.iconId} {app} {pluginSettings} {contextualMenu} listMode={true}
        on:itemMenu={(e) => selectedFile = e.detail.file}/>
    {/each}
</div>

<style>
    .home-tab-bookmarked-files-container{
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .home-tab-bookmarked-files-title{
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 5px;
    }
</style>