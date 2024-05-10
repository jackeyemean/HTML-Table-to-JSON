chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD') {
    // Create a new Blob object containing the JSON or CSV data to be downloaded
    const blob = new Blob([JSON.stringify(message.data)], {type: 'application/json'});
    // Generate a URL for the blob object
    const url = URL.createObjectURL(blob);
    // Initiate download as a file
    chrome.downloads.download({
      url: url,
      filename: 'table_data.json'  // Default file name
    });
  }
});
