// recording-settings-modal.js - Creates and manages the pre-recording settings modal

(function() {
    // --- Main Modal State ---
    let isMainModalVisible = false;
    let settings = {
        bypassCaptcha: false,
        waitForPageLoad: true,
        autoScroll: false,
        customVariables: [], // Structure: { name: string, value: string, type: 'plain' | 'ai' | 'api', prompt?: string, apiUrl?: string, jsonPath?: string }
        recordNetworkRequests: false,
        retryOnError: true
    };

    // --- Main Modal DOM Elements ---
    let mainModal = null;
    let mainOverlay = null;

    // --- Custom Variable Modal State & DOM ---
    let isCvModalVisible = false;
    let cvModal = null;
    let cvOverlay = null;
    let currentVarType = 'plain'; // 'plain', 'ai', 'api'
    let apiResponseData = null; // To store fetched API data

    // --- Communication with content script ---
    window.addEventListener('BrowserRecorder_ToPage', (event) => {
        const message = event.detail;

        if (message.action === 'showRecordingSettingsModal') {
            showMainModal(message.recordingId);
        } else if (message.action === 'hideRecordingSettingsModal') {
            hideMainModal();
        }
    });

    // ==================================================
    // == MAIN SETTINGS MODAL FUNCTIONS
    // ==================================================

    // Create and show the main settings modal
    function showMainModal(recordingId) {
        if (isMainModalVisible || mainModal) return;

        createMainModal();
        isMainModalVisible = true;

        // Show the modal with animation
        setTimeout(() => {
            if (mainOverlay) mainOverlay.style.opacity = '1';
            if (mainModal) {
                mainModal.style.transform = 'translateY(0)';
                mainModal.style.opacity = '1';
            }
        }, 10);
    }

    // Hide and remove the main settings modal
    function hideMainModal() {
        if (!isMainModalVisible || !mainModal) return;

        // Hide with animation
        if (mainOverlay) mainOverlay.style.opacity = '0';
        if (mainModal) {
            mainModal.style.transform = 'translateY(20px)';
            mainModal.style.opacity = '0';
        }


        // Remove from DOM after animation
        setTimeout(() => {
            if (mainOverlay && mainOverlay.parentNode) {
                mainOverlay.parentNode.removeChild(mainOverlay);
            }
            // Ensure cvModal is also hidden if it was somehow left open
            if (isCvModalVisible) {
                hideCustomVarModal(true); // Force immediate removal
            }
            mainOverlay = null;
            mainModal = null;
            isMainModalVisible = false;
        }, 300);
    }

    // Create the main modal DOM structure
    function createMainModal() {
        // Create overlay
        mainOverlay = document.createElement('div');
        mainOverlay.className = 'hazel-modal-overlay hazel-main-overlay'; // Added specific class

        // Create modal container
        mainModal = document.createElement('div');
        mainModal.className = 'hazel-modal hazel-main-modal'; // Added specific class
        mainModal.setAttribute('role', 'dialog');
        mainModal.setAttribute('aria-modal', 'true');
        mainModal.setAttribute('aria-labelledby', 'hazel-main-modal-title');

        // Set styles (Keep existing styles, maybe add specificity if needed)
        const style = document.createElement('style');
        // --- Styles for BOTH Modals ---
        style.textContent = `
            :root {
                --hazel-blue: #1a73e8;
                --hazel-blue-dark: #1765cc;
                --hazel-blue-light-bg: rgba(26, 115, 232, 0.04);
                --hazel-grey-text-primary: #202124;
                --hazel-grey-text-secondary: #5f6368;
                --hazel-grey-border-light: #e0e0e0;
                --hazel-grey-border-input: #dadce0;
                --hazel-grey-hover-bg: #f1f1f1;
                --hazel-white: white;
                --hazel-font-family: 'Google Sans', Roboto, Arial, sans-serif;
                --hazel-border-radius: 8px;
                --hazel-border-radius-small: 4px;
                --hazel-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
                --hazel-shadow-hover: 0 1px 3px rgba(0, 0, 0, 0.12);
                --hazel-transition-fast: 0.2s ease-out;
                --hazel-transition-modal: 0.3s ease;
            }

            .hazel-modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: flex-start; /* Align to top */
                padding-top: 10vh;
                z-index: 99998; /* Base z-index */
                opacity: 0;
                transition: opacity var(--hazel-transition-fast);
            }
            .hazel-modal-overlay.hazel-cv-overlay {
                z-index: 99999; /* CV modal on top */
            }

            .hazel-modal {
                background-color: var(--hazel-white);
                border-radius: var(--hazel-border-radius);
                box-shadow: var(--hazel-shadow);
                width: 500px;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                font-family: var(--hazel-font-family);
                transform: translateY(20px);
                opacity: 0;
                transition: transform var(--hazel-transition-modal), opacity var(--hazel-transition-modal);
                display: flex; /* Use flex for structure */
                flex-direction: column;
            }

            .hazel-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid var(--hazel-grey-border-light);
                flex-shrink: 0; /* Prevent header shrinking */
            }

            .hazel-modal-title {
                color: var(--hazel-grey-text-primary);
                font-size: 18px;
                font-weight: 500;
                margin: 0;
            }

            .hazel-modal-close {
                background: none; border: none; cursor: pointer;
                padding: 8px; border-radius: 50%;
                display: flex; justify-content: center; align-items: center;
            }
            .hazel-modal-close:hover { background-color: var(--hazel-grey-hover-bg); }
            .hazel-modal-close svg { width: 18px; height: 18px; fill: var(--hazel-grey-text-secondary); }

            .hazel-modal-content {
                padding: 24px;
                overflow-y: auto; /* Allow content scrolling */
                flex-grow: 1; /* Allow content to take available space */
                color: var(--hazel-grey-text-primary); /* Default text color */
            }

            .hazel-modal-footer {
                display: flex;
                justify-content: flex-end;
                padding: 16px 24px;
                border-top: 1px solid var(--hazel-grey-border-light);
                background-color: var(--hazel-white); /* Ensure footer bg */
                flex-shrink: 0; /* Prevent footer shrinking */
            }

            /* --- General Form Elements --- */
            .hazel-input, .hazel-textarea, .hazel-select {
                width: 100%;
                padding: 10px 12px; /* Slightly larger padding */
                border: 1px solid var(--hazel-grey-border-input);
                border-radius: var(--hazel-border-radius-small);
                font-size: 14px;
                font-family: var(--hazel-font-family);
                box-sizing: border-box; /* Include padding/border in width */
                margin-bottom: 16px; /* Spacing below inputs */
            }
            .hazel-input:focus, .hazel-textarea:focus, .hazel-select:focus {
                outline: none;
                border-color: var(--hazel-blue);
                box-shadow: 0 0 0 1px var(--hazel-blue); /* Subtle focus ring */
            }
            .hazel-textarea {
                min-height: 80px;
                resize: vertical;
            }
            .hazel-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--hazel-grey-text-primary);
            }
             .hazel-input-group { /* For input + button */
                 display: flex;
                 align-items: center;
                 margin-bottom: 16px;
             }
             .hazel-input-group .hazel-input {
                 flex-grow: 1;
                 margin-bottom: 0; /* Remove bottom margin within group */
                 margin-right: 8px; /* Space before button */
                 border-top-right-radius: 0; /* Join visually */
                 border-bottom-right-radius: 0;
             }
            .hazel-input-group .hazel-btn {
                 margin-left: 0; /* Reset default button margin */
                 border-top-left-radius: 0;
                 border-bottom-left-radius: 0;
                 white-space: nowrap; /* Prevent button text wrapping */
             }

             .hazel-setting-group { margin-bottom: 24px; }
             .hazel-setting-group-title {
                 color: var(--hazel-grey-text-primary); font-size: 14px;
                 font-weight: 500; margin: 0 0 12px 0;
             }
            .hazel-setting-description {
                 color: var(--hazel-grey-text-secondary); font-size: 12px;
                 margin-bottom: 12px; line-height: 1.4;
            }
             .hazel-setting-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
             .hazel-setting-label { margin-left: 8px; flex: 1; }
             .hazel-setting-name { display: block; color: var(--hazel-grey-text-primary); font-size: 14px; margin-bottom: 4px; }


            /* --- Checkbox --- */
            .hazel-checkbox {
                -webkit-appearance: none; -moz-appearance: none; appearance: none;
                width: 18px; height: 18px;
                border: 2px solid var(--hazel-grey-text-secondary); border-radius: 2px;
                margin-top: 2px; position: relative; cursor: pointer; outline: none;
                flex-shrink: 0; /* Prevent shrinking */
            }
            .hazel-checkbox:checked { background-color: var(--hazel-blue); border-color: var(--hazel-blue); }
            .hazel-checkbox:checked::after {
                content: ''; position: absolute; left: 5px; top: 1px;
                width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }

            /* --- Buttons --- */
            .hazel-btn {
                padding: 8px 24px; border-radius: var(--hazel-border-radius-small);
                font-size: 14px; font-weight: 500; cursor: pointer;
                border: none; margin-left: 8px; transition: background-color 0.15s ease, box-shadow 0.15s ease;
                text-align: center;
            }
            .hazel-btn-secondary {
                background-color: transparent; color: var(--hazel-blue);
                border: 1px solid var(--hazel-grey-border-input); /* Add border for definition */
            }
            .hazel-btn-secondary:hover { background-color: var(--hazel-blue-light-bg); }
            .hazel-btn-primary { background-color: var(--hazel-blue); color: white; }
            .hazel-btn-primary:hover { background-color: var(--hazel-blue-dark); box-shadow: var(--hazel-shadow-hover); }
             .hazel-btn-danger {
                 background-color: transparent; color: #d93025; /* Google Red */
                 border: 1px solid var(--hazel-grey-border-input);
             }
             .hazel-btn-danger:hover { background-color: rgba(217, 48, 37, 0.04); }

             .hazel-btn-icon { /* For small icon buttons like remove var */
                 background-color: transparent; border: none; color: var(--hazel-grey-text-secondary);
                 cursor: pointer; padding: 6px; display: flex; align-items: center;
                 justify-content: center; border-radius: 50%;
             }
             .hazel-btn-icon:hover { background-color: var(--hazel-grey-hover-bg); }
             .hazel-btn-icon svg { width: 18px; height: 18px; fill: currentColor; }


            /* --- Custom Variables List (Main Modal) --- */
            .hazel-custom-variables-list { margin-top: 16px; }
            .hazel-var-item {
                display: flex; align-items: center; margin-bottom: 10px;
                padding: 10px; background-color: #f8f9fa; /* Light grey background */
                border: 1px solid var(--hazel-grey-border-light);
                border-radius: var(--hazel-border-radius-small);
            }
            .hazel-var-details { flex-grow: 1; margin-right: 8px; }
            .hazel-var-name-display { font-weight: 500; font-size: 14px; color: var(--hazel-grey-text-primary); }
            .hazel-var-value-display { font-size: 13px; color: var(--hazel-grey-text-secondary); word-break: break-all; margin-top: 4px; }
            .hazel-var-type-badge {
                font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 3px;
                margin-left: 8px; display: inline-block; vertical-align: middle;
                text-transform: uppercase;
            }
            .hazel-var-type-plain { background-color: #e8f0fe; color: #174ea6; } /* Light Blue */
            .hazel-var-type-ai { background-color: #e6f4ea; color: #137333; } /* Light Green */
            .hazel-var-type-api { background-color: #fef7e0; color: #b06000; } /* Light Yellow */


            /* --- Add Variable Button (Main Modal) --- */
            .hazel-add-var {
                background-color: transparent; border: 1px solid var(--hazel-blue); color: var(--hazel-blue);
                font-size: 14px; padding: 8px 16px; border-radius: var(--hazel-border-radius-small);
                cursor: pointer; display: inline-flex; align-items: center; font-weight: 500;
                margin-top: 8px; /* Added margin top */
            }
            .hazel-add-var:hover { background-color: var(--hazel-blue-light-bg); }
            .hazel-add-var svg { width: 16px; height: 16px; margin-right: 8px; fill: currentColor; }


            /* --- SPECIFIC STYLES FOR CUSTOM VARIABLE MODAL --- */
            .hazel-cv-modal .hazel-modal-content { padding: 0 24px 24px 24px; } /* Remove top padding as type selector is there */

            .hazel-cv-type-selector {
                display: flex;
                border-bottom: 1px solid var(--hazel-grey-border-light);
                margin: 0 -24px 24px -24px; /* Extend to edges */
                padding: 0 24px;
            }
            .hazel-cv-type-button {
                flex: 1; /* Equal width */
                background: none; border: none;
                padding: 14px 10px;
                font-size: 14px; font-weight: 500;
                font-family: var(--hazel-font-family);
                color: var(--hazel-grey-text-secondary);
                cursor: pointer;
                text-align: center;
                border-bottom: 2px solid transparent;
                margin-bottom: -1px; /* Overlap border */
                transition: color 0.2s ease, border-color 0.2s ease;
            }
            .hazel-cv-type-button:hover { color: var(--hazel-grey-text-primary); }
            .hazel-cv-type-button.active {
                color: var(--hazel-blue);
                border-bottom-color: var(--hazel-blue);
            }

            .hazel-cv-config-area > div { display: none; /* Hide config sections by default */ }
            .hazel-cv-config-area > div.active { display: block; }

            #hazel-cv-api-response-display {
                background-color: #f8f9fa;
                border: 1px solid var(--hazel-grey-border-light);
                border-radius: var(--hazel-border-radius-small);
                padding: 12px;
                margin-top: 16px;
                max-height: 200px;
                overflow: auto;
                font-family: monospace;
                font-size: 12px;
                white-space: pre; /* Preserve formatting */
                word-break: break-all;
                color: var(--hazel-grey-text-primary);
            }
             #hazel-cv-api-response-display.loading {
                color: var(--hazel-grey-text-secondary);
                font-style: italic;
            }
             #hazel-cv-api-response-display.error {
                color: #d93025;
                white-space: pre-wrap; /* Wrap error message */
            }
            /* Style for JSON path selection (basic input for now) */
            .hazel-cv-json-path-label { margin-top: 16px; } /* Add space above path input */
        `;

        document.head.appendChild(style); // Append only once

        // Create main modal content
        mainModal.innerHTML = `
            <div class="hazel-modal-header">
                <h2 id="hazel-main-modal-title" class="hazel-modal-title">Recording Settings</h2>
                <button class="hazel-modal-close" aria-label="Close">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                </button>
            </div>

            <div class="hazel-modal-content">
                <div class="hazel-setting-group">
                    <h3 class="hazel-setting-group-title">Recording Options</h3>
                    ${createSettingItem('hazel-bypass-captcha', 'Bypass CAPTCHA', 'Attempt to automatically solve CAPTCHAs', settings.bypassCaptcha)}
                    ${createSettingItem('hazel-wait-page-load', 'Wait for Page Load', 'Pause until page is fully loaded after navigation', settings.waitForPageLoad)}
                    ${createSettingItem('hazel-auto-scroll', 'Auto Scroll', 'Automatically scroll to elements out of view', settings.autoScroll)}
                    ${createSettingItem('hazel-record-network', 'Record Network Requests', 'Capture XHR and fetch API calls', settings.recordNetworkRequests)}
                     ${createSettingItem('hazel-retry-error', 'Retry on Error (Playback)', 'Attempt to retry failed steps during playback', settings.retryOnError)}
                </div>

                <div class="hazel-setting-group">
                    <h3 class="hazel-setting-group-title">Custom Variables</h3>
                    <div class="hazel-setting-description">
                        Define variables for dynamic data during playback (e.g., login details, search terms).
                    </div>
                    <div class="hazel-custom-variables-list">
                        </div>
                    <button class="hazel-btn hazel-add-var">
                        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
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
        mainOverlay.appendChild(mainModal);
        document.body.appendChild(mainOverlay);

        // Add event listeners
        setupMainEventListeners();

        // Populate custom variables
        renderCustomVariables();
    }

    // Helper to create setting item HTML
    function createSettingItem(id, name, description, isChecked) {
        return `
            <div class="hazel-setting-item">
                <input type="checkbox" id="${id}" class="hazel-checkbox" ${isChecked ? 'checked' : ''}>
                <div class="hazel-setting-label">
                    <label for="${id}" class="hazel-setting-name">${name}</label>
                    <span class="hazel-setting-description">${description}</span>
                </div>
            </div>`;
    }

    // Set up event listeners for the main modal
    function setupMainEventListeners() {
        if (!mainModal) return;

        // Close button
        mainModal.querySelector('.hazel-modal-close')?.addEventListener('click', cancelRecording);
        // Cancel button
        mainModal.querySelector('#hazel-cancel-btn')?.addEventListener('click', cancelRecording);
        // Start button
        mainModal.querySelector('#hazel-start-btn')?.addEventListener('click', startRecording);
        // Add variable button -> NOW SHOWS THE NEW MODAL
        mainModal.querySelector('.hazel-add-var')?.addEventListener('click', showCustomVarModal);

        // Checkbox events
        mainModal.querySelector('#hazel-bypass-captcha')?.addEventListener('change', function() { settings.bypassCaptcha = this.checked; });
        mainModal.querySelector('#hazel-wait-page-load')?.addEventListener('change', function() { settings.waitForPageLoad = this.checked; });
        mainModal.querySelector('#hazel-auto-scroll')?.addEventListener('change', function() { settings.autoScroll = this.checked; });
        mainModal.querySelector('#hazel-record-network')?.addEventListener('change', function() { settings.recordNetworkRequests = this.checked; });
        mainModal.querySelector('#hazel-retry-error')?.addEventListener('change', function() { settings.retryOnError = this.checked; });


        // Close on escape key (only if main modal is visible and CV modal is not)
        document.addEventListener('keydown', handleMainEscapeKey);

        // Close on overlay click (only for main overlay)
        mainOverlay?.addEventListener('click', handleMainOverlayClick);
    }

    // Handler for Escape Key on Main Modal
    function handleMainEscapeKey(e) {
        if (e.key === 'Escape' && isMainModalVisible && !isCvModalVisible) {
            cancelRecording();
        }
    }
    // Handler for Overlay Click on Main Modal
    function handleMainOverlayClick(e) {
        if (e.target === mainOverlay && !isCvModalVisible) { // Only close if CV modal isn't active
            cancelRecording();
        }
    }


    // Render custom variables LIST in the main modal
    function renderCustomVariables() {
        if (!mainModal) return;
        const container = mainModal.querySelector('.hazel-custom-variables-list');
        if (!container) return;
        container.innerHTML = ''; // Clear current list

        if (settings.customVariables.length === 0) {
            container.innerHTML = '<div class="hazel-setting-description" style="text-align: center; padding: 10px;">No custom variables added yet.</div>';
            return;
        }

        settings.customVariables.forEach((variable, index) => {
            const varItem = document.createElement('div');
            varItem.className = 'hazel-var-item';

            let valueDisplay = variable.value || '';
            let typeClass = 'hazel-var-type-plain'; // Default
            let typeLabel = 'Plain';

            if (variable.type === 'ai') {
                valueDisplay = `AI Prompt: ${variable.prompt || '[Not Set]'}`;
                typeClass = 'hazel-var-type-ai';
                typeLabel = 'AI';
            } else if (variable.type === 'api') {
                valueDisplay = `API: ${variable.apiUrl || '[Not Set]'} | Path: ${variable.jsonPath || '[Not Set]'}`;
                typeClass = 'hazel-var-type-api';
                typeLabel = 'API';
            }

            varItem.innerHTML = `
                <div class="hazel-var-details">
                    <span class="hazel-var-name-display">
                        ${variable.name || 'Unnamed Variable'}
                        <span class="hazel-var-type-badge ${typeClass}">${typeLabel}</span>
                    </span>
                    <div class="hazel-var-value-display">${valueDisplay}</div>
                </div>
                <button class="hazel-btn-icon hazel-remove-var" data-index="${index}" aria-label="Remove Variable">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                 </button>
            `;

            container.appendChild(varItem);

            // Add event listener for remove button
            varItem.querySelector('.hazel-remove-var')?.addEventListener('click', (e) => {
                // Use currentTarget to ensure we get the button, even if svg is clicked
                const button = e.currentTarget;
                const indexToRemove = parseInt(button.getAttribute('data-index'), 10);
                removeCustomVariable(indexToRemove);
            });
        });
    }

    // Add a new custom variable (called from CV Modal)
    function addCustomVariable(variableData) {
        // Basic validation
        if (!variableData || !variableData.name || typeof variableData.name !== 'string' || variableData.name.trim() === '') {
            console.warn("Attempted to add invalid variable data", variableData);
            // Optionally show an error to the user in the CV modal before closing it
            return;
        }
        // Add default type if missing
        if (!variableData.type) {
            variableData.type = 'plain';
        }

        settings.customVariables.push(variableData);
        renderCustomVariables(); // Re-render the list in the main modal
    }


    // Remove a custom variable
    function removeCustomVariable(index) {
        if (index >= 0 && index < settings.customVariables.length) {
            settings.customVariables.splice(index, 1);
            renderCustomVariables();
        }
    }

    // Cancel recording (from main modal)
    function cancelRecording() {
        hideMainModal();
        sendToContentScript({ action: 'recordingSettingsCancelled' });
    }

    // Start recording with current settings (from main modal)
    function startRecording() {
        // Filter out potentially incomplete variables added before validation was stricter
        // (Though addCustomVariable should prevent this now)
        settings.customVariables = settings.customVariables.filter(
            variable => variable.name && variable.name.trim() !== ''
        );

        hideMainModal();
        sendToContentScript({
            action: 'recordingSettingsConfirmed',
            settings: settings
        });
    }

    // ==================================================
    // == CUSTOM VARIABLE MODAL FUNCTIONS
    // ==================================================

    // Create and show the Custom Variable modal
    function showCustomVarModal() {
        if (isCvModalVisible || cvModal) return;

        apiResponseData = null; // Reset API data when opening
        createCustomVarModal(); // Create the DOM
        isCvModalVisible = true;

        // Show the modal with animation
        setTimeout(() => {
            if (cvOverlay) cvOverlay.style.opacity = '1';
            if (cvModal) {
                cvModal.style.transform = 'translateY(0)';
                cvModal.style.opacity = '1';
                // Focus the first input (name)
                cvModal.querySelector('#hazel-cv-name')?.focus();
            }
        }, 10);
    }

    // Hide and remove the Custom Variable modal
    function hideCustomVarModal(immediate = false) {
        if (!isCvModalVisible || !cvModal) return;

        const duration = immediate ? 0 : 300;

        // Hide with animation (if not immediate)
        if (cvOverlay) cvOverlay.style.opacity = '0';
        if (cvModal) {
            cvModal.style.transform = 'translateY(20px)';
            cvModal.style.opacity = '0';
        }

        // Remove from DOM after animation/immediately
        setTimeout(() => {
            if (cvOverlay && cvOverlay.parentNode) {
                cvOverlay.parentNode.removeChild(cvOverlay);
            }
            // Clean up listeners specific to CV modal
            document.removeEventListener('keydown', handleCvEscapeKey);

            cvOverlay = null;
            cvModal = null;
            isCvModalVisible = false;
            currentVarType = 'plain'; // Reset type
            apiResponseData = null; // Clear API response cache
        }, duration);
    }

    // Create the Custom Variable modal DOM structure
    function createCustomVarModal() {
        // Create overlay
        cvOverlay = document.createElement('div');
        cvOverlay.className = 'hazel-modal-overlay hazel-cv-overlay'; // Specific class

        // Create modal container
        cvModal = document.createElement('div');
        cvModal.className = 'hazel-modal hazel-cv-modal'; // Specific class
        cvModal.setAttribute('role', 'dialog');
        cvModal.setAttribute('aria-modal', 'true');
        cvModal.setAttribute('aria-labelledby', 'hazel-cv-modal-title');

        // Reset type on creation, default to 'plain'
        currentVarType = 'plain';

        // Create modal content
        cvModal.innerHTML = `
            <div class="hazel-modal-header">
                <h2 id="hazel-cv-modal-title" class="hazel-modal-title">Add Custom Variable</h2>
                <button class="hazel-modal-close" aria-label="Close">
                     <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                </button>
            </div>

            <div class="hazel-modal-content">
                 <div class="hazel-cv-type-selector">
                    <button class="hazel-cv-type-button ${currentVarType === 'plain' ? 'active' : ''}" data-type="plain">Plain Text</button>
                    <button class="hazel-cv-type-button ${currentVarType === 'ai' ? 'active' : ''}" data-type="ai">AI Generated</button>
                    <button class="hazel-cv-type-button ${currentVarType === 'api' ? 'active' : ''}" data-type="api">API Response</button>
                </div>

                <div>
                     <label for="hazel-cv-name" class="hazel-label">Variable Name *</label>
                     <input type="text" id="hazel-cv-name" class="hazel-input" placeholder="e.g., userEmail, searchKeyword">
                </div>
                <div class="hazel-cv-config-area">

                     <div data-config-type="plain" class="${currentVarType === 'plain' ? 'active' : ''}">
                        <label for="hazel-cv-value" class="hazel-label">Value *</label>
                        <input type="text" id="hazel-cv-value" class="hazel-input" placeholder="The value of the variable">
                    </div>

                    <div data-config-type="ai" class="${currentVarType === 'ai' ? 'active' : ''}">
                        <label for="hazel-cv-prompt" class="hazel-label">Base Prompt *</label>
                        <textarea id="hazel-cv-prompt" class="hazel-textarea" placeholder="Describe the value you want AI to generate (e.g., 'Generate a realistic first name')"></textarea>
                        <span class="hazel-setting-description">The AI will generate the actual value during playback based on this prompt.</span>
                    </div>

                    <div data-config-type="api" class="${currentVarType === 'api' ? 'active' : ''}">
                         <label for="hazel-cv-api-url" class="hazel-label">API URL *</label>
                        <div class="hazel-input-group">
                             <input type="url" id="hazel-cv-api-url" class="hazel-input" placeholder="https://api.example.com/data">
                             <button id="hazel-cv-test-api" class="hazel-btn hazel-btn-secondary">Test Request</button>
                        </div>
                        <div id="hazel-cv-api-response-display" style="display: none;"></div>
                        <label for="hazel-cv-json-path" class="hazel-label hazel-cv-json-path-label" style="display: none;">JSON Path *</label>
                        <input type="text" id="hazel-cv-json-path" class="hazel-input" placeholder="e.g., data.user.id or results[0].name" style="display: none;">
                        <span class="hazel-setting-description" data-path-info>Enter the path to the desired field in the JSON response. Use dot notation for objects and square brackets for arrays (e.g., "users[0].address.city" ).</span>
                     </div>
                 </div>
            </div>

            <div class="hazel-modal-footer">
                <button class="hazel-btn hazel-btn-secondary" id="hazel-cv-cancel-btn">Cancel</button>
                <button class="hazel-btn hazel-btn-primary" id="hazel-cv-add-btn">Add Variable</button>
            </div>
        `;

        // Append to DOM
        cvOverlay.appendChild(cvModal);
        document.body.appendChild(cvOverlay);

        // Add event listeners
        setupCustomVarEventListeners();
    }


    // Set up event listeners for the Custom Variable modal
    function setupCustomVarEventListeners() {
        if (!cvModal) return;

        // Close button
        cvModal.querySelector('.hazel-modal-close')?.addEventListener('click', () => hideCustomVarModal());
        // Cancel button
        cvModal.querySelector('#hazel-cv-cancel-btn')?.addEventListener('click', () => hideCustomVarModal());
        // Add button
        cvModal.querySelector('#hazel-cv-add-btn')?.addEventListener('click', handleAddCustomVariable);

        // Type selector buttons
        cvModal.querySelectorAll('.hazel-cv-type-button').forEach(button => {
            button.addEventListener('click', handleCvTypeChange);
        });

        // API Test button
        cvModal.querySelector('#hazel-cv-test-api')?.addEventListener('click', handleApiTestRequest);

        // Close on escape key
        document.addEventListener('keydown', handleCvEscapeKey);

        // Close on overlay click
        cvOverlay?.addEventListener('click', handleCvOverlayClick);
    }

    // Handler for Escape Key on CV Modal
    function handleCvEscapeKey(e) {
        if (e.key === 'Escape' && isCvModalVisible) {
            hideCustomVarModal();
        }
    }
    // Handler for Overlay Click on CV Modal
    function handleCvOverlayClick(e) {
        if (e.target === cvOverlay) {
            hideCustomVarModal();
        }
    }


    // Handle switching variable type view
    function handleCvTypeChange(event) {
        const selectedType = event.target.getAttribute('data-type');
        if (!selectedType || selectedType === currentVarType || !cvModal) return;

        currentVarType = selectedType;

        // Update button active state
        cvModal.querySelectorAll('.hazel-cv-type-button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-type') === currentVarType);
        });

        // Update config area visibility
        cvModal.querySelectorAll('.hazel-cv-config-area > div[data-config-type]').forEach(div => {
            div.classList.toggle('active', div.getAttribute('data-config-type') === currentVarType);
        });

        // Reset API response display if switching away from API type
        if (currentVarType !== 'api') {
            const responseDisplay = cvModal.querySelector('#hazel-cv-api-response-display');
            const pathInput = cvModal.querySelector('#hazel-cv-json-path');
            const pathLabel = cvModal.querySelector('.hazel-cv-json-path-label');
            if (responseDisplay) responseDisplay.style.display = 'none';
            if (pathInput) pathInput.style.display = 'none';
            if (pathLabel) pathLabel.style.display = 'none';
        }
    }

    // Handle clicking the "Test Request" button for API type
    async function handleApiTestRequest() {
        if (!cvModal) return;
        const apiUrlInput = cvModal.querySelector('#hazel-cv-api-url');
        const responseDisplay = cvModal.querySelector('#hazel-cv-api-response-display');
        const pathInput = cvModal.querySelector('#hazel-cv-json-path');
        const pathLabel = cvModal.querySelector('.hazel-cv-json-path-label');
        const testButton = cvModal.querySelector('#hazel-cv-test-api');


        if (!apiUrlInput || !responseDisplay || !pathInput || !pathLabel || !testButton) return;

        const url = apiUrlInput.value.trim();
        if (!url) {
            responseDisplay.textContent = 'Please enter an API URL.';
            responseDisplay.className = 'error';
            responseDisplay.style.display = 'block';
            pathInput.style.display = 'none';
            pathLabel.style.display = 'none';
            return;
        }

        // Basic URL validation (very simple)
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            responseDisplay.textContent = 'Invalid URL. Must start with http:// or https://';
            responseDisplay.className = 'error';
            responseDisplay.style.display = 'block';
            pathInput.style.display = 'none';
            pathLabel.style.display = 'none';
            return;
        }


        responseDisplay.textContent = 'Fetching...';
        responseDisplay.className = 'loading'; // Add loading class
        responseDisplay.style.display = 'block';
        pathInput.style.display = 'none'; // Hide path while loading
        pathLabel.style.display = 'none';
        testButton.disabled = true; // Disable button during request
        apiResponseData = null; // Clear previous data


        try {
            const response = await fetch(url, {
                method: 'GET', // Assuming GET, could add options later
                headers: { 'Accept': 'application/json' } // Request JSON
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response, but got ${contentType || 'unknown content type'}.`);
            }

            apiResponseData = await response.json(); // Store the parsed JSON

            responseDisplay.textContent = JSON.stringify(apiResponseData, null, 2); // Pretty print JSON
            responseDisplay.className = ''; // Remove loading/error classes
            pathInput.style.display = 'block'; // Show path input
            pathLabel.style.display = 'block';
            pathInput.focus(); // Focus path input after successful fetch

        } catch (error) {
            console.error("API Test Request Failed:", error);
            apiResponseData = null; // Clear data on error
            responseDisplay.textContent = `Error: ${error.message}`;
            responseDisplay.className = 'error'; // Add error class
            pathInput.style.display = 'none'; // Hide path on error
            pathLabel.style.display = 'none';
        } finally {
            testButton.disabled = false; // Re-enable button
        }
    }

    // Handle adding the variable from the CV modal
    function handleAddCustomVariable() {
        if (!cvModal) return;

        const nameInput = cvModal.querySelector('#hazel-cv-name');
        const valueInput = cvModal.querySelector('#hazel-cv-value');
        const promptInput = cvModal.querySelector('#hazel-cv-prompt');
        const apiUrlInput = cvModal.querySelector('#hazel-cv-api-url');
        const jsonPathInput = cvModal.querySelector('#hazel-cv-json-path');

        const name = nameInput ? nameInput.value.trim() : '';

        if (!name) {
            alert('Variable Name is required.'); // Simple validation
            nameInput?.focus();
            return;
        }

        let variableData = {
            name: name,
            type: currentVarType,
            value: '', // Will be populated based on type
        };

        try {
            switch (currentVarType) {
                case 'plain':
                    const value = valueInput ? valueInput.value : ''; // Don't trim value, might be intentional
                    if (value === '') { // Require a value for plain text
                        alert('Value is required for Plain Text variables.');
                        valueInput?.focus();
                        return; // Prevent adding
                    }
                    variableData.value = value;
                    break;
                case 'ai':
                    const prompt = promptInput ? promptInput.value.trim() : '';
                    if (!prompt) {
                        alert('Base Prompt is required for AI Generated variables.');
                        promptInput?.focus();
                        return; // Prevent adding
                    }
                    variableData.prompt = prompt;
                    // Value will be generated later, maybe store prompt here too?
                    variableData.value = '[AI Generated - Set at Playback]';
                    break;
                case 'api':
                    const apiUrl = apiUrlInput ? apiUrlInput.value.trim() : '';
                    const jsonPath = jsonPathInput ? jsonPathInput.value.trim() : '';
                    if (!apiUrl) {
                        alert('API URL is required for API Response variables.');
                        apiUrlInput?.focus();
                        return; // Prevent adding
                    }
                    if (!jsonPath) {
                        alert('JSON Path is required for API Response variables. Use the "Test Request" button first.');
                        jsonPathInput?.focus();
                        return; // Prevent adding
                    }
                    // Optionally validate path against fetched data if available
                    if (apiResponseData && !getValueFromJsonPath(apiResponseData, jsonPath)) {
                        if (!confirm(`Warning: The path "${jsonPath}" did not resolve to a value in the last test response. Add anyway?`)) {
                            jsonPathInput?.focus();
                            return; // Prevent adding if user cancels
                        }
                    }

                    variableData.apiUrl = apiUrl;
                    variableData.jsonPath = jsonPath;
                    // Value will be fetched later
                    variableData.value = '[API Response - Fetched at Playback]';
                    break;
                default:
                    console.error("Invalid variable type:", currentVarType);
                    return; // Don't add
            }
        } catch (error) {
            alert(`Error preparing variable: ${error.message}`);
            return; // Prevent adding on error
        }


        // Call the function in the main modal's scope to add the variable
        addCustomVariable(variableData);

        // Close the custom variable modal
        hideCustomVarModal();
    }

    // Helper function to safely get value from JSON using a path string
    // Handles basic dot notation and array accessors like obj.users[0].name
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


    // ==================================================
    // == UTILITY FUNCTIONS
    // ==================================================

    // Send message to content script
    function sendToContentScript(data) {
        window.dispatchEvent(new CustomEvent('BrowserRecorder_FromPage', {
            detail: data
        }));
    }

    console.log('Recording Settings Modal (with Custom Var Modal) initialized');

})(); // End IIFE