chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup();
});

// Only handle specific background tasks, not message forwarding
// Let the popup communicate directly with content scripts
