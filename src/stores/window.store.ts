
export const useWindowStore = defineStore('window', () => {
    let { data: isContentScriptOpen } = useBrowserSyncStorage('isContentScriptOpen', false);


    const toggleContentScript = () => {
        isContentScriptOpen.value = isContentScriptOpen!.value != true;
    }

    return {
        isContentScriptOpen,
        toggleContentScript
    }
})