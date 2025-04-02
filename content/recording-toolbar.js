// recording-toolbar.js - Injects and manages the recording toolbar UI

(function() {
    let toolbar = null;
    let recordingStartTime = null;
    let eventCount = 0;
    let recordingState = 'recording'; // 'recording', 'paused'
    let durationInterval = null;
    let currentRecordingId = null;

    // Create and inject the toolbar
    function createToolbar() {
        if (toolbar) return; // Don't create multiple toolbars

        // Create toolbar container
        toolbar = document.createElement('div');
        toolbar.id = 'hazel_browser-recorder-toolbar';

        // Set toolbar styles
        const styles = `
            #hazel_browser-recorder-toolbar {
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: #333333;
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 999999;
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                padding: 10px 15px;
                transition: opacity 0.3s;
                user-select: none;
            }
            
            #hazel_browser-recorder-toolbar.hazel_minimized {
                width: auto;
                height: auto;
            }
            
            #hazel_browser-recorder-toolbar .hazel_recording-indicator {
                display: flex;
                align-items: center;
                margin-right: 12px;
            }
            
            #hazel_browser-recorder-toolbar .hazel_recording-dot {
                width: 12px;
                height: 12px;
                background-color: #ff4a4a;
                border-radius: 50%;
                margin-right: 8px;
                animation: hazel_pulse 1.5s infinite;
            }
            
            #hazel_browser-recorder-toolbar.hazel_paused .hazel_recording-dot {
                animation: none;
                background-color: #ffaa00;
            }
            
            #hazel_browser-recorder-toolbar .hazel_stats {
                display: flex;
                align-items: center;
                font-size: 14px;
                margin-right: 15px;
            }
            
            #hazel_browser-recorder-toolbar .hazel_stat {
                margin-right: 15px;
            }
            
            #hazel_browser-recorder-toolbar .hazel_stat-label {
                opacity: 0.7;
                margin-right: 5px;
            }
            
            #hazel_browser-recorder-toolbar .hazel_controls {
                display: flex;
                align-items: center;
            }
            
            #hazel_browser-recorder-toolbar button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px 10px;
                margin-left: 5px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
            }
            
            #hazel_browser-recorder-toolbar button:hover {
                background-color: rgba(255, 255, 255, 0.15);
            }
            
            #hazel_browser-recorder-toolbar .hazel_btn-pause {
                color: #ffaa00;
            }
            
            #hazel_browser-recorder-toolbar .hazel_btn-resume {
                color: #4caf50;
            }
            
            #hazel_browser-recorder-toolbar .hazel_btn-stop {
                color: #ff4a4a;
            }
            
            #hazel_browser-recorder-toolbar .hazel_btn-minimize {
                margin-left: 15px;
                opacity: 0.7;
            }
            
            #hazel_browser-recorder-toolbar button svg {
                width: 16px;
                height: 16px;
                margin-right: 5px;
            }
            
            @keyframes hazel_pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;

        // Create style element
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        // Toolbar content
        toolbar.innerHTML = `
            <div class="hazel_recording-indicator">
                <div class="hazel_recording-dot"></div>
                <span class="hazel_recording-status">Recording</span>
            </div>
            <div class="hazel_stats">
                <div class="hazel_stat hazel_duration">
                    <span class="hazel_stat-label">Duration:</span>
                    <span class="hazel_stat-value" id="hazel_recording-duration">00:00</span>
                </div>
                <div class="hazel_stat hazel_events">
                    <span class="hazel_stat-label">Events:</span>
                    <span class="hazel_stat-value" id="hazel_event-count">0</span>
                </div>
            </div>
            <div class="hazel_controls">
                <button class="hazel_btn-pause" id="hazel_btn-pause">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    Pause
                </button>
                <button class="hazel_btn-resume" id="hazel_btn-resume" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Resume
                </button>
                <button class="hazel_btn-stop" id="hazel_btn-stop">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                    Stop
                </button>
                <button class="hazel_btn-minimize" id="hazel_btn-minimize">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="4 14 10 14 10 20"></polyline>
                        <polyline points="20 10 14 10 14 4"></polyline>
                        <line x1="14" y1="10" x2="21" y2="3"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Initialize event handlers
        initEventHandlers();

        return toolbar;
    }

    // Initialize event handlers for toolbar buttons
    function initEventHandlers() {
        const pauseBtn = document.getElementById('hazel_btn-pause');
        const resumeBtn = document.getElementById('hazel_btn-resume');
        const stopBtn = document.getElementById('hazel_btn-stop');
        const minimizeBtn = document.getElementById('hazel_btn-minimize');

        // Pause button
        pauseBtn.addEventListener('click', function() {
            pauseRecording();
        });

        // Resume button
        resumeBtn.addEventListener('click', function() {
            resumeRecording();
        });

        // Stop button
        stopBtn.addEventListener('click', function() {
            stopRecording();
        });

        // Minimize button
        minimizeBtn.addEventListener('click', function() {
            // Toggle minimize/maximize
            toolbar.classList.toggle('hazel_minimized');
            if (toolbar.classList.contains('hazel_minimized')) {
                // Save elements state before minimizing
                toolbar.dataset.previousHtml = toolbar.innerHTML;
                toolbar.innerHTML = `
                    <div class="hazel_recording-indicator">
                        <div class="hazel_recording-dot"></div>
                    </div>
                    <button class="hazel_btn-minimize" id="hazel_btn-minimize">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="4 14 10 14 10 20"></polyline>
                            <polyline points="20 10 14 10 14 4"></polyline>
                            <line x1="14" y1="10" x2="21" y2="3"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    </button>
                `;
                document.getElementById('hazel_btn-minimize').addEventListener('click', function() {
                    toolbar.classList.remove('hazel_minimized');
                    toolbar.innerHTML = toolbar.dataset.previousHtml;
                    initEventHandlers(); // Reinitialize event handlers
                });
            }
        });

        // Make toolbar draggable
        makeDraggable(toolbar);
    }

    // Make an element draggable
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.addEventListener('mousedown', dragMouseDown);

        function dragMouseDown(e) {
            e.preventDefault();
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
        }

        function elementDrag(e) {
            e.preventDefault();
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set the element's new position
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = "auto";
        }

        function closeDragElement() {
            // Stop moving when mouse button is released
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
        }
    }

    // Load recording status from localStorage
    function loadRecordingStatus(recordingId) {
        if (!recordingId) return false;

        const statusKey = `hazel_toolbar-status_${recordingId}`;
        const storedStatus = localStorage.getItem(statusKey);

        if (storedStatus) {
            try {
                const status = JSON.parse(storedStatus);
                recordingStartTime = status.startTime || Date.now();
                eventCount = status.eventCount || 0;
                recordingState = status.state || 'recording';

                console.debug(`Loaded recording status for ${recordingId}:`, status);
                return true;
            } catch (e) {
                console.error('Error parsing stored recording status:', e);
            }
        }

        return false;
    }

    // Save recording status to localStorage
    function saveRecordingStatus() {
        if (!currentRecordingId) return;

        const statusKey = `hazel_toolbar-status_${currentRecordingId}`;
        const status = {
            startTime: recordingStartTime,
            eventCount: eventCount,
            state: recordingState,
            lastUpdated: Date.now()
        };

        localStorage.setItem(statusKey, JSON.stringify(status));
        // console.log(`Saved recording status for ${currentRecordingId}:`, status);
    }

    // Start the timer for recording duration
    function startTimer() {
        // Clear any existing interval
        if (durationInterval) {
            clearInterval(durationInterval);
        }

        // If we don't have a start time yet, initialize it
        if (!recordingStartTime) {
            recordingStartTime = Date.now();
        }

        // Update duration every second
        durationInterval = setInterval(function() {
            if (recordingState === 'recording') {
                updateDuration();
                // Save status to localStorage on each update
                saveRecordingStatus();
            }
        }, 1000);

        updateDuration(); // Initial update
        saveRecordingStatus(); // Initial save
    }

    // Update the duration display
    function updateDuration() {
        const durationElement = document.getElementById('hazel_recording-duration');
        if (!durationElement) return;

        const now = Date.now();
        const durationInSeconds = Math.floor((now - recordingStartTime) / 1000);

        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;

        durationElement.textContent =
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');
    }

    // Update the event count display
    function updateEventCount() {
        const eventCountElement = document.getElementById('hazel_event-count');
        if (!eventCountElement) return;

        eventCountElement.textContent = eventCount;
        saveRecordingStatus(); // Save when event count changes
    }

    // Initialize the toolbar UI based on current state
    function initializeToolbarState() {
        if (recordingState === 'paused') {
            // Update UI for paused state
            toolbar.classList.add('hazel_paused');
            const statusElement = toolbar.querySelector('.hazel_recording-status');
            if (statusElement) statusElement.textContent = 'Paused';

            // Toggle buttons
            const pauseBtn = document.getElementById('hazel_btn-pause');
            const resumeBtn = document.getElementById('hazel_btn-resume');
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (resumeBtn) resumeBtn.style.display = 'flex';
        }

        // Update initial counts
        updateEventCount();
        updateDuration();
    }

    // Pause the recording
    function pauseRecording() {
        if (recordingState !== 'recording') return;

        recordingState = 'paused';

        // Update UI
        toolbar.classList.add('hazel_paused');
        const statusElement = toolbar.querySelector('.hazel_recording-status');
        if (statusElement) statusElement.textContent = 'Paused';

        // Toggle buttons
        document.getElementById('hazel_btn-pause').style.display = 'none';
        document.getElementById('hazel_btn-resume').style.display = 'flex';

        // Save status to localStorage
        saveRecordingStatus();

        // Notify the extension
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: {
                action: 'pauseRecording',
                timestamp: Date.now()
            }
        }));
    }

    // Resume the recording
    function resumeRecording() {
        if (recordingState !== 'paused') return;

        recordingState = 'recording';

        // Update UI
        toolbar.classList.remove('hazel_paused');
        const statusElement = toolbar.querySelector('.hazel_recording-status');
        if (statusElement) statusElement.textContent = 'Recording';

        // Toggle buttons
        document.getElementById('hazel_btn-pause').style.display = 'flex';
        document.getElementById('hazel_btn-resume').style.display = 'none';

        // Save status to localStorage
        saveRecordingStatus();

        // Notify the extension
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: {
                action: 'resumeRecording',
                timestamp: Date.now()
            }
        }));
    }

    // Stop the recording
    function stopRecording() {
        // Notify the extension
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: {
                action: 'stopRecording',
                timestamp: Date.now()
            }
        }));

        // Clean up
        if (durationInterval) {
            clearInterval(durationInterval);
        }

        // Remove the localStorage entry for this recording
        if (currentRecordingId) {
            const statusKey = `hazel_toolbar-status_${currentRecordingId}`;
            localStorage.removeItem(statusKey);
            console.log(`Removed recording status for ${currentRecordingId}`);
        }

        // Remove toolbar
        if (toolbar && toolbar.parentNode) {
            toolbar.parentNode.removeChild(toolbar);
            toolbar = null;
        }
    }

    // Increment event count
    function incrementEventCount() {
        eventCount++;
        updateEventCount();
        saveRecordingStatus(); // Save when event count changes
    }

    // Listen for messages from the content script
    window.addEventListener('BrowserRecorder_ToPage', (event) => {
        const message = event.detail;

        switch (message.action) {
            case 'showRecordingToolbar':
                // Get the recording ID if provided
                if (message.recordingId) {
                    currentRecordingId = message.recordingId;

                    // Try to load existing status
                    const loaded = loadRecordingStatus(currentRecordingId);

                    // Create the toolbar
                    createToolbar();

                    // Initialize UI based on loaded status
                    initializeToolbarState();

                    // Start the timer (will use loaded start time if available)
                    startTimer();

                    console.log(`Recording toolbar initialized for recording ${currentRecordingId}`,
                        loaded ? '(loaded from storage)' : '(new recording)');
                } else {
                    console.error('No recording ID provided when showing toolbar');
                    // Fall back to default behavior
                    createToolbar();
                    startTimer();
                }
                break;

            case 'hideRecordingToolbar':
                if (toolbar && toolbar.parentNode) {
                    toolbar.parentNode.removeChild(toolbar);
                    toolbar = null;
                }
                if (durationInterval) {
                    clearInterval(durationInterval);
                }
                break;

            case 'incrementEventCount':
                incrementEventCount();
                break;

            case 'updateEventCount':
                if (message.count !== undefined) {
                    eventCount = message.count;
                    updateEventCount();
                }
                break;
        }
    });

    console.log('Recording toolbar script initialized');
})();