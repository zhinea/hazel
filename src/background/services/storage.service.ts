
export class StorageService {

    public static async all(namespace?: string): Promise<any>{
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(undefined, (result) => {
                if(!namespace){
                    return resolve(result)
                }

                let data: Record<string, any> = {}

                Object.keys(result)
                    .filter((key) => key.startsWith(namespace))
                    .forEach((key) => {
                        data[key] = result[key];
                    });
                
                resolve(data);
            });
        })
    }

    public static async get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        })
    }

    public static async set(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        })
    }

    public static async remove(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(key, () => {
                resolve();
            });
        })
    }
}