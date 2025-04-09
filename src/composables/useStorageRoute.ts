

export function useStorageRoute (namespace: string, defaultValue?: string|undefined)  {
    let { data: dataRoute } = useBrowserSyncStorage(namespace, {
        path: defaultValue || '/',
        data: {}
    })

    const go = (route: string, data: any = {}) => {
        dataRoute.value.path = route
        dataRoute.value.data = data
    }

    const is = (route: string) => {
        return dataRoute.value?.path === route
    }

    const data = () => {
        return dataRoute.value?.data
    }

    return {
        data,
        go,
        is
    }
}