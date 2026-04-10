<script lang="ts">
	import { Menu, View, TFile, TAbstractFile } from "obsidian";
	import type { HomeTabSettings } from "src/settings";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";

    export let view: View
    export let pluginSettings: HomeTabSettings
    const app = view.leaf.app

    let selectedFile: TFile

    function getRecentFiles(): TFile[] {
        const paths = app.workspace.getLastOpenFiles()
        const files: TFile[] = []
        for (const path of paths) {
            const file = app.vault.getAbstractFileByPath(path)
            if (file instanceof TFile) {
                files.push(file)
            }
        }
        return files
    }

    let recentFileList = getRecentFiles()

    let contextualMenu: Menu = new Menu()
            .setUseNativeMenu(app.vault.config.nativeMenus)
</script>

<div class="home-tab-recent-files-container">
    <div class="home-tab-recent-files-title">
        Recent files
    </div>
    <div class="home-tab-recent-files-wrapper">
        {#each recentFileList as file (file.path)}
            <FileDisplayItem {file} {app} {pluginSettings} {contextualMenu} listMode={true}
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
