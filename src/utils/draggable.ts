
// Function to make an element draggable
export function makeDraggable(element: HTMLElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isIframeVisible = true;

    // Create a wrapper div that will contain both the iframe and the drag handle
    const wrapper = document.createElement('div');
    wrapper.className = 'crx-iframe-wrapper';
    wrapper.style.cssText = 'position: fixed; z-index: 9999; top: 20px; left: auto; right: 20px;';

    // Create a visible drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-button';
    toggleButton.innerHTML = '-'; // Minus sign for hide
    toggleButton.title = 'Hide/Show';
    toggleButton.onclick = toggleIframeVisibility;

    // Create drag indicator
    const dragIndicator = document.createElement('div');
    dragIndicator.className = 'drag-indicator';
    dragIndicator.innerHTML = '⋮⋮⋮';

    // Add elements to drag handle
    dragHandle.appendChild(dragIndicator);
    dragHandle.appendChild(toggleButton);

    // Replace the iframe with the wrapper
    element.parentNode?.replaceChild(wrapper, element);

    // Add the drag handle and iframe to the wrapper
    wrapper.appendChild(dragHandle);
    wrapper.appendChild(element);

    // Add the mousedown event listener to the drag handle
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent) {
        // Don't initiate drag if clicking on the toggle button
        if (e.target === toggleButton) return;

        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        wrapper.style.top = (wrapper.offsetTop - pos2) + "px";
        wrapper.style.left = (wrapper.offsetLeft - pos1) + "px";
        wrapper.style.right = 'auto';
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }

    function toggleIframeVisibility(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        isIframeVisible = !isIframeVisible;

        if (isIframeVisible) {
            element.style.display = 'block';
            toggleButton.innerHTML = '−'; // Minus sign for hide
            wrapper.classList.remove('iframe-hidden');
        } else {
            element.style.display = 'none';
            toggleButton.innerHTML = '+'; // Plus sign for show
            wrapper.classList.add('iframe-hidden');
        }
    }
}