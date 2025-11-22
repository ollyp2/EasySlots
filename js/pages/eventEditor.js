/**
 * EasySlots - Event Editor Page (Create/Edit)
 * Handles event creation and editing with image upload and slot management
 */

import { requireSeller } from '../utils/authGuard.js';
import { createEvent, updateEvent, getEventById, publishEvent } from '../services/events.js';
import { getSlotsByEvent, createSlot, updateSlot, deleteSlot } from '../services/slots.js';
import { uploadEventImage, deleteEventImage, validateImageFile, createImagePreview, revokeImagePreview } from '../services/storage.js';
import { showToast } from '../components/toast.js';
import { showLoader, hideLoader } from '../components/loader.js';
import { confirm } from '../components/modal.js';
import { CONSTANTS } from '../config/constants.js';

let vendorId = null;
let eventId = null;
let isEditMode = false;
let currentEvent = null;
let currentSlots = [];
let imagePreviewUrl = null;
let selectedImageFile = null;

/**
 * Initialize event editor
 */
async function init() {
    showLoader();

    try {
        const authData = await requireSeller();
        if (!authData) return;

        vendorId = authData.profile.vendorId || authData.user.uid;

        // Check if edit mode
        const urlParams = new URLSearchParams(window.location.search);
        eventId = urlParams.get('id');
        isEditMode = !!eventId;

        // Update page title
        updatePageTitle();

        // Setup form
        setupForm();
        setupImageUpload();
        setupSlotManager();

        // Load event data if editing
        if (isEditMode) {
            await loadEventData();
        }
    } catch (error) {
        console.error('Event editor error:', error);
        showToast('Error', 'Failed to initialize editor', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Update page title based on mode
 */
function updatePageTitle() {
    const titleEl = document.querySelector('.page-title, h1');
    if (titleEl) {
        titleEl.textContent = isEditMode ? 'Edit Event' : 'Create Event';
    }
    document.title = `${isEditMode ? 'Edit' : 'Create'} Event - EasySlots`;
}

/**
 * Setup form submission
 */
function setupForm() {
    const form = document.getElementById('event-form');
    if (!form) return;

    form.addEventListener('submit', handleSubmit);

    // Save as draft button
    const draftBtn = document.getElementById('save-draft-btn');
    if (draftBtn) {
        draftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSubmit(e, 'draft');
        });
    }

    // Publish button
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) {
        publishBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSubmit(e, 'published');
        });
    }
}

/**
 * Setup image upload
 */
function setupImageUpload() {
    const imageInput = document.getElementById('event-image');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', handleRemoveImage);
    }

    // Drag and drop
    const dropZone = document.getElementById('image-drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageFile(files[0]);
            }
        });
    }
}

/**
 * Handle image selection
 * @param {Event} e - Change event
 */
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

/**
 * Handle selected image file
 * @param {File} file - Image file
 */
function handleImageFile(file) {
    const validation = validateImageFile(file);

    if (!validation.valid) {
        showToast('Error', validation.error, 'error');
        return;
    }

    // Clean up previous preview
    if (imagePreviewUrl) {
        revokeImagePreview(imagePreviewUrl);
    }

    // Create preview
    selectedImageFile = file;
    imagePreviewUrl = createImagePreview(file);
    updateImagePreview(imagePreviewUrl);
}

/**
 * Update image preview display
 * @param {string} url - Image URL
 */
function updateImagePreview(url) {
    const previewContainer = document.getElementById('image-preview');
    const dropZone = document.getElementById('image-drop-zone');
    const removeBtn = document.getElementById('remove-image-btn');

    if (previewContainer) {
        previewContainer.innerHTML = `<img src="${url}" alt="Event image preview">`;
        previewContainer.style.display = 'block';
    }

    if (dropZone) {
        dropZone.style.display = 'none';
    }

    if (removeBtn) {
        removeBtn.style.display = 'block';
    }
}

/**
 * Handle remove image
 */
function handleRemoveImage() {
    if (imagePreviewUrl) {
        revokeImagePreview(imagePreviewUrl);
    }

    selectedImageFile = null;
    imagePreviewUrl = null;

    const previewContainer = document.getElementById('image-preview');
    const dropZone = document.getElementById('image-drop-zone');
    const removeBtn = document.getElementById('remove-image-btn');
    const imageInput = document.getElementById('event-image');

    if (previewContainer) {
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
    }

    if (dropZone) {
        dropZone.style.display = 'block';
    }

    if (removeBtn) {
        removeBtn.style.display = 'none';
    }

    if (imageInput) {
        imageInput.value = '';
    }
}

/**
 * Setup slot manager
 */
function setupSlotManager() {
    const addSlotBtn = document.getElementById('add-slot-btn');
    if (addSlotBtn) {
        addSlotBtn.addEventListener('click', showAddSlotModal);
    }
}

/**
 * Load event data for editing
 */
async function loadEventData() {
    try {
        currentEvent = await getEventById(eventId);

        if (!currentEvent) {
            showToast('Error', 'Event not found', 'error');
            window.location.href = '/pages/seller/events/index.html';
            return;
        }

        // Check ownership
        if (currentEvent.vendorId !== vendorId) {
            showToast('Error', 'You do not have permission to edit this event', 'error');
            window.location.href = '/pages/seller/events/index.html';
            return;
        }

        // Populate form
        populateForm(currentEvent);

        // Load slots
        currentSlots = await getSlotsByEvent(eventId);
        renderSlots();
    } catch (error) {
        console.error('Failed to load event:', error);
        showToast('Error', 'Failed to load event data', 'error');
    }
}

/**
 * Populate form with event data
 * @param {Object} event - Event data
 */
function populateForm(event) {
    const fields = ['title', 'shortDescription', 'description', 'category', 'eventType', 'basePrice', 'capacity', 'locationType', 'location'];

    fields.forEach(field => {
        const input = document.getElementById(field) || document.getElementById(`event-${field}`);
        if (input && event[field] !== undefined) {
            input.value = event[field];
        }
    });

    // Image preview
    if (event.imageURL) {
        updateImagePreview(event.imageURL);
    }
}

/**
 * Handle form submission
 * @param {Event} e - Submit event
 * @param {string} status - Event status
 */
async function handleSubmit(e, status = 'draft') {
    e.preventDefault();

    const form = document.getElementById('event-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showLoader();

    try {
        // Gather form data
        const formData = new FormData(form);
        const eventData = {
            title: formData.get('title') || document.getElementById('title')?.value,
            shortDescription: formData.get('shortDescription') || document.getElementById('shortDescription')?.value,
            description: formData.get('description') || document.getElementById('description')?.value,
            category: formData.get('category') || document.getElementById('category')?.value,
            eventType: formData.get('eventType') || document.getElementById('eventType')?.value,
            basePrice: parseFloat(formData.get('basePrice') || document.getElementById('basePrice')?.value || 0),
            capacity: parseInt(formData.get('capacity') || document.getElementById('capacity')?.value || 10),
            locationType: formData.get('locationType') || document.getElementById('locationType')?.value || 'physical',
            location: formData.get('location') || document.getElementById('location')?.value,
            currency: 'EUR',
            status
        };

        // Upload image if selected
        if (selectedImageFile) {
            const tempId = isEditMode ? eventId : `temp_${Date.now()}`;
            eventData.imageURL = await uploadEventImage(selectedImageFile, tempId);
        } else if (currentEvent?.imageURL && !selectedImageFile) {
            eventData.imageURL = currentEvent.imageURL;
        }

        let savedEventId;

        if (isEditMode) {
            await updateEvent(eventId, eventData);
            savedEventId = eventId;
            showToast('Success', 'Event updated successfully', 'success');
        } else {
            savedEventId = await createEvent(vendorId, eventData);
            showToast('Success', 'Event created successfully', 'success');

            // Redirect to edit page to add slots
            window.location.href = `/pages/seller/events/edit.html?id=${savedEventId}`;
            return;
        }

        // If publishing, redirect to events list
        if (status === 'published') {
            window.location.href = '/pages/seller/events/index.html';
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Error', 'Failed to save event', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Show add slot modal
 */
function showAddSlotModal() {
    const modal = document.getElementById('slot-modal');
    if (modal) {
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Show modal
        modal.style.display = 'flex';
        modal.dataset.mode = 'add';

        // Setup close handlers
        const closeBtn = modal.querySelector('.modal__close, [data-close-modal]');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }

        // Setup submit
        const submitBtn = modal.querySelector('[data-save-slot]');
        if (submitBtn) {
            submitBtn.onclick = () => handleSaveSlot(modal);
        }
    }
}

/**
 * Handle save slot
 * @param {HTMLElement} modal - Modal element
 */
async function handleSaveSlot(modal) {
    const form = modal.querySelector('form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showLoader();

    try {
        const slotData = {
            date: document.getElementById('slot-date')?.value,
            startTime: document.getElementById('slot-start-time')?.value,
            endTime: document.getElementById('slot-end-time')?.value,
            capacity: parseInt(document.getElementById('slot-capacity')?.value || currentEvent?.capacity || 10),
            priceOverride: parseFloat(document.getElementById('slot-price')?.value) || null
        };

        const editSlotId = modal.dataset.slotId;

        if (editSlotId) {
            await updateSlot(eventId, editSlotId, slotData);
            showToast('Success', 'Slot updated', 'success');
        } else {
            await createSlot(eventId, slotData);
            showToast('Success', 'Slot added', 'success');
        }

        // Refresh slots
        currentSlots = await getSlotsByEvent(eventId);
        renderSlots();

        // Close modal
        modal.style.display = 'none';
    } catch (error) {
        console.error('Save slot error:', error);
        showToast('Error', 'Failed to save slot', 'error');
    } finally {
        hideLoader();
    }
}

/**
 * Render slots list
 */
function renderSlots() {
    const container = document.getElementById('slots-list');
    if (!container) return;

    if (currentSlots.length === 0) {
        container.innerHTML = `
            <div class="empty-state empty-state--small">
                <p>No time slots added yet</p>
                <button type="button" class="btn btn-outline btn-sm" id="add-first-slot-btn">Add Time Slot</button>
            </div>
        `;

        const addBtn = document.getElementById('add-first-slot-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showAddSlotModal);
        }
        return;
    }

    container.innerHTML = currentSlots.map(slot => renderSlotItem(slot)).join('');

    // Attach handlers
    container.querySelectorAll('[data-delete-slot]').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteSlot(btn.dataset.deleteSlot));
    });

    container.querySelectorAll('[data-edit-slot]').forEach(btn => {
        btn.addEventListener('click', () => handleEditSlot(btn.dataset.editSlot));
    });
}

/**
 * Render a slot item
 * @param {Object} slot - Slot data
 * @returns {string} HTML string
 */
function renderSlotItem(slot) {
    const available = (slot.capacity || slot.maxSpots || 0) - (slot.bookedCount || slot.bookedSpots || 0);

    return `
        <div class="slot-item" data-slot-id="${slot.id}">
            <div class="slot-item__info">
                <span class="slot-item__date">${slot.date}</span>
                <span class="slot-item__time">${slot.startTime} - ${slot.endTime}</span>
            </div>
            <div class="slot-item__meta">
                <span class="slot-item__capacity">${available}/${slot.capacity || slot.maxSpots || 0} spots</span>
                ${slot.priceOverride ? `<span class="slot-item__price">€${slot.priceOverride}</span>` : ''}
            </div>
            <div class="slot-item__actions">
                <button type="button" class="btn btn-ghost btn-sm" data-edit-slot="${slot.id}">Edit</button>
                <button type="button" class="btn btn-ghost btn-sm btn-danger" data-delete-slot="${slot.id}">Delete</button>
            </div>
        </div>
    `;
}

/**
 * Handle edit slot
 * @param {string} slotId - Slot ID
 */
function handleEditSlot(slotId) {
    const slot = currentSlots.find(s => s.id === slotId);
    if (!slot) return;

    const modal = document.getElementById('slot-modal');
    if (modal) {
        // Populate form
        document.getElementById('slot-date').value = slot.date || '';
        document.getElementById('slot-start-time').value = slot.startTime || '';
        document.getElementById('slot-end-time').value = slot.endTime || '';
        document.getElementById('slot-capacity').value = slot.capacity || slot.maxSpots || '';
        document.getElementById('slot-price').value = slot.priceOverride || '';

        // Set mode
        modal.dataset.mode = 'edit';
        modal.dataset.slotId = slotId;

        // Show modal
        modal.style.display = 'flex';

        // Setup handlers
        const closeBtn = modal.querySelector('.modal__close, [data-close-modal]');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }

        const submitBtn = modal.querySelector('[data-save-slot]');
        if (submitBtn) {
            submitBtn.onclick = () => handleSaveSlot(modal);
        }
    }
}

/**
 * Handle delete slot
 * @param {string} slotId - Slot ID
 */
async function handleDeleteSlot(slotId) {
    const confirmed = await confirm('Delete Slot', 'Are you sure you want to delete this time slot?');
    if (!confirmed) return;

    showLoader();

    try {
        await deleteSlot(eventId, slotId);
        currentSlots = currentSlots.filter(s => s.id !== slotId);
        renderSlots();
        showToast('Success', 'Slot deleted', 'success');
    } catch (error) {
        console.error('Delete slot error:', error);
        showToast('Error', 'Failed to delete slot', 'error');
    } finally {
        hideLoader();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
