import { defineStore } from 'pinia'
import {CustomVariable, IEvent, RecordOptions, RecordOptionValue} from "@/types/record";

export const useRecordConfigStore = defineStore('config', {
    state: () => ({
        isLoading: false,
        name: '',
        description: undefined,
        options: {
            bypassCaptcha: {
                type: 'boolean',
                meta: {
                    value: false
                }
            },
            xhrIntercept: {
                type: 'boolean',
                meta: {
                    value: false
                }
            },
            multiTab: {
                type: 'boolean',
                meta: {
                    value: false
                }
            },
        } as RecordOptions,
        variables: [] as CustomVariable[],
        events: [] as IEvent[],
        createdAt: undefined
    }),
    actions: {
        async load(){
            let config = await chrome.storage.local.get(['record-config'])
            if(config['record-config']){
                this.$patch(config['record-config'])
            }
        },
        addVariable(variable: CustomVariable) {
            this.variables.push(variable)
            this.save()
            console.log(this.variables)
        },
        save(){
            (async() => {
                await chrome.storage.local.set({
                    'record-config': {
                        name: this.name,
                        options: this.options,
                        variables: this.variables,
                        events: this.events
                    }
                })
                console.log(await chrome.storage.local.get('record-config'))
            })();
        }

    }
})