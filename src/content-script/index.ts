// This import scss file is used to style the iframe that is injected into the page
import "./index.scss"
import { name } from "~/package.json"
import { makeDraggable } from "@/utils/draggable"

const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html")

const handlerFrame = () => document.querySelector('.crx-iframe-wrapper');
const iframe = new DOMParser().parseFromString(
    `<iframe class="crx-iframe ${name}" src="${src}" title="${name}"></iframe>`,
    "text/html",
).body.firstElementChild


if (iframe) {
  document.body?.append(iframe)

  // initial load
  chrome.storage.local.get(['isContentScriptOpen'], (result) => {
    if(result.isContentScriptOpen){
      iframe.classList.remove('hidden')
      makeDraggable(iframe as HTMLElement)
    }else{
      iframe.classList.add('hidden')
    }
  })

  // Listen for changes to the window store
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isContentScriptOpen) {
      const newValue = changes.isContentScriptOpen.newValue
      if (newValue) {
        handlerFrame()?.classList?.remove('hidden')
        iframe.classList.remove('hidden')
        makeDraggable(iframe as HTMLElement)
      } else {
        console.log('hide')
        handlerFrame()?.classList?.add('hidden')
        iframe.classList.add('hidden')
      }
    }
  })
}

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from content-script")