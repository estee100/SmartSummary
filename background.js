chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (command === "summarize_text") {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getSelectedText,
        });
      } else if (command === "summarize_page") {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getFullPageText,
        });
      }
    });
  });

/**
 * Gets the highlighted text from the page and converts it to a string
 * If the text exists it sends a message to popup.js
 */
function getSelectedText() {
    let selectedText = window.getSelection().toString();
    if (selectedText) {
        chrome.runtime.sendMessage({ type: "summarize", text: selectedText});
    }
}
// Right now this gets all text form the page including headers, footers
// and navbar elements. Have to change to only get important details only
function getFullPageText() {
  chrome.scripting.executeScript({
    target: { allFrames: false, tabId: null },
    files: ["readability.js"]
  }, () => {
    chrome.scripting.executeScript({
      target: { allFrames: false, tabId: null },
      function: extractMainContent
    });
  });
}

function extractMainContent() {
  try {
    let article = new Readability(document).parse();
    if (article && article.textContent) {
      chrome.runtime.sendMessage({ type: "summarize", text: article.textContent });
    } else {
      chrome.runtime.sendMessage({ type: "summarize", text: "No readable content found." });
    }
  } catch (error) {
    chrome.runtime.sendMessage({ type: "summarize", text: "Error extracting readable content." });
  }
}