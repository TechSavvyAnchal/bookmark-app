const CONFIG = {
  API_URL: "http://localhost:5000",
};

document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const noteInput = document.getElementById("note");
  const tokenInput = document.getElementById("token");
  const saveBtn = document.getElementById("save-btn");
  const statusDiv = document.getElementById("status");
  
  const tokenGroup = document.getElementById("token-group");
  const tokenStatusGroup = document.getElementById("token-status-group");
  const changeTokenLink = document.getElementById("change-token-link");

  // 1. Get current tab info
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      titleInput.value = tab.title || "";
      urlInput.value = tab.url || "";
    }
  });

  // 2. Load token from storage
  function checkToken() {
    chrome.storage.local.get(["bookmarkToken"], (result) => {
      if (result.bookmarkToken) {
        tokenInput.value = result.bookmarkToken;
        tokenGroup.classList.add("hidden");
        tokenStatusGroup.classList.remove("hidden");
      } else {
        tokenGroup.classList.remove("hidden");
        tokenStatusGroup.classList.add("hidden");
      }
    });
  }

  checkToken();

  // 3. Change Token logic
  changeTokenLink.addEventListener("click", () => {
    chrome.storage.local.remove(["bookmarkToken"], () => {
      tokenInput.value = "";
      checkToken();
      statusDiv.textContent = "Token reset. Please enter a new one.";
      statusDiv.className = "";
    });
  });

  // 4. Save link to API
  saveBtn.addEventListener("click", async () => {
    const title = titleInput.value;
    const url = urlInput.value;
    const note = noteInput.value;
    const token = tokenInput.value;

    if (!token) {
      statusDiv.textContent = "Error: Auth token required.";
      statusDiv.className = "error";
      tokenGroup.classList.remove("hidden");
      return;
    }

    // Save token for next time
    chrome.storage.local.set({ bookmarkToken: token });

    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Processing...";
    statusDiv.textContent = "";

    try {
      const response = await fetch(`${CONFIG.API_URL}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ title, url, note }),
      });

      if (response.ok) {
        statusDiv.textContent = "Successfully saved! ✨";
        statusDiv.className = "success";
        setTimeout(() => window.close(), 1500);
      } else {
        const error = await response.json().catch(() => ({ msg: "Server error" }));
        statusDiv.textContent = error.msg || "Authorization failed.";
        statusDiv.className = "error";
        if (response.status === 401) {
            tokenGroup.classList.remove("hidden");
            tokenStatusGroup.classList.add("hidden");
        }
      }
    } catch (err) {
      statusDiv.textContent = "Network error. Is the server online?";
      statusDiv.className = "error";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
});
