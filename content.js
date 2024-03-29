// Listen for scrape request from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE') {
    // Find the table with the specified ID
    const table = document.getElementById(message.tableId);
    if (!table) {
      console.error(`Table with ID ${message.tableId} not found.`);
      chrome.runtime.sendMessage({ type: 'TABLE_NOT_FOUND', id: message.tableId });
      return;
    }

    // Array to hold extracted data
    const data = [];
    let headers = [];

    // Extracting table headers
    table.querySelectorAll(':scope > thead > tr').forEach(row => {
      const rowHeaders = Array.from(row.querySelectorAll('th'))
        .map(header => header.textContent.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim());
      if (rowHeaders.length > headers.length) {
        headers = rowHeaders;
      }
    });

    // Extracting table data
    table.querySelectorAll(':scope > tbody > tr').forEach(row => {
      const rowData = {};
      Array.from(row.querySelectorAll('td, th')).forEach((cell, cellIndex) => {
        if (cellIndex < headers.length) {
          rowData[headers[cellIndex]] = cell.textContent.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim();
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });

    // Define the file name for the downloaded data.
    const filename = message.fileName ? `${message.fileName}.json` : 'table_data.json';
    // Create a blob for the JSON data and initiate a download.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = filename;
    downloadAnchorNode.click();  // Trigger the download
    downloadAnchorNode.remove();  // Clean up the DOM
  }
});
