(function () {
  "use strict";

  console.log("Storage Manager: Injected script initialized");

  function getStorageData() {
    const localStorage_data = {};
    const sessionStorage_data = {};

    try {
      // Get localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorage_data[key] = localStorage.getItem(key);
      }

      // Get sessionStorage data
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        sessionStorage_data[key] = sessionStorage.getItem(key);
      }
    } catch (error) {
      console.error("Error accessing storage:", error);
    }

    return {
      localStorage: localStorage_data,
      sessionStorage: sessionStorage_data,
      url: window.location.href,
    };
  }

  function setStorageItem(storageType, key, value) {
    try {
      console.log(`Storage Manager: Setting ${storageType} item:`, key, value);
      if (storageType === "localStorage") {
        localStorage.setItem(key, value);
      } else if (storageType === "sessionStorage") {
        sessionStorage.setItem(key, value);
      }
      return { success: true };
    } catch (error) {
      console.error("Error setting storage item:", error);
      return { success: false, error: error.message };
    }
  }

  function deleteStorageItem(storageType, key) {
    try {
      console.log(`Storage Manager: Deleting ${storageType} item:`, key);
      if (storageType === "localStorage") {
        localStorage.removeItem(key);
      } else if (storageType === "sessionStorage") {
        sessionStorage.removeItem(key);
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting storage item:", error);
      return { success: false, error: error.message };
    }
  }

  function clearStorage(storageType) {
    try {
      console.log(`Storage Manager: Clearing ${storageType}`);
      if (storageType === "localStorage") {
        localStorage.clear();
      } else if (storageType === "sessionStorage") {
        sessionStorage.clear();
      }
      return { success: true };
    } catch (error) {
      console.error("Error clearing storage:", error);
      return { success: false, error: error.message };
    }
  }

  function importStorage(storageType, data) {
    try {
      console.log(`Storage Manager: Importing data to ${storageType}:`, data);
      const storage =
        storageType === "localStorage" ? localStorage : sessionStorage;
      Object.entries(data).forEach(([key, value]) => {
        storage.setItem(key, value);
      });
      return { success: true };
    } catch (error) {
      console.error("Error importing storage:", error);
      return { success: false, error: error.message };
    }
  }

  // Listen for messages from content script
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.source !== "extension") return;

    console.log(
      "Storage Manager: Received message in injected script:",
      event.data
    );

    let response;

    switch (event.data.type) {
      case "GET_STORAGE_DATA":
        response = {
          type: "STORAGE_DATA",
          source: "injected",
          data: getStorageData(),
        };
        break;

      case "SET_STORAGE_ITEM":
        response = {
          type: "STORAGE_OPERATION_RESULT",
          source: "injected",
          operation: "set",
          result: setStorageItem(
            event.data.storageType,
            event.data.key,
            event.data.value
          ),
        };
        break;

      case "DELETE_STORAGE_ITEM":
        response = {
          type: "STORAGE_OPERATION_RESULT",
          source: "injected",
          operation: "delete",
          result: deleteStorageItem(event.data.storageType, event.data.key),
        };
        break;

      case "CLEAR_STORAGE":
        response = {
          type: "STORAGE_OPERATION_RESULT",
          source: "injected",
          operation: "clear",
          result: clearStorage(event.data.storageType),
        };
        break;

      case "IMPORT_STORAGE":
        response = {
          type: "STORAGE_OPERATION_RESULT",
          source: "injected",
          operation: "import",
          result: importStorage(event.data.storageType, event.data.data),
        };
        break;
    }

    if (response) {
      console.log("Storage Manager: Sending response:", response);
      window.postMessage(response, "*");
    }
  });
})();
