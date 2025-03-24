// storage-manager.js - Handles saving and loading recordings

class StorageManager {
    constructor() {
        this.storageKey = 'browserRecorder';
        this.indexKey = `${this.storageKey}_index`;
    }

    // Save a new recording
    async saveRecording(recording) {
        if (!recording || !recording.id || !recording.name) {
            throw new Error('Invalid recording data');
        }

        try {
            // Save the recording data
            await chrome.storage.local.set({ [recording.id]: recording });

            // Update the index
            const index = await this.getRecordingIndex();
            if (!index.includes(recording.id)) {
                index.push(recording.id);
                await chrome.storage.local.set({ [this.indexKey]: index });
            }

            return true;
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }

    // Load a recording by ID
    async getRecording(recordingId) {
        try {
            const result = await chrome.storage.local.get(recordingId);
            return result[recordingId] || null;
        } catch (error) {
            console.error('Error loading recording:', error);
            throw error;
        }
    }

    // Get all recordings
    async getAllRecordings() {
        try {
            const index = await this.getRecordingIndex();

            if (index.length === 0) {
                return [];
            }

            const result = await chrome.storage.local.get(index);

            // Filter out any undefined entries
            return index
                .map(id => result[id])
                .filter(recording => recording !== undefined);
        } catch (error) {
            console.error('Error getting all recordings:', error);
            throw error;
        }
    }

    // Delete a recording
    async deleteRecording(recordingId) {
        try {
            // Remove from storage
            await chrome.storage.local.remove(recordingId);

            // Update index
            const index = await this.getRecordingIndex();
            const newIndex = index.filter(id => id !== recordingId);
            await chrome.storage.local.set({ [this.indexKey]: newIndex });

            return true;
        } catch (error) {
            console.error('Error deleting recording:', error);
            throw error;
        }
    }

    // Update an existing recording
    async updateRecording(recordingId, updates) {
        try {
            const recording = await this.getRecording(recordingId);

            if (!recording) {
                throw new Error(`Recording not found: ${recordingId}`);
            }

            // Merge updates with existing recording
            const updatedRecording = { ...recording, ...updates };

            // Save back to storage
            await chrome.storage.local.set({ [recordingId]: updatedRecording });

            return updatedRecording;
        } catch (error) {
            console.error('Error updating recording:', error);
            throw error;
        }
    }

    // Add an event to a recording
    async addEventToRecording(recordingId, event) {
        try {
            const recording = await this.getRecording(recordingId);

            if (!recording) {
                throw new Error(`Recording not found: ${recordingId}`);
            }

            // Add event to events array
            recording.events.push(event);

            // Save back to storage
            await chrome.storage.local.set({ [recordingId]: recording });

            return recording;
        } catch (error) {
            console.error('Error adding event to recording:', error);
            throw error;
        }
    }

    // Export a recording to JSON
    async exportRecording(recordingId) {
        try {
            const recording = await this.getRecording(recordingId);

            if (!recording) {
                throw new Error(`Recording not found: ${recordingId}`);
            }

            return JSON.stringify(recording, null, 2);
        } catch (error) {
            console.error('Error exporting recording:', error);
            throw error;
        }
    }

    // Import a recording from JSON
    async importRecording(jsonString) {
        try {
            const recording = JSON.parse(jsonString);

            if (!recording || !recording.id || !recording.name || !Array.isArray(recording.events)) {
                throw new Error('Invalid recording format');
            }

            // Generate a new ID to avoid conflicts
            const newId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            recording.id = newId;

            // Add timestamp if missing
            if (!recording.timestamp) {
                recording.timestamp = Date.now();
            }

            // Save the imported recording
            await this.saveRecording(recording);

            return recording;
        } catch (error) {
            console.error('Error importing recording:', error);
            throw error;
        }
    }

    // Get the index of recordings
    async getRecordingIndex() {
        try {
            const result = await chrome.storage.local.get(this.indexKey);
            return result[this.indexKey] || [];
        } catch (error) {
            console.error('Error getting recording index:', error);
            return [];
        }
    }

    // Clear all recordings
    async clearAllRecordings() {
        try {
            const index = await this.getRecordingIndex();

            // Remove all recordings
            for (const id of index) {
                await chrome.storage.local.remove(id);
            }

            // Clear the index
            await chrome.storage.local.remove(this.indexKey);

            return true;
        } catch (error) {
            console.error('Error clearing all recordings:', error);
            throw error;
        }
    }
}

// Create and export the storage manager
const storageManager = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storageManager;
}