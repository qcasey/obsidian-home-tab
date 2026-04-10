import { App } from 'obsidian'

declare global {
    var app: App;
}

const fileTypeLookupTable: FileTypeLookupTable = {
    image : ['jpg', 'jpeg', 'png', 'svg', 'gif', 'bmp'],
    video : ['mp4', 'webm', 'ogv', 'mov', 'mkv'],
    audio : ['mp3', 'wav', 'm4a', 'ogg', '3gp', 'flac'],
    markdown : ['md'],
    pdf : ['pdf'],
    canvas: ['canvas'],
}

type FileTypeLookupTable = {[key in FileType]: string[]}
export const fileTypes = ['markdown', 'image', 'video', 'audio', 'pdf', 'canvas'] as const
export type FileType = typeof fileTypes[number]
export const fileExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'bmp', 'mp4', 'webm', 'ogv', 'mov', 'mkv',
                        'mp3', 'wav', 'm4a', 'ogg', '3gp', 'flac', 'md', 'pdf', 'canvas'] as const
export type FileExtension = typeof fileExtensions[number]

export function getFileTypeFromExtension(extension: string): FileType | undefined{
    for(const fileType of Object.keys(fileTypeLookupTable) as Array<FileType>){
        if(fileTypeLookupTable[fileType].includes(extension)){
            return fileType
        }
    }
    return undefined
}

export function getExtensionFromFilename(filename: string): FileExtension | undefined{
    const extension = filename.match(/\.([^.]+$)/g)
    if (extension){
        return extension[0].substring(1) as FileExtension
    }
    return undefined
}
