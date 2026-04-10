import Fuse from "fuse.js";
import type { TFile } from "obsidian";
import { getImageFiles } from "src/utils/getFilesUtils";

export const DEFAULT_FUSE_OPTIONS: Fuse.IFuseOptions<any> = {
    includeScore : true,
    includeMatches : true,
    findAllMatches : true,
    fieldNormWeight : 1.35,
    threshold : 0.2,
    distance: 125,
    useExtendedSearch : true,
}

class fuzzySearch<T>{
    private fuse: Fuse<T>

    constructor(searchArray: T[], searchOptions: Fuse.IFuseOptions<T> = DEFAULT_FUSE_OPTIONS){
        this.fuse = new Fuse(searchArray, searchOptions)
    }

    rawSearch(query: string, limit?: number): Fuse.FuseResult<T>[]{
        return this.fuse.search(query, limit ? { limit } : undefined);
    }

    filteredSearch(querry: string, scoreThreshold: number = 0.25, maxResults: number = 5){
        return this.rawSearch(querry, maxResults).filter(item => item.score ? item.score < scoreThreshold : true)
    }

    updateSearchArray(newSearchArray: T[]){
        this.fuse.setCollection(newSearchArray)
    }
}

export class ArrayFuzzySearch extends fuzzySearch<string>{
    constructor(searchArray: string[], searchOptions?: Fuse.IFuseOptions<string>){
        super(searchArray, searchOptions)
    }
}

/**
 * @description Search image file.
 * @param imageList Optional list of TFile, if not given the search will be in the entire vault.
 */
export class ImageFileFuzzySearch extends fuzzySearch<TFile>{
    constructor(imageList?: TFile[], searchOptions?: Fuse.IFuseOptions<TFile>){
        const searchArray = imageList ?? getImageFiles()
        super(searchArray, searchOptions)
    }
}
