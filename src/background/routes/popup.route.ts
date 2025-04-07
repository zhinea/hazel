import {IncommingMessage} from "@/types/message";
import {useWindowStore} from "@/stores/window.store";
import {stateManager} from "@/background/lib/state";

export class PopupRoute {

    private action: string;

    constructor(
        public message: IncommingMessage
    ) {
        this.action = message?.action?.replace('popup::','');
    }

    async handle(sendMessage: (res: any) => void){
        switch (this.action){
            case 'initializeStartRecord': {
                if(stateManager.get('isRecording')){
                    return pushNotification({
                        title: 'Whoops',
                        message: 'Recording is already in progress. Please stop it before starting a new one.',
                        type: 'error'
                    })
                }
                
                this.sendToContent({
                    action: 'showConfigMenu',
                })

                sendMessage({
                    status: true
                })
                break;
            }
        }
    }


    sendToContent(payload: any, tabId?: number|undefined){
        if(tabId !== undefined){
            chrome.tabs.sendMessage(tabId, payload);
            return;
        }
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, payload);
        });
    }
}