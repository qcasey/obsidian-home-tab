import { TFile, App } from 'obsidian'
import { getFileTypeFromExtension } from './getFileTypeUtils'

declare global {
    var app: App;
}

export function getImageFiles(){
    let fileList: TFile[] = []
    app.vault.getFiles().forEach((file) => {
        if (getFileTypeFromExtension(file.extension) === 'image'){
            fileList.push(file)
        }
    })
    return fileList
}
