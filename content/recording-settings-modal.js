// recording-settings-modal.js - Creates and manages the pre-recording settings modal

(function() {
    // Modal state
    let isModalVisible = false;
    let settings = {
        bypassCaptcha: false,
        waitForPageLoad: true,
        autoScroll: false,
        customVariables: [],
        recordNetworkRequests: false,
        retryOnError: true
    };

    // DOM elements
    let modal = null;
    let overlay = null;

    // Communication with content script
    window.addEventListener('BrowserRecorder_ToPage', (event) => {
        const message = event.detail;

        if (message.action === 'showRecordingSettingsModal') {
            showModal(message.recordingId);
        } else if (message.action === 'hideRecordingSettingsModal') {
            hideModal();
        }
    });

    // Create and show the modal
    function showModal(recordingId) {
        if (isModalVisible || modal) return;

        createModal();
        isModalVisible = true;

        // Show the modal with animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'translateY(0)';
            modal.style.opacity = '1';
        }, 10);
    }

    // Hide and remove the modal
    function hideModal() {
        if (!isModalVisible || !modal) return;

        // Hide with animation
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        modal.style.opacity = '0';

        // Remove from DOM after animation
        setTimeout(() => {
            document.body.removeChild(overlay);
            overlay = null;
            modal = null;
            isModalVisible = false;
        }, 300);
    }

    // Create the modal DOM structure
    function createModal() {
        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'hazel-modal-overlay';

        // Create modal container
        modal = document.createElement('div');
        modal.className = 'hazel-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'hazel-modal-title');

        // Set styles
        const style = document.createElement('style');
        style.textContent = `
            .hazel-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding-top: 10vh;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.2s ease-out;
            }
            
            .hazel-modal {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
                width: 500px;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                font-family: 'Google Sans', Roboto, Arial, sans-serif;
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .hazel-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .hazel-modal-title {
                color: #202124;
                font-size: 18px;
                font-weight: 500;
                margin: 0;
            }
            
            .hazel-modal-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .hazel-modal-close:hover {
                background-color: #f1f1f1;
            }
            
            .hazel-modal-close svg {
                width: 18px;
                height: 18px;
                fill: #5f6368;
            }
            
            .hazel-modal-content {
                padding: 24px;
            }
            
            .hazel-setting-group {
                margin-bottom: 24px;
            }
            
            .hazel-setting-group-title {
                color: #202124;
                font-size: 14px;
                font-weight: 500;
                margin: 0 0 12px 0;
            }
            
            .hazel-setting-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 16px;
            }
            
            .hazel-setting-label {
                margin-left: 8px;
                flex: 1;
            }
            
            .hazel-setting-name {
                display: block;
                color: #202124;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .hazel-setting-description {
                color: #5f6368;
                font-size: 12px;
            }
            
            .hazel-checkbox {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border: 2px solid #5f6368;
                border-radius: 2px;
                margin-top: 2px;
                position: relative;
                cursor: pointer;
                outline: none;
            }
            
            .hazel-checkbox:checked {
                background-color: #1a73e8;
                border-color: #1a73e8;
            }
            
            .hazel-checkbox:checked::after {
                content: '';
                position: absolute;
                left: 5px;
                top: 1px;
                width: 5px;
                height: 10px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
            
            .hazel-custom-variables {
                margin-top: 16px;
            }
            
            .hazel-var-item {
                display: flex;
                margin-bottom: 8px;
            }
            
            .hazel-var-item input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #dadce0;
                border-radius: 4px;
                font-size: 14px;
                margin-right: 8px;
            }
            
            .hazel-var-item input:focus {
                outline: none;
                border-color: #1a73e8;
            }
            
            .hazel-var-item button {
                background-color: transparent;
                border: none;
                color: #5f6368;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .hazel-var-item button:hover {
                background-color: #f1f1f1;
            }
            
            .hazel-add-var {
                background-color: transparent;
                border: 1px solid #1a73e8;
                color: #1a73e8;
                font-size: 14px;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                font-weight: 500;
            }
            
            .hazel-add-var:hover {
                background-color: rgba(26, 115, 232, 0.04);
            }
            
            .hazel-add-var svg {
                width: 16px;
                height: 16px;
                margin-right: 8px;
                fill: #1a73e8;
            }
            
            .hazel-modal-footer {
                display: flex;
                justify-content: flex-end;
                padding: 16px 24px;
                border-top: 1px solid #e0e0e0;
            }
            
            .hazel-btn {
                padding: 8px 24px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                border: none;
                margin-left: 8px;
            }
            
            .hazel-btn-secondary {
                background-color: transparent;
                color: #1a73e8;
            }
            
            .hazel-btn-secondary:hover {
                background-color: rgba(26, 115, 232, 0.04);
            }
            
            .hazel-btn-primary {
                background-color: #1a73e8;
                color: white;
            }
            
            .hazel-btn-primary:hover {
                background-color: #1765cc;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            }
        `;

        document.head.appendChild(style);

        // Create modal content
        modal.innerHTML = `
            <div class="hazel-modal-header">
                <h2 id="hazel-modal-title" class="hazel-modal-title">Recording Settings</h2>
                <button class="hazel-modal-close" aria-label="Close">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                </button>
            </div>
            
            <div class="hazel-modal-content">
                <div class="hazel-setting-group">
                    <h3 class="hazel-setting-group-title">Recording Options</h3>
                    
                    <div class="hazel-setting-item">
                        <input type="checkbox" id="hazel-bypass-captcha" class="hazel-checkbox" ${settings.bypassCaptcha ? 'checked' : ''}>
                        <div class="hazel-setting-label">
                            <label for="hazel-bypass-captcha" class="hazel-setting-name">Bypass CAPTCHA</label>
                            <span class="hazel-setting-description">Attempt to automatically solve CAPTCHAs during recording and playback</span>
                        </div>
                    </div>
                    
                    <div class="hazel-setting-item">
                        <input type="checkbox" id="hazel-wait-page-load" class="hazel-checkbox" ${settings.waitForPageLoad ? 'checked' : ''}>
                        <div class="hazel-setting-label">
                            <label for="hazel-wait-page-load" class="hazel-setting-name">Wait for Page Load</label>
                            <span class="hazel-setting-description">Pause recording/playback until page is fully loaded after navigation</span>
                        </div>
                    </div>
                    
                    <div class="hazel-setting-item">
                        <input type="checkbox" id="hazel-auto-scroll" class="hazel-checkbox" ${settings.autoScroll ? 'checked' : ''}>
                        <div class="hazel-setting-label">
                            <label for="hazel-auto-scroll" class="hazel-setting-name">Auto Scroll</label>
                            <span class="hazel-setting-description">Automatically scroll to elements that are out of view</span>
                        </div>
                    </div>
                    
                    <div class="hazel-setting-item">
                        <input type="checkbox" id="hazel-record-network" class="hazel-checkbox" ${settings.recordNetworkRequests ? 'checked' : ''}>
                        <div class="hazel-setting-label">
                            <label for="hazel-record-network" class="hazel-setting-name">Record Network Requests</label>
                            <span class="hazel-setting-description">Capture XHR and fetch API calls during recording</span>
                        </div>
                    </div>
                </div>
                
                <div class="hazel-setting-group">
                    <h3 class="hazel-setting-group-title">Custom Variables</h3>
                    <div class="hazel-setting-description" style="margin-bottom: 12px;">
                        Define custom variables that can be used during playback to modify behavior
                    </div>
                    
                    <div class="hazel-custom-variables">
                        <!-- Variable items will be inserted here -->
                    </div>
                    
                    <button class="hazel-add-var">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                        </svg>
                        Add Variable
                    </button>
                </div>
            </div>
            
            <div class="hazel-modal-footer">
                <button class="hazel-btn hazel-btn-secondary" id="hazel-cancel-btn">Cancel</button>
                <button class="hazel-btn hazel-btn-primary" id="hazel-start-btn">Start Recording</button>
            </div>
        `;

        // Append to DOM
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listeners
        setupEventListeners();

        // Populate custom variables
        renderCustomVariables();
    }

    // Set up event listeners for the modal
    function setupEventListeners() {
        // Close button
        const closeBtn = modal.querySelector('.hazel-modal-close');
        closeBtn.addEventListener('click', () => {
            cancelRecording();
        });

        // Cancel button
        const cancelBtn = modal.querySelector('#hazel-cancel-btn');
        cancelBtn.addEventListener('click', () => {
            cancelRecording();
        });

        // Start button
        const startBtn = modal.querySelector('#hazel-start-btn');
        startBtn.addEventListener('click', () => {
            startRecording();
        });

        // Add variable button
        const addVarBtn = modal.querySelector('.hazel-add-var');
        addVarBtn.addEventListener('click', () => {
            addCustomVariable();
        });

        // Checkbox events
        modal.querySelector('#hazel-bypass-captcha').addEventListener('change', function() {
            settings.bypassCaptcha = this.checked;
        });

        modal.querySelector('#hazel-wait-page-load').addEventListener('change', function() {
            settings.waitForPageLoad = this.checked;
        });

        modal.querySelector('#hazel-auto-scroll').addEventListener('change', function() {
            settings.autoScroll = this.checked;
        });

        modal.querySelector('#hazel-record-network').addEventListener('change', function() {
            settings.recordNetworkRequests = this.checked;
        });

        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isModalVisible) {
                cancelRecording();
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                cancelRecording();
            }
        });
    }

    // Render custom variables in the modal
    function renderCustomVariables() {
        const container = modal.querySelector('.hazel-custom-variables');
        container.innerHTML = '';

        if (settings.customVariables.length === 0) {
            // Add default empty variable
            settings.customVariables.push({ name: '', value: '' });
        }

        settings.customVariables.forEach((variable, index) => {
            const varItem = document.createElement('div');
            varItem.className = 'hazel-var-item';

            varItem.innerHTML = `
                <input type="text" class="hazel-var-name" placeholder="Variable Name" value="${variable.name}">
                <input type="text" class="hazel-var-value" placeholder="Value" value="${variable.value}">
                <button class="hazel-remove-var" data-index="${index}" aria-label="Remove Variable">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#5f6368">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                </button>
            `;

            container.appendChild(varItem);

            // Add event listeners
            const nameInput = varItem.querySelector('.hazel-var-name');
            const valueInput = varItem.querySelector('.hazel-var-value');
            const removeBtn = varItem.querySelector('.hazel-remove-var');

            nameInput.addEventListener('input', () => {
                settings.customVariables[index].name = nameInput.value;
            });

            valueInput.addEventListener('input', () => {
                settings.customVariables[index].value = valueInput.value;
            });

            removeBtn.addEventListener('click', () => {
                removeCustomVariable(index);
            });
        });
    }

    // Add a new custom variable
    function addCustomVariable() {
        settings.customVariables.push({ name: '', value: '' });
        renderCustomVariables();
    }

    // Remove a custom variable
    function removeCustomVariable(index) {
        settings.customVariables.splice(index, 1);
        renderCustomVariables();
    }

    // Cancel recording
    function cancelRecording() {
        hideModal();
        sendToContentScript({
            action: 'recordingSettingsCancelled'
        });
    }

    // Start recording with current settings
    function startRecording() {
        // Filter out empty variables
        settings.customVariables = settings.customVariables.filter(
            variable => variable.name.trim() !== '' || variable.value.trim() !== ''
        );

        hideModal();
        sendToContentScript({
            action: 'recordingSettingsConfirmed',
            settings: settings
        });
    }

    // Send message to content script
    function sendToContentScript(data) {
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: data
        }));
    }

    console.log('Recording Settings Modal initialized');
})();