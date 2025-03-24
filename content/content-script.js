// content-script.js - Entry point for content scripts
// This script injects the recorder and player scripts as needed

// Check if we're on a chrome:// URL - can't execute scripts here
if (window.location.protocol === 'chrome:') {
    console.log("Browser Recorder: Can't run on chrome:// pages due to security restrictions");
} else {
    // Initialize for normal webpages
    let recorder = null;
    let player = null;
    let recordedEvents = [];

    // Listen for messages from the player script (needs to be outside the other listener)
    window.addEventListener('BrowserRecorder_Player_FromPage', (event) => {
        const message = event.detail;
        console.log('Content script received message from player:', message);

        // Handle navigation request from player
        if (message.action === 'navigateBeforePlayback') {
            console.log('Player requested navigation to:', message.url);

            // Forward the request to the background script
            chrome.runtime.sendMessage({
                action: 'navigateBeforePlayback',
                url: message.url,
                recordingId: message.recordingId
            }, response => {
                console.log('Navigation request sent to background script, response:', response);
            });
        }

        // Handle other message types from player as needed
    });

    // Listen for messages from the recorder or toolbar
    window.addEventListener('BrowserRecorder_FromPage', (event) => {
        const message = event.detail;

        // Handle toolbar actions
        if (message.action === 'pauseRecording') {
            // Forward to background script
            chrome.runtime.sendMessage({
                action: 'pauseRecording'
            });

            // Forward to recorder script
            if (recorder) {
                recorder.postMessage({
                    action: 'pauseRecording'
                });
            }
        }
        else if (message.action === 'resumeRecording') {
            // Forward to background script
            chrome.runtime.sendMessage({
                action: 'resumeRecording'
            });

            // Forward to recorder script
            if (recorder) {
                recorder.postMessage({
                    action: 'resumeRecording'
                });
            }
        }
        else if (message.action === 'stopRecording') {
            // Forward to background script
            chrome.runtime.sendMessage({
                action: 'stopRecording'
            });

            // Forward to recorder script
            if (recorder) {
                recorder.postMessage({
                    action: 'stopRecording'
                });
            }
        }
        // The event handling is kept in the recorder.onMessage callback
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if(message.action.startsWith('hazel_player')) return;
        console.log('Content script received message:', message);

        try {
            switch (message.action) {
                case 'startRecordingInContent':
                    startRecording(message.recordingId).then(r => {});
                    sendResponse({ success: true });
                    break;

                case 'stopRecordingInContent':
                    stopRecording();
                    sendResponse({ success: true });
                    break;

                case 'pauseRecordingInContent':
                    pauseRecording();
                    sendResponse({ success: true });
                    break;

                case 'resumeRecordingInContent':
                    resumeRecording();
                    sendResponse({ success: true });
                    break;

                case 'continuePlaybackAfterNavigation':
                    // This is a new action handler for continuing playback after navigation
                    console.log('Continuing playback after navigation');
                    if (player) {
                        player.postMessage({
                            action: 'continueAfterNavigation',
                            recordingId: message.recordingId,
                            events: message.recordingData.events
                        });
                        sendResponse({ success: true });
                    } else {
                        // Player not initialized yet, we need to initialize it first
                        playRecording(message.recordingId, message.recordingData, true);
                        sendResponse({ success: true });
                    }
                    break;

                default:
                    console.log('Unknown action:', message.action);
                    sendResponse({ success: false, error: 'Unknown action', hell:'nah' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }

        return true; // Keep message channel open for async response
    });

    // Utility function to inject a script
    async function injectScript(scriptName) {
        if (document.getElementById(`browser-recorder-${scriptName}`)) {
            return; // Script already injected
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = `browser-recorder-${scriptName}`;
            script.src = chrome.runtime.getURL(`content/${scriptName}`);
            script.onload = resolve;
            script.onerror = reject;
            (document.head || document.documentElement).appendChild(script);
        });
    }

    // Start recording user actions
    async function startRecording(recordingId) {
        console.log('Starting recording in content script:', recordingId);

        // Reset recorded events
        recordedEvents = [];

        try {
            // First inject the toolbar script
            await injectScript('recording-toolbar.js');
        } catch (error) {
            console.error('Error injecting toolbar script:', error);
        }

        // Only inject the recorder script once
        if (!recorder) {
            try {
                // Create a script tag for the recorder
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('content/recorder.js');

                // Wait for script to load
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = (error) => {
                        console.error('Failed to load recorder script:', error);
                        reject(error);
                    };
                    (document.head || document.documentElement).appendChild(script);
                });

                console.log('Recorder script loaded successfully');

                // Create a communication channel with the injected script
                recorder = {
                    postMessage: (message) => {
                        console.log('Sending message to recorder:', message);
                        window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
                            detail: message
                        }));
                    },
                    onMessage: (callback) => {
                        window.addEventListener('BrowserRecorder_FromPage', (event) => {
                            const eventData = event.detail;

                            // Only process events with type property (recording events)
                            if (eventData.type) {
                                console.log('Received message from recorder:', eventData);

                                // Save to local array
                                recordedEvents.push(eventData);

                                // Forward to callback for further processing
                                callback(eventData);
                            }
                        });
                    }
                };

                // Listen for events from the recorder script
                recorder.onMessage((eventData) => {
                    // Forward recorded events to the background script
                    console.log('Forwarding recorded event to background:', eventData);
                    chrome.runtime.sendMessage({
                        action: 'saveEvent',
                        event: eventData
                    }, response => {
                        if (chrome.runtime.lastError) {
                            console.error('Error sending event to background:', chrome.runtime.lastError);
                        } else {
                            console.log('Event sent to background, response:', response);
                        }
                    });
                });
            } catch (error) {
                console.error('Error injecting recorder script:', error);
                return;
            }
        }

        // Give the recorder script a moment to initialize
        setTimeout(() => {
            // Show the toolbar
            window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
                detail: {
                    action: 'showRecordingToolbar'
                }
            }));

            // Tell the recorder to start recording
            console.log('Sending start recording command to page');
            recorder.postMessage({
                action: 'startRecording',
                recordingId: recordingId,
                timestamp: Date.now()
            });
        }, 300);
    }

    // Pause recording
    function pauseRecording() {
        if (!recorder) {
            console.log('Recorder not initialized, cannot pause');
            return;
        }

        console.log('Pausing recording');
        recorder.postMessage({
            action: 'pauseRecording',
            timestamp: Date.now()
        });
    }

    // Resume recording
    function resumeRecording() {
        if (!recorder) {
            console.log('Recorder not initialized, cannot resume');
            return;
        }

        console.log('Resuming recording');
        recorder.postMessage({
            action: 'resumeRecording',
            timestamp: Date.now()
        });
    }

    // Function to safely stop recording
    function stopRecording() {
        if (!recorder) {
            console.log('Recorder not initialized, nothing to stop');
            return;
        }

        console.log('Stopping recording');
        recorder.postMessage({
            action: 'stopRecording',
            timestamp: Date.now()
        });

        // Hide the toolbar
        window.dispatchEvent(new CustomEvent('BrowserRecorder_ToPage', {
            detail: {
                action: 'hideRecordingToolbar'
            }
        }));
    }

    // This is kept for compatibility with your existing code
    // Modified playRecording function for navigation continuation
    async function playRecording(recordingId, recordingData, isContinuation = false) {
        console.log('Starting playback in content script', recordingId, recordingData);

        // Rest of your playback logic would go here
        // This is just a stub since you're using player-new.js instead
    }

    // Notify that the content script is ready
    console.log('Browser Recorder: Content script initialized on', window.location.href);
}