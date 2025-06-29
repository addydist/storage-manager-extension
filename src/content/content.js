let scriptInjected = false;

function injectScript() {
  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.onload = function () {
      console.log("Storage Manager: Injected script loaded successfully");
      scriptInjected = true;
      this.remove();
    };
    script.onerror = function () {
      console.error("Storage Manager: Failed to load injected script");
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error("Storage Manager: Error injecting script:", error);
  }
}

// Inject the script when the content script loads
injectScript();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Storage Manager: Received message from popup:", message);

  // Wait for script to be injected if it hasn't been yet
  if (!scriptInjected) {
    console.log("Storage Manager: Script not yet injected, retrying...");
    setTimeout(() => {
      if (!scriptInjected) {
        injectScript();
      }
      // Forward the message after a short delay
      setTimeout(() => {
        window.postMessage(
          {
            ...message,
            source: "extension",
          },
          "*"
        );
      }, 100);
    }, 100);
    return;
  }

  // Forward the message to the injected script
  window.postMessage(
    {
      ...message,
      source: "extension",
    },
    "*"
  );
});

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.source !== "injected") return;

  console.log(
    "Storage Manager: Received message from injected script:",
    event.data
  );

  // Forward the response back to the popup
  try {
    chrome.runtime.sendMessage(event.data);
  } catch (error) {
    console.error("Storage Manager: Error sending message to popup:", error);
  }
});
