import {BasicResponseServer, IncommingMessage} from "@/types/message";
import {StorageService} from "@/background/services/storage.service";

chrome.runtime.onMessage.addListener( (message: IncommingMessage, sender, sendResponse: (res: any) => void) => {

  (async () => {
    try {
      if(message?.action?.startsWith('storage::')){

        let action = message?.action?.replace('storage::','');
        let namespaces = action.split('.')

        let query = namespaces.pop();
        let namespace = namespaces.join('.')

        let key = `${namespace}.${message?.key}`;

        switch (query){
          case 'all':
            const data = await StorageService.all(namespace);
            sendResponse({
              status: true,
              data
            } as BasicResponseServer<typeof data>);
            break;

          case 'get': {
            const data = await StorageService.get(key);
            sendResponse({
              status: true,
              data
            } as BasicResponseServer<typeof data>);
            break;
          }

          case 'set': {
            await StorageService.set(key, message.value);
            sendResponse({
              status: true,
            } as BasicResponseServer<void>);
            break;
          }

          case 'remove': {
            await StorageService.remove(key);
            sendResponse({
              status: true,
              message: 'Data removed successfully'
            } as BasicResponseServer<void>);
            break;
          }

          default: {
            sendResponse({
              status: false,
              message: 'Invalid action'
            } as BasicResponseServer<void>);
            break;
          }
        }
      }
    }catch (er){

    }
  })();

  return true;
});

chrome.runtime.onInstalled.addListener(async (opt) => {
  // Check if reason is install or update. Eg: opt.reason === 'install' // If extension is installed.
  // opt.reason === 'update' // If extension is updated.
  // if (opt.reason === "install") {
  //   chrome.tabs.create({
  //     active: true,
  //     // Open the setup page and append `?type=install` to the URL so frontend
  //     // can know if we need to show the install page or update page.
  //     url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/install"),
  //   })
  //
  //   return
  // }
  //
  // if (opt.reason === "update") {
  //   chrome.tabs.create({
  //     active: true,
  //     url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/update"),
  //   })
  //
  //   return
  // }
})

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from background")

export {}
