// Click event listener for scrape button
document.getElementById('scrape').addEventListener('click', () => {
    // Retrieve the user-entered table ID and file name
    const tableId = document.getElementById('tableId').value;
    const fileName = document.getElementById('fileName').value || 'Table-Data';
  
    // Check if the table ID is provided
    if (tableId) {
      // Query the active tab in the current window
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Inject the content script into the active tab
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content.js']
        }, () => {
          // Send a message to the content script with the table ID and file name
          chrome.tabs.sendMessage(tabs[0].id, { type: "SCRAPE", tableId: tableId, fileName: fileName });
        });
      });
    } else {
      alert('Please enter a table ID.');
    }
  });
  
  // Listens for invalid table message from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TABLE_NOT_FOUND') {
      // Display an alert with the missing table ID
      alert(`Table ID ${message.id} not found on the page.`);
    }
  });
  