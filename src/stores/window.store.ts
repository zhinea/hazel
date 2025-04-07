
let { data: isContentScriptOpen } = useBrowserLocalStorage('isContentScriptOpen', false);

export const useWindowStore = () => {
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

    return {
        isContentScriptOpen,
        toggleContentScript,
        openContentScript,
        closeContentScript
    }
}