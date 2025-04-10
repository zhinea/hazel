import { i18n } from "src/utils/i18n"
import { notivue } from "src/utils/notifications"
import { pinia } from "src/utils/pinia"
import { createApp } from "vue"
import { useWindowStore } from "src/stores/window.store"
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import App from "./app.vue"

import 'vue3-perfect-scrollbar/style.css';
import "./index.scss"

const app = createApp(App)
    .use(i18n)
    .use(notivue)
    .use(pinia)
    .use(PerfectScrollbarPlugin);

app.mount("#app")
// Create a store instance after Pinia is initialized
const windowStore = useWindowStore()


windowStore.onChanged((value) => {
  console.log('isContentScriptOpen changed to', value)
  // if(value){
  //   windowStore.openContentScript()
  // }else{
  //   windowStore.closeContentScript()
  // }
})

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.info("Message received from background script: ", message)

})

export default app
