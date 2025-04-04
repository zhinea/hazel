
class Storage {
    async get(key?: string|number){
        let localResult = await chrome.storage.local.get(key);


    }

    async create(key: string|number, data: any){
        //
    }

    async update(key: string|number, data: any){
        //
    }

    async delete(key: string|number){
        //
    }

}

export const StorageAPI = new Storage()