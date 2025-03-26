// recorder.js - Injected into the page to record user actions
(function() {
    console.log('Recorder script loaded and initializing');

    // window.addEventListener('DOMContentLoaded', () => {
    //     console.log('hehehe')
    //     if(getCurrentStatus() === 'recording' && getCurrentRecordingId() != null){
    //         console.log('disni')
    //         sendToContentScript({
    //             type: 'formNavigation',
    //             url: window.location.href,
    //             timestamp: Date.now(),
    //             sequence: eventSequence++
    //         })
    //         startRecording(getCurrentRecordingId())
    //     }
    // })


    // State
    let isRecording = false;
    let isPaused = false;
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
            INPUT: 'input',
            // KEYDOWN: 'keydown',
            // KEYUP: 'keyup'
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
                startRecording(message.recordingId, message?.isNewRecord || true);
                break;

            case 'stopRecording':
                stopRecording();
                break;

            case 'pauseRecording':
                pauseRecording();
                break;

            case 'resumeRecording':
                resumeRecording();
                break;

            case 'incrementEventCount':
                break;

            default:
                console.warn('Unknown action received by recorder:', message.action);
        }
    });

    // Send message to content script
    function sendToContentScript(data) {
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: data
        }));
    }

    const runAll = (fns, timeout = 100) => {
        if (fns.length === 0) return;
        console.log(fns, fns.length)
        setTimeout(() => {
            fns.shift()();
            runAll(fns, timeout);
        }, timeout);
    };

    const getRecorderStorage = () => {
        let result = localStorage.getItem("hazel_recorder_storage");
        if(result){
            result = JSON.parse(result);
            return result;
        }
        return null;
    }

    const getCurrentStatus = () => {
        let result = getRecorderStorage()
        if(result){
            return result?.status;
        }
        return null;
    };
    const setCurrentStatus = (status, recordingId = null) => localStorage.setItem("hazel_recorder_status", JSON.stringify({
        status,
        recordingId
    }));
    const getCurrentRecordingId = () => {
        let result = getRecorderStorage()
        if(result){
            return result?.recordingId;
        }
        return null;
    };

    // Start recording user interactions
    function startRecording(id, isNewRecord = true) {
        console.log('started with id', id,'is new record',  isNewRecord)
        if (isRecording) {
            stopRecording();
        }

        // if(getCurrentStatus() == null || getCurrentStatus() === 'stopped'){
        // }
        setCurrentStatus('recording', id);

        console.log('Recording started with ID:', id);
        recordingId = id;
        isRecording = true;
        isPaused = false;
        eventSequence = 0;

        runAll([
            () => isNewRecord ? recordInitialState() : '',
            () => isNewRecord ? sendToContentScript({
                type: 'recordingStatus',
                status: 'started',
                recordingId: recordingId,
                timestamp: Date.now(),
                sequence: eventSequence++
            }): '',
            injectToolbar,
            setupEventListeners
        ]);

        // Create a synthetic test event to verify the recording pipeline
        setTimeout(() => {
            if (isRecording) {
                sendToContentScript({
                    type: 'testEvent',
                    message: 'ping',
                    url: window.location.href,
                    timestamp: Date.now(),
                    sequence: eventSequence++
                });
            }
        }, 1000);
    }

    // Inject the recording toolbar
    function injectToolbar() {
        // Check if toolbar script is already injected
        if (!document.getElementById('browser-recorder-toolbar-script')) {
            // Inject the toolbar script
            const script = document.createElement('script');
            script.id = 'browser-recorder-toolbar-script';
            script.src = chrome?.runtime?.getURL('content/recording-toolbar.js');
            (document.head || document.documentElement).appendChild(script);

            // Wait for script to load
            script.onload = function() {
                // Show the toolbar
                window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
                    detail: {
                        action: 'showRecordingToolbar'
                    }
                }));
            };
        } else {
            // Script already injected, just show the toolbar
            window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
                detail: {
                    action: 'showRecordingToolbar'
                }
            }));
        }
    }

    // Pause recording
    function pauseRecording() {
        if (!isRecording || isPaused) return;

        isPaused = true;
        console.log('Recording paused');

        // Send status to content script
        sendToContentScript({
            type: 'recordingStatus',
            status: 'paused',
            recordingId: recordingId,
            timestamp: Date.now(),
            sequence: eventSequence++
        });
    }

    // Resume recording
    function resumeRecording() {
        if (!isRecording || !isPaused) return;

        isPaused = false;
        console.log('Recording resumed');

        // Send status to content script
        sendToContentScript({
            type: 'recordingStatus',
            status: 'resumed',
            recordingId: recordingId,
            timestamp: Date.now(),
            sequence: eventSequence++
        });
    }

    // Stop recording
    function stopRecording() {
        if (!isRecording) return;

        console.log('Recording stopped:', recordingId);

        // Remove all event listeners
        removeEventListeners();

        // Hide the recording toolbar
        window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
            detail: {
                action: 'hideRecordingToolbar'
            }
        }));

        // Reset state
        isRecording = false;
        isPaused = false;
        recordingId = null;
        lastEvent = null;

        // Send status to content script
        sendToContentScript({
            type: 'recordingStatus',
            status: 'stopped',
            timestamp: Date.now(),
            sequence: eventSequence++
        });

        setCurrentStatus('stopped');
    }

    // Record the initial state of the page
    function recordInitialState() {
        sendToContentScript({
            type: 'initialState',
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            sequence: eventSequence++,
            recordingId: recordingId,
        });
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
            RECORD_EVENTS.KEYBOARD.KEYDOWN,
            // RECORD_EVENTS.KEYBOARD.KEYUP
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

        document.addEventListener('submit', handleFormSubmitEvent, { passive: true });

        // addEventListeners(document, [
        //     RECORD_EVENTS.NAVIGATION.SUBMIT
        // ], handleFormSubmitEvent, { passive: true});

        // Scroll events (throttled)
        addEventListeners(window, [
            RECORD_EVENTS.SCROLL
        ], throttle(handleScrollEvent, 250));

        // Window resize events (throttled)
        addEventListeners(window, [
            'resize'
        ], throttle(handleResizeEvent, 250));

        // window.addEventListener('beforeunload', beforeUnloadHandler, {once: true});

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

    // Add a listener for beforeunload to detect if this form submission will cause navigation
    const beforeUnloadHandler = () => {
        // sendToContentScript({
        //     type: 'formNavigation',
        //     url: window.location.href,
        //     timestamp: Date.now(),
        //     sequence: eventSequence++
        // })
        console.log('unload')
        window.removeEventListener('beforeunload', beforeUnloadHandler);
    };

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
        if (!isRecording || isPaused || !shouldRecordEvent()) return;

        // Find the target element's selector for replaying
        const selector = generateSelector(event.target);
        if (!selector) return;
        const targetClass = event?.target?.className;
        const classStr = typeof targetClass === 'string' ? targetClass : targetClass?.baseVal || '';

        if (classStr.startsWith('hazel_') || selector?.includes('hazel_')) return;


        // dont listen hazel toolbar events
        if(selector?.includes('hazel_')) return;

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

        // Update toolbar event count
        incrementToolbarEventCount();
    }

    // Increment the event count in the toolbar
    function incrementToolbarEventCount() {
        window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
            detail: {
                action: 'incrementEventCount'
            }
        }));
    }

    // Intercept XHR to record AJAX requests
    let originalXHR;
    function interceptXHR() {
        originalXHR = window.XMLHttpRequest;

        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();

            // If we're not recording, don't modify XHR behavior
            if (!isRecording || isPaused) return xhr;

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
                incrementToolbarEventCount();
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
            if (!isRecording || isPaused) return originalFetch.apply(this, arguments);

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
            incrementToolbarEventCount();
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
        let pathParts = [];
        let currentElement = context;

        if (!currentElement) throw "Invalid DOM reference";

        // Handle SVG elements by moving to parent
        if (currentElement.tagName?.toLowerCase() === 'svg') {
            currentElement = currentElement.parentNode;
        }

        while (currentElement && currentElement.tagName) {
            let selectorPart = '';
            const tagName = currentElement.tagName.toLowerCase();

            // 1. Prefer ID selector
            if (currentElement.id) {
                selectorPart = `#${currentElement.id}`;
                pathParts.push(selectorPart);
                break; // IDs should be unique
            }

            // 2. Use class-based selector with index when needed
            const classes = getValidClasses(currentElement);
            if (classes.length > 0) {
                const classIndex = getClassIndex(currentElement, classes);
                selectorPart = `${tagName}.${classes.join('.')}`;

                // Add index only when duplicate siblings exist
                if (classIndex > 1) {
                    selectorPart += `:nth-of-type(${classIndex})`;
                }
            }
            // 3. Fallback to tag + structural index
            else {
                const tagIndex = getTagIndex(currentElement);
                selectorPart = `${tagName}:nth-of-type(${tagIndex})`;
            }

            pathParts.push(selectorPart);
            currentElement = currentElement.parentNode;
        }

        return pathParts.reverse().join(' ');
    }

    // Helper function to get valid class list
    function getValidClasses(element) {
        return (element?.className || '')
            .split(/\s+/)
            .filter(c => c.length > 0 && !c.startsWith('_'));
    }

    // Get index among siblings with same tag and classes
    function getClassIndex(node, targetClasses) {
        const siblings = Array.from(node.parentNode?.children || []);
        const tag = node.tagName.toLowerCase();
        let index = 1;

        for (const sibling of siblings) {
            if (sibling === node) break;
            if (sibling.tagName.toLowerCase() !== tag) continue;

            const siblingClasses = getValidClasses(sibling);
            if (arraysEqual(targetClasses, siblingClasses)) {
                index++;
            }
        }

        return index;
    }

// Original tag-based index
    function getTagIndex(node) {
        let index = 1;
        const tag = node.tagName.toLowerCase();
        let sibling = node.previousSibling;

        while (sibling) {
            if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === tag) {
                index++;
            }
            sibling = sibling.previousSibling;
        }

        return index;
    }

// Array comparison helper
    function arraysEqual(a, b) {
        if (a === b) return true;
        if (a.length !== b.length) return false;

        const sortedA = [...a].sort();
        const sortedB = [...b].sort();

        return sortedA.every((val, i) => val === sortedB[i]);
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
        if (!isRecording || isPaused || !shouldRecordEvent()) return;

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
        incrementToolbarEventCount();
    }

    // Handle input/change events
    function handleInputEvent(event) {
        if (!isRecording || isPaused || !shouldRecordEvent()) return;

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
        incrementToolbarEventCount();
    }

    // Handle navigation events
    function handleNavigationEvent(event) {
        if (!isRecording || isPaused) return;

        const eventData = {
            type: event.type,
            url: window.location.href,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
        incrementToolbarEventCount();
    }

    // Handle form submit events
    function handleFormSubmitEvent(event) {
        // Remove this line that was preventing submission
        // event.preventDefault();

        if (!isRecording || isPaused) return;
        console.log('Form submit detected');

        const selector = generateSelector(event.target);
        if (!selector) return;

        const formData = {};

        // Collect form data properly
        if (event.target && event.target.tagName === 'FORM') {
            const formElements = event.target.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        if (element.checked) {
                            formData[element.name] = element.value;
                        }
                    } else if (element.type !== 'submit' && element.type !== 'button') {
                        formData[element.name] = element.value;
                    }
                }
            }
        }

        const eventData = {
            type: 'submit',
            selector: selector,
            formData: formData,
            url: window.location.href,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        // Send the event data to content script
        sendToContentScript(eventData);
        lastEvent = eventData;
        incrementToolbarEventCount();

        // Add a listener for navigation that may happen after form submission
        window.addEventListener('beforeunload', beforeUnloadHandler, {once: true});
    }

    // Handle scroll events
    function handleScrollEvent(event) {
        if (!isRecording || isPaused) return;

        const eventData = {
            type: RECORD_EVENTS.SCROLL,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
        incrementToolbarEventCount();
    }

    // Handle window resize events
    function handleResizeEvent(event) {
        if (!isRecording || isPaused) return;

        const eventData = {
            type: RECORD_EVENTS.VIEWPORT,
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: Date.now(),
            sequence: eventSequence++
        };

        sendToContentScript(eventData);
        lastEvent = eventData;
        incrementToolbarEventCount();
    }


    console.log('Browser Recorder: Recorder script initialized');
})();