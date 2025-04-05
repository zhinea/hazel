// This import scss file is used to style the iframe that is injected into the page
import "./index.scss"
import { name } from "~/package.json"
import { makeDraggable } from "@/utils/draggable"

const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html")

const iframe = new DOMParser().parseFromString(
  `<iframe class="crx-iframe ${name}" src="${src}" title="${name}"></iframe>`,
  "text/html",
).body.firstElementChild

if (iframe) {
  document.body?.append(iframe)

  makeDraggable(iframe as HTMLElement)
}

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from content-script")
