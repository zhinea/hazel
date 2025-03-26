// Define the different types of events that can be recorded

const EVENT_TYPES = {
    // Initial page state
    INITIAL_STATE: 'initialState',

    FORM_NAVIGATION: 'formNavigation',

    // Mouse events
    MOUSE: {
        CLICK: 'click',
        DBLCLICK: 'dblclick',
        MOUSEDOWN: 'mousedown',
        MOUSEUP: 'mouseup',
        MOUSEMOVE: 'mousemove'
    },

    // Keyboard events
    KEYBOARD: {
        KEYDOWN: 'keydown',
        KEYUP: 'keyup',
        KEYPRESS: 'keypress',
        INPUT: 'input',
        CHANGE: 'change'
    },

    // Navigation events
    NAVIGATION: {
        HASHCHANGE: 'hashchange',
        POPSTATE: 'popstate',
        NAVIGATE: 'navigate',
        SUBMIT: 'submit'
    },

    // Scroll events
    SCROLL: 'scroll',

    // Viewport events
    VIEWPORT: 'viewportChange',

    // Network events
    NETWORK: {
        XHR: 'xhr',
        FETCH: 'fetch'
    },

    // Custom events
    CUSTOM: 'customEvent'
};

// Define event structure for each type

const EVENT_STRUCTURE = {
    // Initial state when recording starts
    [EVENT_TYPES.INITIAL_STATE]: {
        type: EVENT_TYPES.INITIAL_STATE,
        url: '', // Current URL
        title: '', // Page title
        viewportWidth: 0, // Window width
        viewportHeight: 0, // Window height
        timestamp: 0, // When recording started
        sequence: 0 // Event sequence number
    },

    // Form navigation
    [EVENT_TYPES.FORM_NAVIGATION]: {
        type: EVENT_TYPES.FORM_NAVIGATION,
        url: '',
        timestamp: 0,
        sequence: 0
    },

    // Mouse click
    [EVENT_TYPES.MOUSE.CLICK]: {
        type: EVENT_TYPES.MOUSE.CLICK,
        selector: '', // CSS selector for target element
        x: 0, // Client X coordinate
        y: 0, // Client Y coordinate
        targetTagName: '', // Element tag
        targetType: '', // For input elements
        targetValue: null, // Current value if applicable
        timestamp: 0,
        sequence: 0
    },

    // Mouse double click
    [EVENT_TYPES.MOUSE.DBLCLICK]: {
        type: EVENT_TYPES.MOUSE.DBLCLICK,
        selector: '',
        x: 0,
        y: 0,
        targetTagName: '',
        timestamp: 0,
        sequence: 0
    },

    // Keyboard keydown
    [EVENT_TYPES.KEYBOARD.KEYDOWN]: {
        type: EVENT_TYPES.KEYBOARD.KEYDOWN,
        selector: '',
        key: '',
        keyCode: 0,
        modifiers: {
            alt: false,
            ctrl: false,
            shift: false,
            meta: false
        },
        targetTagName: '',
        targetType: '',
        timestamp: 0,
        sequence: 0
    },

    // Input event
    [EVENT_TYPES.KEYBOARD.INPUT]: {
        type: EVENT_TYPES.KEYBOARD.INPUT,
        selector: '',
        value: '',
        targetTagName: '',
        targetType: '',
        timestamp: 0,
        sequence: 0
    },

    // Change event
    [EVENT_TYPES.KEYBOARD.CHANGE]: {
        type: EVENT_TYPES.KEYBOARD.CHANGE,
        selector: '',
        value: '',
        targetTagName: '',
        targetType: '',
        timestamp: 0,
        sequence: 0
    },

    // Navigation events
    [EVENT_TYPES.NAVIGATION.HASHCHANGE]: {
        type: EVENT_TYPES.NAVIGATION.HASHCHANGE,
        url: '',
        timestamp: 0,
        sequence: 0
    },

    [EVENT_TYPES.NAVIGATION.POPSTATE]: {
        type: EVENT_TYPES.NAVIGATION.POPSTATE,
        url: '',
        timestamp: 0,
        sequence: 0
    },

    // Form submit
    [EVENT_TYPES.NAVIGATION.SUBMIT]: {
        type: EVENT_TYPES.NAVIGATION.SUBMIT,
        selector: '',
        formData: null,
        timestamp: 0,
        sequence: 0
    },

    // Scroll event
    [EVENT_TYPES.SCROLL]: {
        type: EVENT_TYPES.SCROLL,
        scrollX: 0,
        scrollY: 0,
        timestamp: 0,
        sequence: 0
    },

    // Viewport change (resize)
    [EVENT_TYPES.VIEWPORT]: {
        type: EVENT_TYPES.VIEWPORT,
        width: 0,
        height: 0,
        timestamp: 0,
        sequence: 0
    },

    // XHR request
    [EVENT_TYPES.NETWORK.XHR]: {
        type: EVENT_TYPES.NETWORK.XHR,
        method: '',
        url: '',
        async: true,
        data: null,
        timestamp: 0,
        sequence: 0
    },

    // Fetch request
    [EVENT_TYPES.NETWORK.FETCH]: {
        type: EVENT_TYPES.NETWORK.FETCH,
        method: '',
        url: '',
        data: null,
        timestamp: 0,
        sequence: 0
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EVENT_TYPES,
        EVENT_STRUCTURE
    };
}