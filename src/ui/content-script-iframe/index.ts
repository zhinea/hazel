import { i18n } from "src/utils/i18n"
import { notivue } from "src/utils/notifications"
import { pinia } from "src/utils/pinia"
import { appRouter } from "src/utils/router"
import { createApp } from "vue"
import App from "./app.vue"
import "./index.scss"
import { useWindowStore } from "src/stores/window.store"

appRouter.addRoute({
  path: "/",
  redirect: "/content-script-iframe",
})

appRouter.addRoute({
  path: "/config",
  redirect: "/content-script-iframe/config",
})

const app = createApp(App).use(i18n).use(notivue).use(pinia).use(appRouter)

app.mount("#app")
// Create a store instance after Pinia is initialized
const windowStore = useWindowStore()

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.info("Message received from background script: ", message)

  if (message.action === 'showConfigMenu') {
    console.log('here')
    // Use the pre-initialized store instance
    windowStore.toggleContentScript()

    appRouter.push('/config')

    // ContentScriptRoute('config.index')
  }
})


export const ContentScriptRoute = (path: string) => {
  let route = {
    'config.index': '/content-script-iframe/config',
    'config.custom-variables': '/content-script-iframe/config/custom-variables',
  }[path] || '/content-script-iframe/config'

  appRouter.push(route)

  return true
}

export default app
