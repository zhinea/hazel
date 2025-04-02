// player-new.js
if(window.location.protocol === 'chrome:'){
    console.log('Tab not supported')
}else{
    let settings = {}
    let toolboxElement = null; // Reference to the toolbox DOM element
    let isToolboxVisible = true;

    // --- Toolbox UI Management ---

    function createToolboxHTML() {
        const toolbox = document.createElement('div');
        toolbox.id = 'hazel-playback-toolbox';
        toolbox.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 280px;
            background-color: #ffffff;
            border: 1px solid #dadce0;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
            font-family: 'Roboto', 'Segoe UI', sans-serif;
            font-size: 13px;
            color: #3c4043;
            z-index: 2147483647; /* Max z-index */
            overflow: hidden;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateY(0);
            opacity: 1;
        `;

        toolbox.innerHTML = `
            <div class="hazel-toolbox-header" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background-color: #f1f3f4; border-bottom: 1px solid #dadce0;">
                <span style="font-weight: 500; color: #202124;">Hazel Playback</span>
                <button id="hazel-toolbox-close" title="Hide Toolbox" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #5f6368; padding: 2px;">&times;</button>
            </div>
            <div class="hazel-toolbox-body" style="padding: 12px;">
                <div class="hazel-status" style="margin-bottom: 8px; display: flex; align-items: center;">
                    <span class="hazel-status-indicator" style="width: 10px; height: 10px; border-radius: 50%; background-color: #9aa0a6; margin-right: 8px; display: inline-block;"></span>
                    Status: <strong id="hazel-status-text" style="margin-left: 4px;">Idle</strong>
                </div>
                <div class="hazel-progress" style="margin-bottom: 8px;">
                    Event: <span id="hazel-current-event">0</span> / <span id="hazel-total-events">0</span>
                </div>
                <div class="hazel-progress-bar-container" style="background-color: #e8eaed; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                    <div id="hazel-progress-bar" style="width: 0%; height: 100%; background-color: #4285f4; transition: width 0.2s ease-out;"></div>
                </div>
                <div id="hazel-error-message" style="color: #d93025; font-size: 12px; margin-top: 5px; display: none;"></div>
            </div>
        `;

        document.body.appendChild(toolbox);
        toolboxElement = toolbox;

        // Add close button listener
        toolboxElement.querySelector('#hazel-toolbox-close').addEventListener('click', () => {
            hideToolbox();
        });

        // Make it draggable (optional - basic implementation)
        makeDraggable(toolboxElement.querySelector('.hazel-toolbox-header'), toolboxElement);

        return toolbox;
    }

    function getToolboxElement() {
        if (!toolboxElement || !document.body.contains(toolboxElement)) {
            toolboxElement = createToolboxHTML();
        }
        return toolboxElement;
    }

    function showToolbox() {
        const tb = getToolboxElement();
        tb.style.opacity = '1';
        tb.style.transform = 'translateY(0)';
        tb.style.pointerEvents = 'auto';
        isToolboxVisible = true;
    }

    function hideToolbox() {
        if (!toolboxElement) return;
        toolboxElement.style.opacity = '0';
        toolboxElement.style.transform = 'translateY(20px)';
        toolboxElement.style.pointerEvents = 'none'; // Allow clicking through while hidden
        isToolboxVisible = false;
        // Optionally, add a small button to re-show it, or rely on next playback start
    }

    function updateToolboxUI(status) {
        console.debug("Toolbox UI: Received status update", status);
        if (!status) return;

        // Ensure toolbox is visible when playback starts or resumes
        if (['initializing', 'playing', 'resuming', 'error'].includes(status.state) && !isToolboxVisible) {
            showToolbox();
        } else if (!isToolboxVisible) {
            // Don't update if hidden, unless it's to show it
            return;
        }


        const tb = getToolboxElement(); // Ensure it exists
        const statusTextEl = tb.querySelector('#hazel-status-text');
        const currentEventEl = tb.querySelector('#hazel-current-event');
        const totalEventsEl = tb.querySelector('#hazel-total-events');
        const progressBarEl = tb.querySelector('#hazel-progress-bar');
        const errorMsgEl = tb.querySelector('#hazel-error-message');
        const statusIndicatorEl = tb.querySelector('.hazel-status-indicator');

        // Update Status Text and Indicator Color
        let statusText = 'Unknown';
        let indicatorColor = '#9aa0a6'; // Grey default
        switch (status.state) {
            case 'idle':
                statusText = 'Idle';
                indicatorColor = '#9aa0a6'; // Grey
                break;
            case 'initializing':
                statusText = 'Initializing...';
                indicatorColor = '#ff9800'; // Orange
                break;
            case 'playing':
                statusText = 'Playing';
                indicatorColor = '#4caf50'; // Green
                break;
            case 'paused':
                statusText = 'Paused';
                indicatorColor = '#ffc107'; // Amber
                break;
            case 'complete':
                statusText = 'Complete';
                indicatorColor = '#4285f4'; // Blue
                break;
            case 'error':
                statusText = 'Error';
                indicatorColor = '#d93025'; // Red
                break;
            default:
                statusText = status.state;
        }
        statusTextEl.textContent = statusText;
        statusIndicatorEl.style.backgroundColor = indicatorColor;

        // Update Event Counts
        currentEventEl.textContent = status.currentEvent || 0;
        totalEventsEl.textContent = status.totalEvents || 0;

        // Update Progress Bar
        const progress = status.progress !== undefined ? status.progress :
            (status.totalEvents > 0 ? Math.round(((status.currentEvent || 0) / status.totalEvents) * 100) : 0);
        progressBarEl.style.width = `${Math.min(100, Math.max(0, progress))}%`; // Clamp between 0 and 100

        // Update Error Message
        if (status.state === 'error' && status.errorMessage) {
            errorMsgEl.textContent = `Error: ${status.errorMessage}`;
            errorMsgEl.style.display = 'block';
        } else {
            errorMsgEl.style.display = 'none';
            errorMsgEl.textContent = '';
        }

        // Hide toolbox automatically after completion? (Optional)
        if (status.state === 'complete' || (status.state === 'idle' && status.totalEvents > 0)) { // Hide after completion or idle after running
            setTimeout(hideToolbox, 5000); // Hide after 3 seconds
        }
    }

    // Basic drag functionality
    function makeDraggable(dragHandle, draggableElement) {
        let isDragging = false;
        let offsetX, offsetY;

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            // Calculate offset from the top-left corner of the element
            const rect = draggableElement.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            draggableElement.style.cursor = 'grabbing';
            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // Calculate new position
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // Basic boundary check (optional)
            // newX = Math.max(0, Math.min(newX, window.innerWidth - draggableElement.offsetWidth));
            // newY = Math.max(0, Math.min(newY, window.innerHeight - draggableElement.offsetHeight));

            draggableElement.style.left = `${newX}px`;
            draggableElement.style.top = `${newY}px`;
            // Important: Remove bottom/right positioning if dragging
            draggableElement.style.bottom = 'auto';
            draggableElement.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                draggableElement.style.cursor = 'grab'; // Or default
                document.body.style.userSelect = ''; // Re-enable selection
            }
        });

        dragHandle.style.cursor = 'grab';
    }


    chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
        console.debug('Player received message:', message)

        if(message?.settings){
            settings = message?.settings || {}
        }

        try {
            switch (message.action) {
                case 'hazel_player_initializePlayback':
                    updateToolboxUI({ state: 'initializing', currentEvent: 0, totalEvents: '?', progress: 0 });
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
                case 'hazel_updatePlaybackStatus':
                    updateToolboxUI(message.status);
                    // No response needed for status updates
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
        console.debug('Executing event:', event);

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
                    console.debug('Test event received:', event);
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
                console.debug('Found element with exact selector:', selector);
                return element;
            }

            // If that fails, try some alternative approaches:

            // 1. Try removing nth-child parts which might have changed
            const simplifiedSelector = selector.replace(/\:nth-child\(\d+\)/g, '');
            if (simplifiedSelector !== selector) {
                element = document.querySelector(simplifiedSelector);
                if (element) {
                    console.debug('Found element with simplified selector:', simplifiedSelector);
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
                        console.debug('Found element with attribute selector:', lastPartWithAttr);
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

    function compileText(templateString) {
        if (typeof templateString !== 'string') {
            console.error("CompileText Error: templateString must be a string.");
            return "";
        }
        if (typeof settings !== 'object' || settings === null) {
            console.error("CompileText Error: data must be a non-null object.");
            return templateString;
        }

        const regex = /\{\{\s*(.*?)\s*\}\}/g;

        return templateString.replace(regex, async (match, variableName) => {
            let settingResult = settings.customVariables.find(variable => variable.name === variableName)
            if(!!settingResult){
                if(settingResult.type === 'plain'){
                    console.log('plain text')
                    return settingResult.value;
                }

                if(settingResult.type === 'ai'){
                    const aiResponse = await fetchAPI('POST', '/v1/ai/faker', {
                        name: settingResult.name,
                        prompt: settingResult.prompt,
                        // temperature: settingResult.temperature,
                        // top_p: settingResult.top_p
                    })
                    console.log(aiResponse)

                    if(aiResponse?.code === 'ok'){
                        return aiResponse?.data?.answer || settingResult?.value || "";
                    }

                    return settingResult?.value || "";
                }

                if(settingResult.type === 'api'){
                    return settingResult.value + ' api generated';
                }
            }


            console.warn(`CompileText Warning: Variable "${variableName}" not found in data object.`);
            return match;
        });
    }

    async function replaceAsync(str, regex, asyncFn) {
        const promises = [];
        str.replace(regex, (full, ...args) => {
            promises.push(asyncFn(full, ...args));
            return full;
        });
        const data = await Promise.all(promises);
        return str.replace(regex, () => data.shift());
    }

    async function fetchAPI(method, url, payload){
        return new Promise(resolve => {
            return chrome.runtime.sendMessage({
                action: 'fetch',
                method,
                url,
                payload
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending event to background:', chrome.runtime.lastError);
                } else {
                    console.log('Event sent to background, response:', response);
                }
                resolve(response)
            })
        })
    }

}