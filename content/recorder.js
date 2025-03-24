// recorder.js - Injected into the page to record user actions
(function() {
    console.log('Recorder script loaded and initializing');

    // State
    let isRecording = false;
    let recordingId = null;
    let eventSequence = 0;
    let lastEvent = null;
    const MIN_EVENT_INTERVAL = 50; // ms

    // Event types to record
    const RECORD_EVENTS = {
        MOUSE: {
            CLICK: 'click',
            DBLCLICK: 'dblclick'
        },
        KEYBOARD: {
            INPUT: 'input'
        },
        NAVIGATION: {
            HASHCHANGE: 'hashchange',
            POPSTATE: 'popstate',
            SUBMIT: 'submit'
        },
        SCROLL: 'scroll',
        VIEWPORT: 'viewportChange',
        CUSTOM: 'customEvent'
    };

    // DOM Event listeners
    let listeners = [];

    // Communication with content script
    window.addEventListener('BrowserRecorder_ToPage', (event) => {
        console.log('Recorder received message:', event.detail);
        const message = event.detail;

        switch (message.action) {
            case 'startRecording':
                startRecording(message.recordingId);
                break;

            case 'stopRecording':
                stopRecording();
                break;

            default:
                console.warn('Unknown action received by recorder:', message.action);
        }
    });

    // Send message to content script
    function sendToContentScript(data) {
        console.log('Recorder sending event to content script:', data);
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: data
        }));
    }

    // Start recording user interactions
    function startRecording(id) {
        if (isRecording) {
            stopRecording();
        }

        console.log('Recording started with ID:', id);
        recordingId = id;
        isRecording = true;
        eventSequence = 0;

        // Record initial page state

        // Set up event listeners
        setupEventListeners();

        // Send confirmation to content script
        sendToContentScript({
            type: 'recordingStatus',
            status: 'started',
            recordingId: recordingId,
            timestamp: Date.now(),
            sequence: eventSequence++
        });

        recordInitialState();


        // Create a synthetic test event to verify the recording pipeline
        setTimeout(() => {
            if (isRecording) {
                sendToContentScript({
                    type: 'testEvent',
                    message: 'This is a test event to verify recording is working',
                    url: window.location.href,
                    timestamp: Date.now(),
                    sequence: eventSequence++
                });
            }
        }, 1000);
    }

    // Stop recording
    function stopRecording() {
        if (!isRecording) return;

        console.log('Recording stopped:', recordingId);

        // Remove all event listeners
        removeEventListeners();

        // Reset state
        isRecording = false;
        recordingId = null;
        lastEvent = null;
    }

    // Record the initial state of the page
    function recordInitialState() {
        const initialState = {
            type: 'initialState',
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            sequence: eventSequence++,
            recordingId: recordingId,

        };

        sendToContentScript(initialState);
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Mouse events
        addEventListeners(document, [
            RECORD_EVENTS.MOUSE.CLICK,
            RECORD_EVENTS.MOUSE.DBLCLICK
        ], handleMouseEvent);

        // Keyboard events
        addEventListeners(document, [
            RECORD_EVENTS.KEYBOARD.KEYDOWN
        ], handleKeyboardEvent);

        // Form input events
        addEventListeners(document, [
            RECORD_EVENTS.KEYBOARD.INPUT,
            RECORD_EVENTS.KEYBOARD.CHANGE
        ], handleInputEvent);

        // Navigation events
        addEventListeners(window, [
            RECORD_EVENTS.NAVIGATION.HASHCHANGE,
            RECORD_EVENTS.NAVIGATION.POPSTATE
        ], handleNavigationEvent);

        addEventListeners(document, [
            RECORD_EVENTS.NAVIGATION.SUBMIT
        ], handleFormSubmitEvent);

        // Scroll events (throttled)
        addEventListeners(window, [
            RECORD_EVENTS.SCROLL
        ], throttle(handleScrollEvent, 250));

        // Window resize events (throttled)
        addEventListeners(window, [
            'resize'
        ], throttle(handleResizeEvent, 250));

        // Record AJAX request (XHR & fetch)
        // interceptXHR();
        // interceptFetch();
    }

    // Add multiple event listeners and track them
    function addEventListeners(target, eventTypes, handler, options = { capture: true }) {
        eventTypes.forEach(type => {
            target.addEventListener(type, handler, options);
            listeners.push({ target, type, handler, options });
        });
    }

    // Remove all registered event listeners
    function removeEventListeners() {
        listeners.forEach(({ target, type, handler, options }) => {
            target.removeEventListener(type, handler, options);
        });
        listeners = [];

        // Restore original XHR and fetch
        restoreXHR();
        restoreFetch();
    }

    // Handle mouse events
    function handleMouseEvent(event) {
        if (!isRecording || !shouldRecordEvent()) return;
        // Find the target element's selector for replaying
        const selector = generateSelector(event.target);
        console.log(selector, event.target)
        if (!selector) return;

        const eventData = {
            type: event.type,
            selector: selector,
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now(),
            targetTagName: event.target.tagName,
            targetType: event.target.type || '',
            targetValue: getElementValue(event.target),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

    // Intercept XHR to record AJAX requests
    let originalXHR;
    function interceptXHR() {
        originalXHR = window.XMLHttpRequest;

        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();

            // If we're not recording, don't modify XHR behavior
            if (!isRecording) return xhr;

            // Store original methods
            const originalOpen = xhr.open;
            const originalSend = xhr.send;

            // Track request data
            let requestData = {
                method: '',
                url: '',
                async: true,
                data: null
            };

            // Override open method
            xhr.open = function(method, url, async = true) {
                requestData.method = method;
                requestData.url = url;
                requestData.async = async !== false;
                return originalOpen.apply(this, arguments);
            };

            // Override send method
            xhr.send = function(data) {
                requestData.data = data;

                const eventData = {
                    type: 'xhr',
                    method: requestData.method,
                    url: requestData.url,
                    async: requestData.async,
                    data: requestData.data ? String(requestData.data).substring(0, 1000) : null,
                    timestamp: Date.now(),
                    sequence: eventSequence++
                };

                sendToContentScript(eventData);
                return originalSend.apply(this, arguments);
            };

            return xhr;
        };
    }

    // Restore original XHR
    function restoreXHR() {
        if (originalXHR) {
            window.XMLHttpRequest = originalXHR;
        }
    }

    // Intercept fetch to record fetch requests
    let originalFetch;
    function interceptFetch() {
        originalFetch = window.fetch;

        window.fetch = function(input, init) {
            // If we're not recording, don't modify fetch behavior
            if (!isRecording) return originalFetch.apply(this, arguments);

            const url = typeof input === 'string' ? input : input.url;
            const method = init && init.method ? init.method : 'GET';
            const data = init && init.body ? init.body : null;

            const eventData = {
                type: 'fetch',
                method: method,
                url: url,
                data: data ? String(data).substring(0, 1000) : null,
                timestamp: Date.now(),
                sequence: eventSequence++
            };

            sendToContentScript(eventData);
            return originalFetch.apply(this, arguments);
        };
    }

    // Restore original fetch
    function restoreFetch() {
        if (originalFetch) {
            window.fetch = originalFetch;
        }
    }

    // Utility functions
    function generateSelector(context) {
        let index, pathSelector;

        if (!context) throw "not a dom reference";

        // if the node is an SVG element, use its parent instead
        if (context.tagName && context.tagName.toLowerCase() === 'svg') {
            context = context.parentNode;
        }

        // call getIndex function
        index = getIndex(context);

        while (context.tagName) {
            // build the selector path
            pathSelector = context.localName + (pathSelector ? ">" + pathSelector : "");
            context = context.parentNode;
        }
        // append nth-of-type to the last element
        pathSelector = pathSelector + `:nth-of-type(${index})`;
        return pathSelector;
    }

    function getIndex(node) {
        let i = 1;
        let tagName = node.tagName;

        while (node.previousSibling) {
            node = node.previousSibling;
            if (
                node.nodeType === 1 &&
                tagName.toLowerCase() === node.tagName.toLowerCase()
            ) {
                i++;
            }
        }
        return i;
    }


    // Create a unique selector for an element
    function getElementSelector(element) {
        if (!element || element === document || element === window) {
            return null;
        }

        // Try ID first (most specific)
        if (element.id) {
            return `#${element.id}`;
        }

        // Try data-testid (common in React apps)
        if (element.dataset && element.dataset.testid) {
            return `[data-testid="${element.dataset.testid}"]`;
        }

        // For form elements, try name attribute
        if (element.name && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
            return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
        }

        // Create a path based on classes and tag names
        let path = '';
        let current = element;

        for (let i = 0; i < 5; i++) { // Limit depth to avoid too complex selectors
            if (!current || current === document || current === window) break;

            let selector = current.tagName.toLowerCase();

            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\\s+/);
                if (classes.length > 0 && classes[0] !== '') {
                    // Use the first 2 classes at most to avoid too specific selectors
                    selector += '.' + classes.slice(0, 2).join('.');
                }
            }

            // Add nth-child if there are siblings with the same tag
            if (current.parentNode) {
                const siblings = Array.from(current.parentNode.children).filter(
                    child => child.tagName === current.tagName
                );

                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-child(${index})`;
                }
            }

            path = path ? `${selector} > ${path}` : selector;
            current = current.parentNode;

            // If we find an ID, break and use it as the root
            if (current && current.id) {
                path = `#${current.id} > ${path}`;
                break;
            }
        }

        return path;
    }

    // Get the value of an element based on its type
    function getElementValue(element) {
        if (!element) return null;

        if (element.tagName === 'INPUT') {
            if (element.type === 'checkbox' || element.type === 'radio') {
                return element.checked;
            }
            return element.value;
        }

        if (element.tagName === 'SELECT') {
            return element.value;
        }

        if (element.tagName === 'TEXTAREA') {
            return element.value;
        }

        return null;
    }

    // Check if an element is an interactive form element
    function isInteractiveElement(element) {
        if (!element) return false;

        const tagName = element.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            return true;
        }

        if (tagName === 'button' || element.getAttribute('contenteditable') === 'true') {
            return true;
        }

        return false;
    }

    // Get form data for form elements
    function getFormData(form) {
        if (!form || form.tagName !== 'FORM') return null;

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    // Throttle function for events that fire frequently
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Check if enough time has passed since the last event
    function shouldRecordEvent() {
        if (!lastEvent) return true;

        const now = Date.now();
        return (now - lastEvent.timestamp) >= MIN_EVENT_INTERVAL;
    }

    // Handle keyboard events
    function handleKeyboardEvent(event) {
        if (!isRecording || !shouldRecordEvent()) return;

        // Only record if it's a form element or the body
        if (!isInteractiveElement(event.target) && event.target !== document.body) return;

        const selector = getElementSelector(event.target);
        if (!selector) return;

        const eventData = {
            type: event.type,
            selector: selector,
            key: event.key,
            keyCode: event.keyCode,
            modifiers: {
                alt: event.altKey,
                ctrl: event.ctrlKey,
                shift: event.shiftKey,
                meta: event.metaKey
            },
            timestamp: Date.now(),
            targetTagName: event.target.tagName,
            targetType: event.target.type || '',
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

// Handle input/change events
    function handleInputEvent(event) {
        if (!isRecording || !shouldRecordEvent()) return;

        // Skip if not an input-like element
        if (!isInteractiveElement(event.target)) return;

        const selector = getElementSelector(event.target);
        if (!selector) return;

        const eventData = {
            type: event.type,
            selector: selector,
            value: getElementValue(event.target),
            timestamp: Date.now(),
            targetTagName: event.target.tagName,
            targetType: event.target.type || '',
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

// Handle navigation events
    function handleNavigationEvent(event) {
        if (!isRecording) return;

        const eventData = {
            type: event.type,
            url: window.location.href,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

// Handle form submit events
    function handleFormSubmitEvent(event) {
        if (!isRecording) return;

        const selector = getElementSelector(event.target);
        if (!selector) return;

        const formData = getFormData(event.target);

        const eventData = {
            type: event.type,
            selector: selector,
            formData: formData,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

// Handle scroll events
    function handleScrollEvent(event) {
        if (!isRecording) return;

        const eventData = {
            type: RECORD_EVENTS.SCROLL,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

// Handle window resize events
    function handleResizeEvent(event) {
        if (!isRecording) return;

        const eventData = {
            type: RECORD_EVENTS.VIEWPORT,
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
    }

    console.log('Browser Recorder: Recorder script initialized');
})();