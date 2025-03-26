// popup.js - Handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', function() {
    (async () => {
        try {
            console.log('Popup opened, checking auth status...');
            chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, authStatus => {
                console.log('Auth status received:', authStatus, 'here');

                if (!authStatus || !authStatus.authenticated) {
                    console.log('User not authenticated, redirecting to login...');
                    // Redirect to login page
                    chrome.tabs.create({ url: 'https://stag-hazel.flowless.my.id' });
                    // Optionally close the popup immediately
                    window.close();
                    return; // Stop further execution of popup script
                }

                console.log('User authenticated, proceeding with popup initialization.');
                // If authenticated, continue initializing the rest of the popup
                initializePopup();
            });

        } catch (error) {
            console.error('Error during popup auth check:', error);
            // Handle error, maybe show a message in the popup?
            // For now, let's prevent the popup from fully loading
            document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error checking authentication. Please try again later.</div>';
        }
    })();
    // --- End Authentication Check ---

    function initializePopup() {


        // Elements
        const startRecordingBtn = document.getElementById('start-recording');
        const stopRecordingBtn = document.getElementById('stop-recording');
        const recordingNameInput = document.getElementById('recording-name');
        const recordingStatus = document.getElementById('recording-status');
        const statusText = document.getElementById('status-text');
        const recordingsContainer = document.getElementById('recordings-container');
        const noRecordingsMsg = document.getElementById('no-recordings');

        // Check if recording is in progress when popup opens
        checkRecordingStatus();

        // Load saved recordings
        loadSavedRecordings();

        // Start recording button
        startRecordingBtn.addEventListener('click', async () => {
            // Get current tab
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            const currentTab = tabs[0];

            if (!currentTab) {
                showError('Cannot access current tab');
                return;
            }

            // Default recording name if empty
            const recordingName = recordingNameInput.value.trim() ||
                `Recording ${new Date().toLocaleTimeString()}`;

            // Show settings modal on the page first
            chrome.tabs.sendMessage(currentTab.id, {
                action: 'showRecordingSettingsModal',
                recordingName: recordingName
            }, (response) => {
                // If there was an error, it might be because the content script isn't ready
                if (chrome.runtime.lastError) {
                    console.error('Error showing settings modal:', chrome.runtime.lastError);

                    // Inject the modal script and try again
                    chrome.scripting.executeScript({
                        target: {tabId: currentTab.id},
                        files: ['content/recording-settings-modal.js']
                    }, () => {
                        setTimeout(() => {
                            chrome.tabs.sendMessage(currentTab.id, {
                                action: 'showRecordingSettingsModal',
                                recordingName: recordingName
                            });
                        }, 100);
                    });
                }
            });

            // The actual recording will be started by the content script
            // when the user confirms the settings modal

            // Close the popup to avoid interference
            setTimeout(() => {
                window.close();
            }, 200);
        });

        // Stop recording button
        stopRecordingBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                action: 'stopRecording'
            }, (response) => {
                if (response && response.success) {
                    updateRecordingUI(false);
                    // Reload recordings list
                    loadSavedRecordings();
                } else {
                    showError('Failed to stop recording');
                }
            });
        });

        // Check if recording is already in progress
        function checkRecordingStatus() {
            chrome.runtime.sendMessage({
                action: 'getRecordingStatus'
            }, (response) => {
                if (response && response.isRecording) {
                    updateRecordingUI(true);
                } else {
                    updateRecordingUI(false);
                }
            });
        }

        // Update UI based on recording state
        function updateRecordingUI(isRecording) {
            if (isRecording) {
                startRecordingBtn.disabled = true;
                stopRecordingBtn.disabled = false;
                recordingNameInput.disabled = true;
                recordingStatus.classList.add('recording');
                statusText.textContent = 'Recording in progress...';
            } else {
                startRecordingBtn.disabled = false;
                stopRecordingBtn.disabled = true;
                recordingNameInput.disabled = false;
                recordingStatus.classList.remove('recording');
                statusText.textContent = 'Not recording';
            }
        }

        // Load all saved recordings
        function loadSavedRecordings() {
            chrome.storage.local.get(null, (data) => {
                // Clear current list
                recordingsContainer.innerHTML = '';

                // Filter for recording objects (those with id, name, events fields)
                const recordings = Object.values(data).filter(item =>
                    item && item.id && item.name && Array.isArray(item.events)
                );

                // Sort by timestamp (newest first)
                recordings.sort((a, b) => b.timestamp - a.timestamp);

                if (recordings.length === 0) {
                    noRecordingsMsg.style.display = 'block';
                    return;
                }

                noRecordingsMsg.style.display = 'none';

                // Create list items for each recording
                recordings.forEach(recording => {
                    const item = createRecordingItem(recording);
                    recordingsContainer.appendChild(item);
                });
            });
        }

        // Create a recording list item
        function createRecordingItem(recording) {
            const li = document.createElement('li');
            li.className = 'recording-item';
            li.dataset.id = recording.id;

            const recordingInfo = document.createElement('div');
            recordingInfo.className = 'recording-info';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'recording-name';
            nameSpan.textContent = recording.name;

            const dateSpan = document.createElement('span');
            dateSpan.className = 'recording-date';
            dateSpan.textContent = new Date(recording.timestamp).toLocaleString();

            recordingInfo.appendChild(nameSpan);
            recordingInfo.appendChild(dateSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'recording-actions';

            const playBtn = document.createElement('button');
            playBtn.className = 'action-btn play';
            playBtn.textContent = 'Play';
            playBtn.addEventListener('click', () => playRecording(recording.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteRecording(recording.id));

            actionsDiv.appendChild(playBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(recordingInfo);
            li.appendChild(actionsDiv);

            return li;
        }

        // Play a recording
        function playRecording(recordingId) {
            // Show loading state
            const recordingItem = document.querySelector(`li[data-id="${recordingId}"]`);
            if (recordingItem) {
                const playBtn = recordingItem.querySelector('.play');
                if (playBtn) {
                    playBtn.textContent = 'Loading...';
                    playBtn.disabled = true;
                }
            }

            // First, verify the recording exists and has data
            chrome.storage.local.get(recordingId, (result) => {
                if (!result[recordingId]) {
                    showError(`Recording not found: ${recordingId}`);
                    return;
                }

                const recording = result[recordingId];

                // Validate recording data
                if (!recording.events || !Array.isArray(recording.events) || recording.events.length === 0) {
                    showError(`Recording ${recordingId} has no events`);
                    return;
                }

                console.log('Playing recording:', recording);

                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    const currentTab = tabs[0];

                    chrome.runtime.sendMessage({
                        action: 'playRecording',
                        recordingId: recordingId,
                        tabId: currentTab.id
                    });

                    // Close popup after initiating playback
                    setTimeout(() => {
                        window.close();
                    }, 500);
                });
            });
        }

        // Delete a recording
        function deleteRecording(recordingId) {
            if (confirm('Are you sure you want to delete this recording?')) {
                chrome.storage.local.remove(recordingId, () => {
                    loadSavedRecordings();
                });
            }
        }

        // Show error message as alert for now (could be improved)
        function showError(message) {
            console.error(message);
            alert(message);
        }
    }
});