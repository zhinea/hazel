// player-new.js
if(window.location.protocol === 'chrome:'){
    console.log('Tab not supported')
}else{
    chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
        console.log('Player received message:', message)

        try {
            switch (message.action) {
                case 'hazel_player_initializePlayback':
                    sendResponse({
                        success: true,
                        t: Date.now()
                    })
                    break;
                case 'hazel_player_executeEvent':
                    executeEvent(message.data.event)
                    sendResponse({
                        success: true
                    })
                    break;
                default:
                    console.log('Unknown action received:', message.action);

            }
        }catch (err){
            console.error('Error handling player message:', err)
            sendResponse({ success: false, error: err.message })
        }

    })

    // Execute a recorded event
    function executeEvent(event) {
        console.log('Executing event:', event);

        // If event type is missing, try to determine it
        if (!event.type) {
            console.warn('Event missing type property:', event);
            // Try to infer event type if possible
            if (event.key !== undefined) {
                event.type = 'keydown';
            } else if (event.scrollX !== undefined || event.scrollY !== undefined) {
                event.type = 'scroll';
            } else if (event.value !== undefined) {
                event.type = 'input';
            }
        }

        try {
            switch (event.type) {
                case 'initialState':
                    // We don't need to do anything for the initial state
                    console.log('Initial state event:', event);
                    window.location.href = event.url
                    break;
                case 'formNavigation':
                    window.location.href = event.url
                    break;

                case 'click':
                    simulateClick(event);
                    break;

                case 'dblclick':
                    simulateDoubleClick(event);
                    break;

                case 'keydown':
                    simulateKeyEvent(event);
                    break;

                case 'input':
                case 'change':
                    simulateInputEvent(event);
                    break;

                case 'submit':
                    simulateFormSubmit(event);
                    break;

                case 'scroll':
                    simulateScroll(event);
                    break;

                case 'viewportChange':
                    // Just log viewport changes, we don't resize the window
                    console.log('Viewport changed:', event.width, event.height);
                    break;

                case 'xhr':
                case 'fetch':
                    // Just log network requests, we don't replay them
                    console.log('Network request:', event.method, event.url);
                    break;

                case 'recordingStatus':
                    // Status event from recorder, just log it
                    console.log('Recording status event:', event);
                    break;

                case 'testEvent':
                    // Test event from recorder, just log it
                    console.log('Test event received:', event);
                    break;

                default:
                    console.log('Skipping unknown event type:', event.type);
            }
        } catch (error) {
            console.error(`Error executing ${event.type} event:`, error);
            throw error; // Re-throw to be caught by the caller
        }
    }

    // Simulate a mouse click event
    function simulateClick(event) {
        const element = findElement(event.selector);
        if (!element) {
            throw new Error(`Element not found: ${event.selector}`);
        }

        // Scroll the element into view if needed
        element.scrollIntoView({ behavior: 'auto', block: 'center' });

        // Create and dispatch mousedown, mouseup, and click events
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: event.x,
            clientY: event.y
        });

        element.dispatchEvent(clickEvent);

        // If it's a link, we might need to handle navigation
        if (element.tagName === 'A' && element.href) {
            const href = element.getAttribute('href');

            // Check if it's an internal link
            if (href.startsWith('#') ||
                href.startsWith('/') ||
                href.startsWith(window.location.origin)) {

                // Let the browser handle the navigation naturally
                return;
            }
        }
    }

    // Simulate a double click event
    function simulateDoubleClick(event) {
        const element = findElement(event.selector);
        if (!element) {
            throw new Error(`Element not found: ${event.selector}`);
        }

        // Scroll the element into view if needed
        element.scrollIntoView({ behavior: 'auto', block: 'center' });

        // Create and dispatch dblclick event
        const dblClickEvent = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            clientX: event.x,
            clientY: event.y
        });

        element.dispatchEvent(dblClickEvent);
    }

    // Simulate a keyboard event
    function simulateKeyEvent(event) {
        const element = findElement(event.selector);
        if (!element) {
            throw new Error(`Element not found: ${event.selector}`);
        }

        // Focus the element first
        element.focus();

        // Create and dispatch keydown event
        const keyEvent = new KeyboardEvent('keydown', {
            key: event.key,
            keyCode: event.keyCode,
            code: event.code,
            altKey: event.modifiers.alt,
            ctrlKey: event.modifiers.ctrl,
            shiftKey: event.modifiers.shift,
            metaKey: event.modifiers.meta,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(keyEvent);
    }

    // Simulate input/change event
    function simulateInputEvent(event) {
        const element = findElement(event.selector);
        if (!element) {
            throw new Error(`Element not found: ${event.selector}`);
        }

        // Handle different input types
        if (element.tagName === 'INPUT') {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = event.value;
            } else {
                element.value = event.value;
            }
        } else if (element.tagName === 'SELECT') {
            element.value = event.value;
        } else if (element.tagName === 'TEXTAREA') {
            element.value = event.value;
        }

        // Create and dispatch input event
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(inputEvent);

        // Also dispatch change event
        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(changeEvent);
    }

    // Simulate form submit
    function simulateFormSubmit(event) {
        const form = findElement(event.selector);
        if (!form || form.tagName !== 'FORM') {
            throw new Error(`Form not found: ${event.selector}`);
        }

        // Fill form data if available
        if (event.formData) {
            Object.entries(event.formData).forEach(([name, value]) => {
                const input = form.elements[name];
                if (input) {
                    input.value = value;
                }
            });
        }

        // Create and dispatch submit event
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });

        form.dispatchEvent(submitEvent);

        // If the event wasn't prevented, submit the form
        if (!submitEvent.defaultPrevented) {
            form.submit();
        }
    }

    // Simulate scroll event
    function simulateScroll(event) {
        // Scroll to the recorded position
        window.scrollTo({
            left: event.scrollX,
            top: event.scrollY,
            behavior: 'auto'
        });
    }

    // Find an element using the recorded selector with multiple fallback methods
    function findElement(selector) {
        if (!selector) {
            console.error('Missing selector in event');
            return null;
        }

        try {
            // First, try the exact selector
            let element = document.querySelector(selector);
            if (element) {
                console.log('Found element with exact selector:', selector);
                return element;
            }

            // If that fails, try some alternative approaches:

            // 1. Try removing nth-child parts which might have changed
            const simplifiedSelector = selector.replace(/\:nth-child\(\d+\)/g, '');
            if (simplifiedSelector !== selector) {
                element = document.querySelector(simplifiedSelector);
                if (element) {
                    console.log('Found element with simplified selector:', simplifiedSelector);
                    return element;
                }
            }

            // 3. Try using just the tag and attribute parts
            if (selector.includes('[')) {
                const parts = selector.split(' ');
                // Get the last part with an attribute
                const lastPartWithAttr = parts.filter(part => part.includes('[')).pop();
                if (lastPartWithAttr) {
                    element = document.querySelector(lastPartWithAttr);
                    if (element) {
                        console.log('Found element with attribute selector:', lastPartWithAttr);
                        return element;
                    }
                }
            }

            // 4. For form elements, try by name
            if (selector.toLowerCase().includes('input') ||
                selector.toLowerCase().includes('select') ||
                selector.toLowerCase().includes('textarea')) {
                const nameMatch = selector.match(/name="([^"]+)"/);
                if (nameMatch && nameMatch[1]) {
                    element = document.querySelector(`[name="${nameMatch[1]}"]`);
                    if (element) {
                        console.log('Found element by name:', nameMatch[1]);
                        return element;
                    }
                }
            }

            // 2. For ID-based selectors, try just the ID part
            if (selector.includes('#')) {
                const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);
                if (idMatch && idMatch[1]) {
                    element = document.getElementById(idMatch[1]);
                    if (element) {
                        console.log('Found element with ID:', idMatch[1]);
                        return element;
                    }
                }
            }

            console.error('Element not found with any method. Selector:', selector);
            return null;
        } catch (error) {
            console.error('Error finding element with selector:', selector, error);
            return null;
        }
    }

}

