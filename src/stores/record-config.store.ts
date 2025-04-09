import { defineStore } from 'pinia'
import {CustomVariable, IEvent} from "@/types/record";

export const useRecordConfigStore = defineStore('config', {
  state: () => {
    const { data } = useBrowserSyncStorage('record-config', {
        name: '',
        options: {
          bypassCaptcha: false,
          xhrIntercept: false,
          magicScrape: false,
          multiTab: false,
        },
        variables: [] as CustomVariable[],
        events: [] as IEvent[]
    })

    return data
  },
})