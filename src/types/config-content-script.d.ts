
export interface CustomVariable {
    id: string
    name: string
    type: "static" | "ai" | "api"
    value?: string
    prompt?: string
    apiUrl?: string
    jsonPath?: string
}
