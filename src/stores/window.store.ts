

export const useWindowStore = defineStore('window', () => {
    let { data: isContentScriptOpen } = useBrowserLocalStorage('isContentScriptOpen', false);
    let listeners: any[] = [];

    chrome.storage.local.get(['isContentScriptOpen'], (result) => {
        isContentScriptOpen.value = result.isContentScriptOpen
    })

    const toggleContentScript = () => {
        chrome.storage.local.set({ 'isContentScriptOpen': !isContentScriptOpen.value })
    }

    const openContentScript = () => {
        chrome.storage.local.set({ 'isContentScriptOpen': true })
    }

    const closeContentScript = () => {
        chrome.storage.local.set({ 'isContentScriptOpen': false })
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.isContentScriptOpen) {
            isContentScriptOpen.value = changes.isContentScriptOpen.newValue
            listeners.forEach(callback => callback(isContentScriptOpen.value))
        }
    })

    return {
        isContentScriptOpen,
        toggleContentScript,
        openContentScript,
        closeContentScript,
        onChanged: (callback: (value: boolean) => void) => {
            listeners.push(callback)
        }
    }
})