export function mergeDeep(defaults: any, source: any): any {
    // Merge the default options with the stored options
    const output = { ...defaults } // Start with defaults
    Object.keys(defaults).forEach((key) => {
        const defaultValue = defaults[key]
        const sourceValue = source?.[key]
        if (isObject(defaultValue) && sourceValue != null) {
            // Recursively merge nested objects
            output[key] = mergeDeep(defaultValue, sourceValue)
        } else {
            // If the type is different, use the default value
            output[key] = defaultValue
        }
    })
    return output
}

export function isObject(value: any): boolean {
    return value !== null && value instanceof Object && !Array.isArray(value)
}