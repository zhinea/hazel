// settings.js - Manages extension settings

document.addEventListener('DOMContentLoaded', function() {
    // Default settings
    const defaultSettings = {
        recording: {
            captureMouse: true,
            captureKeyboard: true,
            captureForms: true,
            captureScroll: true,
            captureNetwork: true
        },
        playback: {
            speed: 1.0,
            autoScroll: true
        },
        storage: {
            maxRecordings: 50
        }
    };

    // Elements
    const backBtn = document.getElementById('back-to-main');
    const saveBtn = document.getElementById('save-settings');
    const clearAllBtn = document.getElementById('clear-all');

    // Recording settings elements
    const captureMouse = document.getElementById('capture-mouse');
    const captureKeyboard = document.getElementById('capture-keyboard');
    const captureForms = document.getElementById('capture-forms');
    const captureScroll = document.getElementById('capture-scroll');
    const captureNetwork = document.getElementById('capture-network');

    // Playback settings elements
    const playbackSpeed = document.getElementById('playback-speed');
    const speedValue = document.getElementById('speed-value');
    const autoScroll = document.getElementById('auto-scroll');

    // Storage settings elements
    const maxRecordings = document.getElementById('max-recordings');

    // Load settings
    loadSettings();

    // Save settings button
    saveBtn.addEventListener('click', () => {
        saveSettings();
        // Show success message
        showMessage('Settings saved successfully!');
    });

    // Back button
    backBtn.addEventListener('click', () => {
        window.location.href = 'popup.html';
    });

    // Clear all recordings button
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL recordings? This cannot be undone!')) {
            clearAllRecordings();
        }
    });

    // Update speed value display when slider changes
    playbackSpeed.addEventListener('input', () => {
        speedValue.textContent = `${playbackSpeed.value}x`;
    });

    // Load settings from storage
    function loadSettings() {
        chrome.storage.local.get('browserRecorderSettings', (result) => {
            const settings = result.browserRecorderSettings || defaultSettings;

            // Apply settings to form elements
            captureMouse.checked = settings.recording.captureMouse;
            captureKeyboard.checked = settings.recording.captureKeyboard;
            captureForms.checked = settings.recording.captureForms;
            captureScroll.checked = settings.recording.captureScroll;
            captureNetwork.checked = settings.recording.captureNetwork;

            playbackSpeed.value = settings.playback.speed;
            speedValue.textContent = `${settings.playback.speed}x`;
            autoScroll.checked = settings.playback.autoScroll;

            maxRecordings.value = settings.storage.maxRecordings;
        });
    }

    // Save settings to storage
    function saveSettings() {
        const settings = {
            recording: {
                captureMouse: captureMouse.checked,
                captureKeyboard: captureKeyboard.checked,
                captureForms: captureForms.checked,
                captureScroll: captureScroll.checked,
                captureNetwork: captureNetwork.checked
            },
            playback: {
                speed: parseFloat(playbackSpeed.value),
                autoScroll: autoScroll.checked
            },
            storage: {
                maxRecordings: parseInt(maxRecordings.value, 10)
            }
        };

        chrome.storage.local.set({ 'browserRecorderSettings': settings }, () => {
            console.log('Settings saved:', settings);
        });
    }

    // Clear all recordings
    function clearAllRecordings() {
        // Get the storage manager
        chrome.runtime.sendMessage({
            action: 'clearAllRecordings'
        }, (response) => {
            if (response && response.success) {
                showMessage('All recordings have been deleted.');
            } else {
                showMessage('Failed to delete recordings.', true);
            }
        });
    }

    // Show a message
    function showMessage(message, isError = false) {
        // Create message element if it doesn't exist
        let messageEl = document.querySelector('.message-popup');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'message-popup';
            messageEl.style.position = 'fixed';
            messageEl.style.bottom = '20px';
            messageEl.style.left = '50%';
            messageEl.style.transform = 'translateX(-50%)';
            messageEl.style.padding = '10px 20px';
            messageEl.style.borderRadius = '4px';
            messageEl.style.zIndex = '1000';
            document.body.appendChild(messageEl);
        }

        // Set message style based on type
        if (isError) {
            messageEl.style.backgroundColor = '#f44336';
            messageEl.style.color = 'white';
        } else {
            messageEl.style.backgroundColor = '#4caf50';
            messageEl.style.color = 'white';
        }

        // Set message text
        messageEl.textContent = message;

        // Show message
        messageEl.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
});