// recording-toolbar.js - Injects and manages the recording toolbar UI

(function() {
    let toolbar = null;
    let recordingStartTime = null;
    let eventCount = 0;
    let recordingState = 'recording'; // 'recording', 'paused'
    let durationInterval = null;

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
            
            #hazel_browser-recorder-toolbar.minimized {
                width: auto;
                height: auto;
            }
            
            #hazel_browser-recorder-toolbar .recording-indicator {
                display: flex;
                align-items: center;
                margin-right: 12px;
            }
            
            #hazel_browser-recorder-toolbar .recording-dot {
                width: 12px;
                height: 12px;
                background-color: #ff4a4a;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 1.5s infinite;
            }
            
            #hazel_browser-recorder-toolbar.paused .recording-dot {
                animation: none;
                background-color: #ffaa00;
            }
            
            #hazel_browser-recorder-toolbar .stats {
                display: flex;
                align-items: center;
                font-size: 14px;
                margin-right: 15px;
            }
            
            #hazel_browser-recorder-toolbar .stat {
                margin-right: 15px;
            }
            
            #hazel_browser-recorder-toolbar .stat-label {
                opacity: 0.7;
                margin-right: 5px;
            }
            
            #hazel_browser-recorder-toolbar .controls {
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
            
            @keyframes pulse {
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
            <div class="recording-indicator">
                <div class="recording-dot"></div>
                <span class="recording-status">Recording</span>
            </div>
            <div class="stats">
                <div class="stat duration">
                    <span class="stat-label">Duration:</span>
                    <span class="stat-value" id="hazel_recording-duration">00:00</span>
                </div>
                <div class="stat events">
                    <span class="stat-label">Events:</span>
                    <span class="stat-value" id="hazel_event-count">0</span>
                </div>
            </div>
            <div class="controls">
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

        // Start the timer
        startTimer();

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
            toolbar.classList.toggle('minimized');
            if (toolbar.classList.contains('minimized')) {
                // Save elements state before minimizing
                toolbar.dataset.previousHtml = toolbar.innerHTML;
                toolbar.innerHTML = `
                    <div class="recording-indicator">
                        <div class="recording-dot"></div>
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
                    toolbar.classList.remove('minimized');
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

    // Start the timer for recording duration
    function startTimer() {
        recordingStartTime = Date.now();

        // Update duration every second
        durationInterval = setInterval(function() {
            if (recordingState === 'recording') {
                updateDuration();
            }
        }, 1000);

        updateDuration(); // Initial update
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
    }

    // Pause the recording
    function pauseRecording() {
        if (recordingState !== 'recording') return;

        recordingState = 'paused';

        // Update UI
        toolbar.classList.add('paused');
        const statusElement = toolbar.querySelector('.recording-status');
        if (statusElement) statusElement.textContent = 'Paused';

        // Toggle buttons
        document.getElementById('hazel_btn-pause').style.display = 'none';
        document.getElementById('hazel_btn-resume').style.display = 'flex';

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
        toolbar.classList.remove('paused');
        const statusElement = toolbar.querySelector('.recording-status');
        if (statusElement) statusElement.textContent = 'Recording';

        // Toggle buttons
        document.getElementById('hazel_btn-pause').style.display = 'flex';
        document.getElementById('hazel_btn-resume').style.display = 'none';

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
    }

    // Listen for messages from the content script
    window.addEventListener('BrowserRecorder_ToPage', (event) => {
        const message = event.detail;

        switch (message.action) {
            case 'showRecordingToolbar':
                createToolbar();
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