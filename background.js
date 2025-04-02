// background.js - Manages recording sessions and communication

// Global state
let isRecording = false;
let currentRecordingId = null; // This will now store the backend record ID
let currentTabId = null;
let isPaused = false;
const AUTH_COOKIE_NAME = 'oidc-auth';
const AUTH_DOMAIN_URL = 'https://hazel.flowless.my.id';
const AUTH_ME_ENDPOINT = `${AUTH_DOMAIN_URL}/me`;
const API_BASE_URL = 'https://hazel.flowless.my.id'; // Assuming API is on the same domain
const AUTH_STORAGE_KEY = 'hazelAuthToken';
let user; // Stores user info fetched from /me

const FRESH_PLAYER = {
    // ... (keep FRESH_PLAYER as before)
    isPlaying: false,
    recordingId: null,
    events: [],
    settings: {},
    currentEventIndex: 0,
    playbackSpeed: 1.0, // 1.0 is normal speed
    lastPlaybackTime: 0,
    eventTimeoutId: null,
    playbackStatus: {
        totalEvents: 0,
        currentEvent: 0,
        progress: 0,
        state: 'idle'
    }
}

const copyVar = (obj) => JSON.parse(JSON.stringify(obj))

let player = copyVar(FRESH_PLAYER)

// Helper function for API calls (remains the same)
async function callApi(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        credentials: 'include', // Crucial for sending the auth cookie
        headers: {}
    };

    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = { error: 'Failed to parse error response' };
            }
            console.error(`API Error ${response.status}: ${endpoint}`, errorBody);
            throw new Error(`API call failed with status ${response.status}`);
        }
        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network or API call error: ${method} ${endpoint}`, error);
        throw error; // Re-throw to be handled by caller
    }
}

async function sendPlaybackUpdate(tabId, statusData) {
    if (!tabId) {
        console.warn("Cannot send playback update, tabId is missing.");
        return;
    }
    // Ensure the status includes necessary fields, even if partial update
    const fullStatus = {
        ...player.playbackStatus, // Use current state as base
        ...statusData,            // Override with new data
        tabId: tabId,             // Always ensure tabId is set
    };
    console.log(`Sending Playback Update to tab ${tabId}:`, fullStatus.state, `${fullStatus.currentEvent}/${fullStatus.totalEvents}`);
    try {
        await chrome.tabs.sendMessage(tabId, {
            action: 'hazel_updatePlaybackStatus',
            status: fullStatus
        });
    } catch (error) {
        // It's common for this to fail if the tab is closed or navigating.
        if (error.message.includes("Could not establish connection") || error.message.includes("Receiving end does not exist")) {
            console.warn(`Failed to send playback update to tab ${tabId} (likely closed or navigated):`, error.message);
            // If the target tab is gone, we should probably stop playback if it's still running
            if (player.isPlaying && player.playbackStatus.tabId === tabId) {
                console.log("Target tab for playback seems to be gone. Stopping playback.");
                clearTimeout(player.eventTimeoutId); // Stop any pending event timeout
                player = copyVar(FRESH_PLAYER); // Reset player state
                // Optionally send a final 'idle' status update to popup/other listeners if needed
            }
        } else {
            console.error(`Error sending playback update to tab ${tabId}:`, error);
        }
    }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.action, 'from:', sender?.tab?.id || 'popup'); // Log only action for brevity

    let isAsync = false;

    try {
        if(message.action === 'fetch'){
            console.log('disini')
            isAsync = true;
            (async() => {
                try {
                    console.log(message)
                    const response = await callApi(message.url, message.method, message.payload)
                    console.log(response)
                    sendResponse(response)
                }catch(e){
                    sendResponse(e)
                }
            })();
        }else
        if (message.action === 'checkAuthStatus') {
            isAsync = true;
            (async() => {
                const authStatus = await checkAuthentication();
                sendResponse(authStatus);
            })();
        }
        else if (message.action === 'startRecording') {
            isAsync = true;
            (async() => {
                try {
                    if (!user) {
                        const authStatus = await checkAuthentication();
                        if (!authStatus.authenticated) {
                            throw new Error("Authentication required to start recording.");
                        }
                    }
                    console.log(message)
                    const backendRecord = await startRecording(message.tabId, message.recordingName, message.settings);
                    sendResponse({ success: true, recordingId: backendRecord.id });
                } catch (error) {
                    console.error("Failed to start recording:", error);
                    sendResponse({ success: false, error: error.message });
                }
            })();
        }
        else if (message.action === 'stopRecording') {
            isAsync = true; // stopRecording is now async
            (async() => {
                try {
                    await stopRecording(); // Wait for potential final flush
                    sendResponse({ success: true });
                } catch(error) {
                    console.error("Error during stopRecording:", error);
                    sendResponse({ success: false, error: "Failed to stop recording cleanly." });
                }
            })();
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
            playRecording(message.recordingId, message.tabId); // Still uses local storage by default
            sendResponse({ success: true });
        }
        else if (message.action === 'saveEvent') {
            // This is now synchronous from the caller's perspective
            saveRecordedEvent(message.event);
            sendResponse({ success: true }); // Respond immediately
            isAsync = false;
        }
        else if (message.action === 'getCurrentTabId') {
            isAsync = true;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    sendResponse({ tabId: tabs[0].id });
                } else {
                    sendResponse({ error: 'No active tab found' });
                }
            });
        }
        else if (message.action === 'clearAllRecordings') {
            isAsync = true;
            // NOTE: Still only clears local storage. Backend clearing is separate.
            chrome.storage.local.get(null, (data) => {
                const keys = Object.keys(data).filter(key =>
                    /^[a-f\d]{24}$/i.test(key) || key.startsWith('rec_') || key === 'browserRecorder_index'
                );
                if (keys.length > 0) {
                    chrome.storage.local.remove(keys, () => {
                        // Also clear any lingering buffer entries (though unlikely)
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: true, message: 'No local recordings to clear' });
                }
            });
        }
        else {
            console.warn('Unknown action received:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        if (!isAsync) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return isAsync;
});


// Start recording on a specific tab
async function startRecording(tabId, recordingName, settings = {}) {
    if (isRecording) {
        console.warn("Recording already in progress. Stopping previous one first.");
        await stopRecording(); // Ensure previous recording stops cleanly (including flush)
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay just in case
    }

    const name = recordingName || `Recording ${new Date().toLocaleString()}`;
    let tabUrl = '';

    try {
        const tab = await chrome.tabs.get(tabId);
        console.log(tab)
        tabUrl = tab.url;

        console.log('Attempting to create recording via API...');
        const payload = { name: name, tabUrl: tabUrl, events: [], settings };
        const createdRecord = await callApi('/records', 'POST', payload);
        console.log('Backend record created:', createdRecord);

        if (!createdRecord || !createdRecord.id) {
            throw new Error("Backend did not return a valid record with ID.");
        }

        currentRecordingId = createdRecord.id;
        currentTabId = tabId;
        isRecording = true;
        isPaused = false;

        console.log('Recording started with backend ID:', currentRecordingId, 'on tab', tabId);

        const localRecordingData = {
            id: currentRecordingId,
            name: createdRecord.name,
            timestamp: Date.now(),
            tabUrl: createdRecord.tabUrl,
            events: [], // Keep local events array for backup/playback,
            settings
        };
        await chrome.storage.local.set({ [currentRecordingId]: localRecordingData });
        console.log('Local record placeholder created/updated:', currentRecordingId);

        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'startRecordingInContent',
                recordingId: currentRecordingId,
                settings
            });
            console.log('Start recording message sent to content script.');
        } catch (error) {
            console.error('Error sending start recording message to content script:', error);
            // Consider stopping if content script fails
        }

        return createdRecord;

    } catch (error) {
        console.error('Failed to start recording:', error);
        await stopRecording();
        throw error;
    }
}

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
            sendPlaybackUpdate(tabId, {state: 'error', errorMessage: 'Cannot play on restricted URLs.'}).then(r => {});
            return;
        }

        // Stop existing playback if any
        if(player.isPlaying){
            console.log("Stopping previous playback before starting new one.");
            clearTimeout(player.eventTimeoutId);
            // Notify the old tab's UI that playback stopped there
            if (player.playbackStatus.tabId && player.playbackStatus.tabId !== tabId) {
                sendPlaybackUpdate(player.playbackStatus.tabId, {state: 'idle'}).then(r => {});
            }
            player = copyVar(FRESH_PLAYER); // Reset player fully
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
                sendPlaybackUpdate(tabId, { state: 'error', errorMessage: 'Recording data not found or invalid.' });
                return;
            }

            if (recordingData.events.length === 0) {
                console.error('Recording has no events:', recordingData);
                sendPlaybackUpdate(tabId, { state: 'idle', totalEvents: 0, currentEvent: 0 }); // Or maybe 'complete'? Idle seems better.
                return;
            }

            // Make sure content script is injected before sending message
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content/player-new.js']
            }, async () => {
                if (chrome.runtime.lastError) {
                    console.error('Error injecting script:', chrome.runtime.lastError);
                    sendPlaybackUpdate(tabId, { state: 'error', errorMessage: 'Failed to inject playback script.' });
                    return;
                }

                player.isPlaying = true; // Set early, but 'initializing' state
                player.recordingId = recordingId;
                player.events = copyVar(recordingData.events)
                    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
                player.currentEventIndex = 0;
                player.settings = recordingData.settings || {};
                player.playbackStatus = {
                    tabId: tabId,
                    totalEvents: player.events.length,
                    currentEvent: 0,
                    progress: 0,
                    state: 'initializing', // Start as initializing
                    errorMessage: null
                };

                await (async () => {
                    let data = {};
                    player.events
                        .filter(event => event.type === 'input' || event.type === 'change')
                        .forEach(ev => {
                            data[ev.selector] = ev
                        })

                    console.log(data)

                    let result = await Promise.all(Object.values(data).map(async(e) => {
                        return Object.assign({}, e, {
                            value: await compileText(e.value)
                        });
                    }))

                    console.log('result', result)

                    player.events = player.events.map((e) => {
                        let find = result.find(r => r.sequence == e.sequence)
                        console.log('found', find, e.sequence)
                        if(find){
                            return find
                        }
                        return e
                    })
                })()



                sendPlaybackUpdate(tabId, player.playbackStatus);

                const initializePlayback = (cb) => {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'hazel_player_initializePlayback',
                        recordingId,
                        settings: player.settings
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
                    if (!response.success) {
                        console.log('Failed to initialize playback')
                        const errorMsg = response?.error || 'Failed to initialize on page.';
                        player = copyVar(FRESH_PLAYER)
                        sendPlaybackUpdate(tabId, { state: 'error', errorMessage: errorMsg });
                        return;
                    }

                    player.playbackStatus.state = 'playing';

                    let errCount = {};
                    let errRetryEvent = 0;
                    const MAX_ERROR_RETRIES = 5; // Retries for a single event
                    const MAX_TOTAL_ERRORS = 3;  // Max different events allowed to fail before stopping

                    const sendPlayback = () => {
                        if (!player.isPlaying || player.currentEventIndex >= player.events.length) {
                            console.log('Playback complete or stopped')
                            player = copyVar(FRESH_PLAYER)
                            const finalState = player.playbackStatus.state === 'error' ? 'error' : 'complete';
                            sendPlaybackUpdate(tabId, {
                                state: finalState,
                                currentEvent: player.events.length, // Show completion
                                totalEvents: player.events.length,
                                progress: 100
                            });
                            return;
                        }

                        player.playbackStatus.state = 'playing';
                        player.playbackStatus.currentEvent = player.currentEventIndex + 1; // User-facing is 1-based
                        player.playbackStatus.progress = Math.round(((player.currentEventIndex + 1) / player.playbackStatus.totalEvents) * 100);
                        sendPlaybackUpdate(tabId, player.playbackStatus); // Update UI before executing

                        const event = player.events[player.currentEventIndex];
                        console.log(`Playing event ${player.currentEventIndex + 1}/${player.events.length}:`, event);

                        chrome.tabs.sendMessage(tabId, {
                            action: 'hazel_player_executeEvent',
                            data: {
                                event,
                                recordingId: player.recordingId,
                                playbackSpeed: player.playbackSpeed
                            },
                            settings: player.settings
                        }, response => {
                            catchError(response)

                            if (!response?.success) {
                                console.log('Gagal play event')

                                if (!errCount[player.currentEventIndex]) {
                                    errCount[player.currentEventIndex] = 0;
                                }

                                errCount[player.currentEventIndex]++;

                                if (errRetryEvent > MAX_TOTAL_ERRORS) {
                                    console.log('Gagal play event 3 kali. Stop recording. event failed:', errRetryEvent)
                                    player.playbackStatus.isPlaying = false;
                                    player.playbackStatus.isPaused = false;
                                    player.playbackStatus.currentEventIndex = player.events.length;
                                    sendPlaybackUpdate(tabId, player.playbackStatus); // Send final error state
                                    sendPlayback(); // Call again to trigger the termination logic
                                    return;
                                }

                                if (errCount[player.currentEventIndex] > MAX_ERROR_RETRIES) {
                                    console.log('Gagal play event 5 kali. Continue to next event. event failed:', errRetryEvent)

                                    errRetryEvent++;
                                    player.currentEventIndex++;
                                    player.playbackStatus.currentEvent = player.currentEventIndex;
                                    player.playbackStatus.progress = Math.round(((player.currentEventIndex + 1) / player.playbackStatus.totalEvents) * 100);
                                    sendPlaybackUpdate(tabId, player.playbackStatus);
                                    sendPlayback()

                                    // player.playbackStatus.isPlaying = false;
                                    // player.playbackStatus.isPaused = false;
                                    // player.playbackStatus.currentEventIndex = player.events.length;
                                    return;
                                }


                                const retryConnectionPlayback = (successCb) => {
                                    initializePlayback(r2 => {
                                        if (typeof r2?.success == "undefined" || !r2.success) {
                                            console.log('Gagal playback: retry connection playback')
                                            setTimeout(() => {
                                                retryConnectionPlayback()
                                            }, 500 * errRetryEvent)
                                        } else {
                                            errRetryEvent = 0;
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
                                if (delay <= 0) {
                                    delay = 100;
                                }
                            }
                            setTimeout(() => {
                                player.currentEventIndex++;
                                player.playbackStatus.currentEvent = player.currentEventIndex;
                                player.playbackStatus.progress = Math.round(((player.currentEventIndex + 1) / player.playbackStatus.totalEvents) * 100);
                                sendPlaybackUpdate(tabId, player.playbackStatus);
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


function pausePlayback() {
    if (!player.isPlaying || player.playbackStatus.state !== 'playing') return;

    clearTimeout(player.eventTimeoutId); // Stop the timer for the next event
    player.playbackStatus.state = 'paused';
    console.log('Playback paused');
    sendPlaybackUpdate(player.playbackStatus.tabId, { state: 'paused' });
}

function resumePlayback() {
    if (!player.isPlaying || player.playbackStatus.state !== 'paused') return;

    player.playbackStatus.state = 'playing';
    console.log('Playback resumed');
    sendPlaybackUpdate(player.playbackStatus.tabId, { state: 'playing' });
    // Need to re-trigger the execution of the *current* event or the next one?
    // Let's re-trigger the flow for the current index.
    // The sendPlayback function handles the logic.
    // const sendPlayback = /* find or re-declare the sendPlayback function used in playRecording, might need refactoring */
    // if (typeof sendPlayback === 'function') {
    //     sendPlayback(); // This assumes sendPlayback is accessible here or refactored
    // } else {
    //     console.error("Cannot resume: sendPlayback function not accessible. Refactoring needed.");
    //     // As a fallback, maybe just schedule the *next* event? Less reliable.
    //     // scheduleNextEvent(); // You'd need to extract the scheduling part.
    // }
}

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


// Stop recording - Modified to clear alarm and flush buffer
async function stopRecording() { // Now async
    if (!isRecording) {
        console.log("Stop recording called but not currently recording.");
        return;
    }

    const stoppedRecordingId = currentRecordingId;
    const stoppedTabId = currentTabId;

    console.log('Stopping recording with backend ID:', stoppedRecordingId);

    if (player.isPlaying && stoppedTabId === player.playbackStatus.tabId) {
        console.log("Stopping playback because recording stopped.");
        clearTimeout(player.eventTimeoutId);
        const finalState = player.playbackStatus.state === 'error' ? 'error' : 'complete'; // Or maybe 'idle'?
        player = copyVar(FRESH_PLAYER);
        // Send final status update to the UI on that tab
        sendPlaybackUpdate(stoppedTabId, { state: 'idle' }); // Indicate playback stopped
    } else {
        // Just reset the core recording state variables
        isRecording = false;
        isPaused = false;
        currentRecordingId = null;
        currentTabId = null;
    }
    // 3. Notify content script (best effort)
    if (stoppedTabId) {
        chrome.tabs.sendMessage(stoppedTabId, {
            action: 'stopRecordingInContent',
            recordingId: stoppedRecordingId
        }).catch(error => console.warn('Could not send stop message to content script (maybe tab closed?)', error));
    }

    console.log('Stopped recording:', stoppedRecordingId);
    // No specific API call for stop needed based on provided routes

    chrome.storage.local.get(stoppedRecordingId, (result) => {
        if (!result[stoppedRecordingId]) {
            console.error('Recording not found:', stoppedRecordingId);
            return;
        }

        const recordingData = result[stoppedRecordingId];
        console.log('Local recording data for save to cloud', recordingData);
        let retrySendToCloudCount = 0;
        const sendToCloud = async () => {
            if (retrySendToCloudCount > 5) {
                console.error('Failed to save record to cloud after 5 retries');
                return;
            }

            callApi(`/records/${stoppedRecordingId}/events`, 'POST', {
                events: recordingData.events
            }).then(r => {
                console.log('Record saved to cloud', r);
            }).catch(e => {
                console.error('Error saving record to cloud. retrying...', e);
                retrySendToCloudCount++;
                setTimeout(sendToCloud, 1000 * (retrySendToCloudCount * 60));
            })
        }

        sendToCloud().then(() => {})

    });
}


// Listen for tab close events (remains the same)
chrome.tabs.onRemoved.addListener(async (tabId) => { // Make async to await stopRecording
    if (isRecording && tabId === currentTabId) {
        console.log(`Tab ${tabId} closed during recording. Stopping.`);
        await stopRecording(); // Ensure buffer is flushed
    }
});

// Authentication check (remains the same)
async function checkAuthentication() {
    // ... (checkAuthentication function remains unchanged)
    console.log('Checking authentication...');
    try {
        const response = await fetch(AUTH_ME_ENDPOINT, { /* ... */ }); // As before
        if (response.ok) {
            const userData = await response.json();
            console.log('/me check successful.');
            user = userData;
            const cookie = await chrome.cookies.get({ url: AUTH_DOMAIN_URL, name: AUTH_COOKIE_NAME });
            if (cookie) await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: cookie.value });
            return { authenticated: true, user: userData };
        } else {
            console.log('/me check failed:', response.status);
            user = null;
            await chrome.storage.local.remove(AUTH_STORAGE_KEY);
            const cookie = await chrome.cookies.get({ url: AUTH_DOMAIN_URL, name: AUTH_COOKIE_NAME });
            return { authenticated: false, reason: `API check failed (${response.status})`, cookieFound: !!cookie };
        }
    } catch (error) {
        console.error('Error during auth check:', error);
        user = null;
        await chrome.storage.local.remove(AUTH_STORAGE_KEY);
        return { authenticated: false, reason: `Error: ${error.message}` };
    }
}

function catchError(response, context = 'Unknown'){
    if (chrome.runtime.lastError) {
        // Check if the error is due to the tab/port being closed
        if (chrome.runtime.lastError.message.includes("Could not establish connection") ||
            chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
            console.warn(`Connection Error in context "${context}": ${chrome.runtime.lastError.message}. Tab likely closed or navigated away.`);
            // If this happens during active playback, stop it
            if (player.isPlaying && player.playbackStatus.tabId) {
                console.log("Stopping playback due to lost connection to tab.");
                clearTimeout(player.eventTimeoutId);
                player = copyVar(FRESH_PLAYER);
                // No need to send update, the recipient is gone.
            }
        } else {
            console.error(`Error in context "${context}":`, chrome.runtime.lastError.message, response);
        }
        return false; // Indicate error
    } else if (response && !response.success) {
        console.warn(`Operation failed in context "${context}":`, response.error || 'No error message provided.');
        return false; // Indicate failure reported by the content script
    } else {
        console.log(`Success response received in context "${context}":`, response);
        return true; // Indicate success
    }
}

async function compileText(templateString) {
    if (typeof templateString !== 'string') {
        console.error("CompileText Error: templateString must be a string.");
        return "";
    }
    if (typeof player?.settings !== 'object' || player?.settings === null) {
        console.error("CompileText Error: data must be a non-null object.");
        return templateString;
    }

    const regex = /\{\{\s*(.*?)\s*\}\}/g;

    return replaceAsync(templateString, regex, async (match, variableName) => {
        let settingResult = player?.settings?.customVariables?.find(variable => variable.name === variableName)
        if(!!settingResult){
            if(settingResult.type === 'plain'){
                console.log('plain text')
                return settingResult.value;
            }

            if(settingResult.type === 'ai'){
                const aiResponse = await callApi( '/v1/ai/faker', 'POST', {
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
                if(!settingResult?.apiUrl.startsWith('http')){
                    return settingResult?.value || '';
                }
                const res = await fetch(settingResult?.apiUrl)
                if(res.status === 200){
                    const data = await res.json()
                    return getValueFromJsonPath(data, settingResult?.jsonPath) || settingResult?.value || '';
                }else{
                    return settingResult?.value || '';
                }
            }
        }

        console.warn(`CompileText Warning: Variable "${variableName}" not found in data object.`);
        return match;
    });
}

function getValueFromJsonPath(jsonData, path) {
    if (!jsonData || !path) {
        return undefined;
    }
    // Basic safety: split by dots and brackets, remove empty parts
    const keys = path.match(/([^[.\]]+)|(\[\d+\])/g) || [];

    let current = jsonData;
    for (const key of keys) {
        if (current === null || typeof current === 'undefined') {
            return undefined; // Path leads to nowhere
        }
        let currentKey = key;
        // Check if it's an array accessor like [0]
        if (currentKey.startsWith('[') && currentKey.endsWith(']')) {
            const index = parseInt(currentKey.slice(1, -1), 10);
            if (isNaN(index) || !Array.isArray(current) || index < 0 || index >= current.length) {
                return undefined; // Invalid index or not an array
            }
            current = current[index];
        } else {
            // Regular object property access
            if (!Object.prototype.hasOwnProperty.call(current, currentKey)) {
                return undefined; // Property doesn't exist
            }
            current = current[currentKey];
        }
    }
    // Check if final value is null or undefined, return as is
    return current;
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

// Cookie change listener (remains the same)
chrome.cookies.onChanged.addListener(async (changeInfo) => {
    // ... (cookies.onChanged listener remains unchanged)
    if (changeInfo.cookie.name === AUTH_COOKIE_NAME && changeInfo.cookie.domain && changeInfo.cookie.domain.includes(new URL(AUTH_DOMAIN_URL).hostname)) {
        if (changeInfo.removed) {
            console.log('Auth cookie removed, checking auth state.');
            await chrome.storage.local.remove(AUTH_STORAGE_KEY);
            await checkAuthentication();
        } else {
            console.log('Auth cookie updated, checking auth state.');
            await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: changeInfo.cookie.value });
            await checkAuthentication();
        }
    }
});

// Initial auth check (remains the same)
checkAuthentication().then(status => {
    console.log("Initial auth check:", status.authenticated ? "Authenticated" : "Not Authenticated");
});
