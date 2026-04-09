<script lang="ts">
	import { Menu, View, type TFile } from "obsidian";
	import type { RecentFileManager, recentFile } from "src/recentFiles";
	import type { HomeTabSettings } from "src/settings";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";

    export let view: View
    export let recentFileList: recentFile[]
    export let pluginSettings: HomeTabSettings
    export let recentFileManager: RecentFileManager
    const app = view.leaf.app

    let selectedFile: TFile

    let contextualMenu: Menu = new Menu()
            .addItem((item) => item
                .setTitle('Hide file')
                .setIcon('eye-off')
                .onClick(() => recentFileManager.removeRecentFile(selectedFile)))
            .setUseNativeMenu(app.vault.config.nativeMenus)
</script>

<div class="home-tab-recent-files-container">
    <div class="home-tab-recent-files-title">
        Recent files
    </div>
    <div class="home-tab-recent-files-wrapper">
        {#each recentFileList as recentFile (recentFile.file.path)}
            <FileDisplayItem file={recentFile.file} {app} {pluginSettings} {contextualMenu} listMode={true}
            on:itemMenu={(e) => selectedFile = e.detail.file}/>
        {/each}
    </div>
</div>

<style>
    .home-tab-recent-files-container{
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .home-tab-recent-files-title{
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 5px;
    }
    .home-tab-recent-files-wrapper{
        display: flex;
        flex-direction: column;
    }

    @media(max-width: 700px){
        .home-tab-recent-files-container{
            padding-bottom: 20px;
        }
    }
</style>