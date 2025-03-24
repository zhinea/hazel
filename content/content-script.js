// content-script.js - Entry point for content scripts
// This script injects the recorder and player scripts as needed

// Check if we're on a chrome:// URL - can't execute scripts here
if (window.location.protocol === 'chrome:') {
    console.log("Browser Recorder: Can't run on chrome:// pages due to security restrictions");
} else {
    // Initialize for normal webpages
    let recorder = null;
    let player = null;  

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

    // Start recording user actions
    async function startRecording(recordingId) {
        console.log('Starting recording in content script:', recordingId);

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
                            console.log('Received message from recorder:', event.detail);
                            callback(event.detail);
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
            // Tell the recorder to start recording
            console.log('Sending start recording command to page');
            recorder.postMessage({
                action: 'startRecording',
                recordingId: recordingId,
                timestamp: Date.now()
            });
        }, 300);
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
    }

    // Notify that the content script is ready
    console.log('Browser Recorder: Content script initialized on', window.location.href);
}