import { createNotivue, push } from "notivue"

import "notivue/notification.css" // Only needed if using built-in notifications
import "notivue/animations.css" // Only needed if using built-in animations

export const notivue = createNotivue({
  position: "bottom-center",
})

export const pushNotification = (payload: {
  title: string
  message: string
  type: "success" | "error" | "warning"
}) => {
  return push[payload.type](payload)
}
