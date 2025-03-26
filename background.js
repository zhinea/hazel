// background.js - Manages recording sessions and communication

// Global state
let isRecording = false;
let currentRecordingId = null;
let currentTabId = null;
let isPaused = false;
const AUTH_COOKIE_NAME = 'oidc-auth';
const AUTH_DOMAIN_URL = 'https://stag-hazel.flowless.my.id';
const AUTH_ME_ENDPOINT = `${AUTH_DOMAIN_URL}/me`;
const AUTH_STORAGE_KEY = 'hazelAuthToken';

const FRESH_PLAYER = {
    isPlaying: false,
    recordingId: null,
    events: [],
    currentEventIndex: 0,
    playbackSpeed: 1.0, // 1.0 is normal speed
    lastPlaybackTime: 0,
    eventTimeoutId: null,

    // Current playback status (for UI)
    playbackStatus: {
        totalEvents: 0,
        currentEvent: 0,
        progress: 0,
        state: 'idle' // idle, playing, paused, complete, error
    }
}

const copyVar = (obj) => JSON.parse(JSON.stringify(obj))

let player = copyVar(FRESH_PLAYER)

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message, 'from:', sender?.tab?.id || 'popup');

    try {
        if (message.action === 'checkAuthStatus') {
            (async() => {
                const authStatus = await checkAuthentication();
                sendResponse(authStatus);
            })();
        }else
        if (message.action === 'startRecording') {
            startRecording(message.tabId, message.recordingName);
            sendResponse({ success: true, recordingId: currentRecordingId });
        }
        else if (message.action === 'stopRecording') {
            stopRecording();
            sendResponse({ success: true });
        }
        else if (message.action === 'pauseRecording') {
            pauseRecording();
            sendResponse({ success: true });
        }
        else if (message.action === 'resumeRecording') {
            resumeRecording();
            sendResponse({ success: true });
        }
        else if (message.action === 'getRecordingStatus') {
            sendResponse({
                isRecording,
                isPaused,
                currentRecordingId,
                currentTabId
            });
        }
        else if (message.action === 'playRecording') {
            playRecording(message.recordingId, message.tabId);
            sendResponse({ success: true });
        }
        else if (message.action === 'saveEvent') {
            saveRecordedEvent(message.event);
            sendResponse({ success: true });
        }
        else if (message.action === 'getCurrentTabId') {
            // Get the active tab in the current window
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    sendResponse({ tabId: tabs[0].id });
                } else {
                    sendResponse({ error: 'No active tab found' });
                }
            });
            return true; // Indicate we'll respond asynchronously
        }
        else if (message.action === 'clearAllRecordings') {
            // Handle clear all recordings request from settings
            chrome.storage.local.get(null, (data) => {
                const keys = Object.keys(data).filter(key =>
                    key.startsWith('rec_') || key === 'browserRecorder_index'
                );

                if (keys.length > 0) {
                    chrome.storage.local.remove(keys, () => {
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: true, message: 'No recordings to clear' });
                }
            });
            return true; // Will respond asynchronously
        }
        else {
            console.warn('Unknown action received:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }

    return true; // Keep the message channel open for async responses
});

// Start recording on a specific tab
function startRecording(tabId, recordingName) {
    if (isRecording) {
        stopRecording();
    }

    currentRecordingId = generateRecordingId();
    currentTabId = tabId;
    isRecording = true;

    console.log('Starting a new recording:', currentRecordingId, 'on tab', tabId);

    // Initialize storage for this recording
    const recordingData = {
        id: currentRecordingId,
        name: recordingName || `Recording ${new Date().toLocaleString()}`,
        timestamp: Date.now(),
        events: [], // Make sure this is initialized as an empty array
        tabUrl: ''
    };

    // Get the URL of the tab we're recording
    chrome.tabs.get(tabId, (tab) => {
        recordingData.tabUrl = tab.url;

        // Save initial recording data
        chrome.storage.local.set({ [currentRecordingId]: recordingData }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error creating recording:', chrome.runtime.lastError);
            } else {
                console.log('Started recording:', currentRecordingId, 'with initial data:', recordingData);
            }

            // Notify content script to start recording
            chrome.tabs.sendMessage(tabId, {
                action: 'startRecordingInContent',
                recordingId: currentRecordingId
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending start recording message:', chrome.runtime.lastError);
                } else {
                    console.log('Start recording message sent to content script, response:', response);
                }
            });
        });
    });
}

// Stop the current recording
function stopRecording() {
    if (!isRecording) return;

    if (currentTabId) {
        // Notify content script to stop recording
        chrome.tabs.sendMessage(currentTabId, {
            action: 'stopRecordingInContent',
            recordingId: currentRecordingId
        });
    }

    isRecording = false;
    currentTabId = null;
    currentRecordingId = null;

    console.log('Stopped recording');
}

// Play a recording on a specific tab
function playRecording(recordingId, tabId) {
    console.log('Background script: Starting playback of recording', recordingId, 'on tab', tabId);

    // First, check if the tab exists and is valid
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            console.error('Error accessing tab:', chrome.runtime.lastError);
            return;
        }

        // Check if this is a restricted URL (chrome://, chrome-extension://, etc.)
        if (tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('devtools://')) {
            console.error('Cannot play recordings on restricted URLs:', tab.url);
            // Could show a notification here
            return;
        }

        if(player.isPlaying){
            // let stopping
        }

        // Fetch the recording data
        chrome.storage.local.get(recordingId, (result) => {
            if (!result[recordingId]) {
                console.error('Recording not found:', recordingId);
                return;
            }

            const recordingData = result[recordingId];
            console.log('Recording data loaded:', recordingData);

            // Validate recording data
            if (!recordingData.events || !Array.isArray(recordingData.events)) {
                console.error('Invalid recording format. Missing events array:', recordingData);
                return;
            }

            if (recordingData.events.length === 0) {
                console.error('Recording has no events:', recordingData);
                return;
            }

            // Make sure content script is injected before sending message
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content/player-new.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error injecting script:', chrome.runtime.lastError);
                    return;
                }

                const initializePlayback = (cb) => {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'hazel_player_initializePlayback',
                        recordingId
                    },  (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error sending message to tab:', chrome.runtime.lastError);
                        } else {
                            console.log('Playback message sent to tab, response:', response);
                        }
                        cb(response);
                    });
                }

                initializePlayback((response) => {
                    if(!response.success){
                        console.log('Failed to initialize playback')
                        player = copyVar(FRESH_PLAYER)
                        return;
                    }

                    player.isPlaying = true;
                    player.recordingId = recordingId;
                    // deep copy and sort events
                    player.events = copyVar(recordingData.events)
                        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

                    player.playbackStatus.totalEvents = recordingData.events.length;
                    let errCount = {};
                    let errRetryEvent = 0;

                    const sendPlayback = () => {
                        if(!player.isPlaying || player.currentEventIndex >= player.events.length){
                            console.log('Playback complete or stopped')
                            player = copyVar(FRESH_PLAYER)
                            return;
                        }

                        player.playbackStatus.state = 'playing';

                        const event = player.events[player.currentEventIndex];
                        console.log(`Playing event ${player.currentEventIndex + 1}/${player.events.length}:`, event);

                        chrome.tabs.sendMessage(tabId, {
                            action: 'hazel_player_executeEvent',
                            data: {
                                event,
                                recordingId: player.recordingId,
                                playbackSpeed: player.playbackSpeed
                            }
                        }, response => {
                            catchError(response)

                            if(!response.success){
                                console.log('Gagal play event')

                                if(!errCount[player.currentEventIndex]){
                                    errCount[player.currentEventIndex] = 0;
                                }

                                errCount[player.currentEventIndex]++;

                                if(errRetryEvent > 3){
                                    console.log('Gagal play event 3 kali. Stop recording. event failed:', errRetryEvent)
                                    player.playbackStatus.isPlaying = false;
                                    player.playbackStatus.isPaused = false;
                                    player.playbackStatus.currentEventIndex = player.events.length;
                                    return;
                                }

                                if(errCount[player.currentEventIndex] > 5){
                                    console.log('Gagal play event 5 kali. Continue to next event. event failed:', errRetryEvent)

                                    errRetryEvent++;
                                    player.currentEventIndex++;
                                    player.playbackStatus.currentEvent = player.currentEventIndex;
                                    sendPlayback()

                                    // player.playbackStatus.isPlaying = false;
                                    // player.playbackStatus.isPaused = false;
                                    // player.playbackStatus.currentEventIndex = player.events.length;
                                    return;
                                }


                                const retryConnectionPlayback = (successCb) => {
                                    initializePlayback(r2 => {
                                        if(typeof r2?.success == "undefined" || !r2.success){
                                            console.log('Gagal playback: retry connection playback')
                                            setTimeout(() => {
                                                retryConnectionPlayback()
                                            }, 100)
                                        }else{
                                            successCb()
                                        }
                                    })
                                }

                                retryConnectionPlayback(() => {
                                    sendPlayback()
                                })

                                return;
                            }

                            // Calculate delay for next event
                            let delay = 100; // Increased minimum delay for more stability

                            if (player.currentEventIndex < player.events.length - 1) {
                                const nextEvent = player.events[player.currentEventIndex + 1];
                                // Use timestamp if available, otherwise use default delay
                                if (event.timestamp && nextEvent.timestamp) {
                                    delay = Math.max(100, (nextEvent.timestamp - event.timestamp) / player.playbackSpeed);
                                }
                                if(delay <= 0){
                                    delay = 100;
                                }
                            }
                            setTimeout(() => {
                                player.currentEventIndex++;
                                player.playbackStatus.currentEvent = player.currentEventIndex;
                                sendPlayback()
                            }, delay);
                        });

                    }

                    sendPlayback()
                })

            });
        });
    });
}
// Add these new functions for pausing and resuming
function pauseRecording() {
    if (!isRecording || isPaused) return;

    isPaused = true;
    console.log('Recording paused');

    if (currentTabId) {
        // Notify content script about pause
        chrome.tabs.sendMessage(currentTabId, {
            action: 'pauseRecordingInContent',
            recordingId: currentRecordingId
        });
    }
}

function resumeRecording() {
    if (!isRecording || !isPaused) return;

    isPaused = false;
    console.log('Recording resumed');

    if (currentTabId) {
        // Notify content script about resume
        chrome.tabs.sendMessage(currentTabId, {
            action: 'resumeRecordingInContent',
            recordingId: currentRecordingId
        });
    }
}

// Modify the saveRecordedEvent function to respect the pause state
function saveRecordedEvent(event) {
    if (!isRecording || isPaused || !currentRecordingId) {
        console.error('Cannot save event: No active recording or recording is paused');
        return;
    }

    console.log('Saving event to recording:', event);

    chrome.storage.local.get(currentRecordingId, (result) => {
        if (!result[currentRecordingId]) {
            console.error('Recording not found:', currentRecordingId);
            return;
        }

        const recordingData = result[currentRecordingId];

        // Initialize events array if it doesn't exist
        if (!recordingData.events) {
            recordingData.events = [];
        }

        // Add the event
        recordingData.events.push(event);

        console.log(`Added event to recording. Total events: ${recordingData.events.length}`);

        // Save back to storage
        chrome.storage.local.set({ [currentRecordingId]: recordingData }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving event:', chrome.runtime.lastError);
            } else {
                console.log('Event saved successfully to recording', currentRecordingId, event.type);
            }
        });
    });
}

// Generate a unique ID for a recording
function generateRecordingId() {
    return 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function catchError(response){
    if (chrome.runtime.lastError) {
        console.error('Error sending message to tab:', chrome.runtime.lastError);
    } else {
        console.log('Playback message sent to tab, response:', response);
    }
}

// Listen for tab close events to stop recording if needed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (isRecording && tabId === currentTabId) {
        stopRecording();
    }
});

// Function to check authentication status
async function checkAuthentication() {
    console.log('Checking authentication...');
    try {
        // 1. Try to get the cookie directly
        const cookie = await chrome.cookies.get({ url: AUTH_DOMAIN_URL, name: AUTH_COOKIE_NAME });

        if (cookie && cookie.value) {
            console.log('Auth cookie found.');
            // Store the latest cookie value in local storage just in case
            await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: cookie.value });

            // 2. Verify cookie/session with the /me endpoint
            // 'credentials: include' is crucial for sending cookies
            const response = await fetch(AUTH_ME_ENDPOINT, {
                method: 'GET',
                credentials: 'include', // Sends cookies associated with AUTH_DOMAIN_URL
                headers: {
                    'Accept': 'application/json'
                    // No need to set Authorization header if relying on cookie
                }
            });

            if (response.ok) {
                console.log('/me endpoint check successful.');
                // Optionally: const userData = await response.json(); console.log('User data:', userData);
                return { authenticated: true };
            } else {
                console.log('/me endpoint check failed:', response.status, response.statusText);
                // If check fails, token might be invalid/expired, remove from storage
                await chrome.storage.local.remove(AUTH_STORAGE_KEY);
                return { authenticated: false, reason: `API check failed (${response.status})` };
            }
        } else {
            console.log('Auth cookie not found.');
            // Ensure storage is also clear if cookie is missing
            await chrome.storage.local.remove(AUTH_STORAGE_KEY);
            return { authenticated: false, reason: 'Cookie not found' };
        }
    } catch (error) {
        console.error('Error during authentication check:', error);
        // Also clear storage on network or other errors
        await chrome.storage.local.remove(AUTH_STORAGE_KEY);
        return { authenticated: false, reason: `Error: ${error.message}` };
    }
}

// Listen for cookie changes to keep storage updated
chrome.cookies.onChanged.addListener(async (changeInfo) => {
    // Check if the changed cookie is our auth cookie for the correct domain
    if (changeInfo.cookie.name === AUTH_COOKIE_NAME && changeInfo.cookie.domain && changeInfo.cookie.domain.includes('flowless.my.id')) {
        if (changeInfo.removed) {
            console.log('Auth cookie removed, clearing from storage.');
            await chrome.storage.local.remove(AUTH_STORAGE_KEY);
        } else {
            console.log('Auth cookie added/updated, saving to storage.');
            await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: changeInfo.cookie.value });
        }
    }
});
