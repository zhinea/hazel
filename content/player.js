// player.js - Injected into the page to replay recorded user actions
(function() {
    console.log('Player script loaded and running');

    // State
    let isPlaying = false;
    let recordingId = null;
    let events = [];
    let currentEventIndex = 0;
    let playbackSpeed = 1.0; // 1.0 is normal speed
    let lastPlaybackTime = 0;
    let eventTimeoutId = null;

    // Current playback status (for UI)
    let playbackStatus = {
        totalEvents: 0,
        currentEvent: 0,
        progress: 0,
        state: 'idle' // idle, playing, paused, complete, error
    };

    // Communication with content script
    window.addEventListener('BrowserRecorder_Player_ToPage', (event) => {
        console.log('Player received message:', event.detail);
        const message = event.detail;

        try {
            switch (message.action) {
                case 'startPlayback':
                    startPlayback(message.recordingId, message.events);
                    break;

                case 'pausePlayback':
                    pausePlayback();
                    break;

                case 'resumePlayback':
                    resumePlayback();
                    break;

                case 'stopPlayback':
                    stopPlayback();
                    break;

                case 'setPlaybackSpeed':
                    setPlaybackSpeed(message.speed);
                    break;

                default:
                    console.warn('Unknown action received:', message.action);
            }
        } catch (error) {
            console.error('Error handling player message:', error);
            sendToContentScript({
                action: 'playbackError',
                error: error.message
            });
        }
    });

    // Send message to content script
    function sendToContentScript(data) {
        window.dispatchEvent(new CustomEvent('BrowserRecorder_Player_FromPage', {
            detail: data
        }));
    }

    // Start playback of recorded events
    function startPlayback(id, recordedEvents) {
        if (isPlaying) {
            stopPlayback();
        }

        console.log('Playback started:', id);

        // Validate events
        if (!recordedEvents || !Array.isArray(recordedEvents)) {
            console.error('Invalid events format:', recordedEvents);
            sendToContentScript({
                action: 'playbackError',
                error: 'Invalid events format'
            });
            return;
        }

        console.log('Events to play:', recordedEvents.length);

        recordingId = id;
        // Make a deep copy of events and sort them
        events = JSON.parse(JSON.stringify(recordedEvents))
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        isPlaying = true;
        currentEventIndex = 0;
        lastPlaybackTime = Date.now();

        playbackStatus = {
            totalEvents: events.length,
            currentEvent: 0,
            progress: 0,
            state: 'playing'
        };

        updatePlaybackStatus();

        // Log the first few events to help with debugging
        console.log('First few events:', events.slice(0, 3));

        // Start playback with a small delay to ensure the page is ready
        setTimeout(() => {
            playNextEvent();
        }, 500);
    }

    // Pause the playback
    function pausePlayback() {
        if (!isPlaying) return;

        isPlaying = false;
        clearTimeout(eventTimeoutId);

        playbackStatus.state = 'paused';
        updatePlaybackStatus();

        console.log('Playback paused');
    }

    // Resume playback
    function resumePlayback() {
        if (isPlaying) return;

        isPlaying = true;
        lastPlaybackTime = Date.now();

        playbackStatus.state = 'playing';
        updatePlaybackStatus();

        playNextEvent();

        console.log('Playback resumed');
    }

    // Stop playback completely
    function stopPlayback() {
        if (!isPlaying && currentEventIndex === 0) return;

        isPlaying = false;
        clearTimeout(eventTimeoutId);

        playbackStatus.state = 'idle';
        updatePlaybackStatus();

        console.log('Playback stopped');
    }

    // Set playback speed
    function setPlaybackSpeed(speed) {
        if (speed < 0.1 || speed > 10) return;

        playbackSpeed = speed;
        console.log('Playback speed set to', speed);
    }

    // Update playback status and notify content script
    function updatePlaybackStatus() {
        if (playbackStatus.totalEvents > 0) {
            playbackStatus.progress = (currentEventIndex / playbackStatus.totalEvents) * 100;
        }

        playbackStatus.currentEvent = currentEventIndex;

        sendToContentScript({
            action: 'playbackStatus',
            status: playbackStatus
        });
    }

    // Play the next event in the queue
    function playNextEvent() {
        if (!isPlaying || currentEventIndex >= events.length) {
            completePlayback();
            return;
        }

        const event = events[currentEventIndex];
        console.log(`Playing event ${currentEventIndex + 1}/${events.length}:`, event);

        // Calculate delay for next event
        let delay = 100; // Increased minimum delay for more stability

        if (currentEventIndex < events.length - 1) {
            const nextEvent = events[currentEventIndex + 1];
            // Use timestamp if available, otherwise use default delay
            if (event.timestamp && nextEvent.timestamp) {
                delay = Math.max(100, (nextEvent.timestamp - event.timestamp) / playbackSpeed);
            }
        }

        // Schedule the event
        eventTimeoutId = setTimeout(() => {
            try {
                executeEvent(event);
                currentEventIndex++;
                updatePlaybackStatus();

                // Add a small consistent delay between events for stability
                setTimeout(() => {
                    playNextEvent();
                }, 100);
            } catch (error) {
                console.error('Error executing event:', error, event);
                handlePlaybackError(error, event);
            }
        }, delay);
    }

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

    // Complete playback
    function completePlayback() {
        isPlaying = false;

        playbackStatus.state = 'complete';
        playbackStatus.progress = 100;
        updatePlaybackStatus();

        sendToContentScript({
            action: 'playbackComplete',
            recordingId: recordingId
        });

        console.log('Playback completed');
    }

    // Handle playback errors
    function handlePlaybackError(error, event) {
        console.error('Playback error:', error, 'Event:', event);

        isPlaying = false;
        playbackStatus.state = 'error';
        updatePlaybackStatus();

        sendToContentScript({
            action: 'playbackError',
            error: error.message,
            event: event
        });
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

            console.error('Element not found with any method. Selector:', selector);
            return null;
        } catch (error) {
            console.error('Error finding element with selector:', selector, error);
            return null;
        }
    }

    console.log('Browser Recorder: Player script initialized');
})();