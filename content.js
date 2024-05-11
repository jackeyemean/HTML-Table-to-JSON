// Converts JSON array to CSV
function jsonToCSV(json) {
  // Escapes CSV field values to handle special characters (commas and quotes)
  const escapeCSV = (str) => {
    if (str.includes(',') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`; 
    }
    return str;
  };

  const rows = json.map(row => 
    Object.values(row).map(escapeCSV).join(',')
  );
  const header = Object.keys(json[0]).map(escapeCSV).join(',');

  return [header, ...rows].join('\r\n');
}

// Ensuring that the message listener is only added once per content script execution
if (!window.contentScriptHasListener) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const table = document.getElementById(message.tableId);
    if (!table) {
      alert(`Error: Table with ID ${message.tableId} not found.`);
      return;
    }

    // Will become an array of objects, where each object's keys map to the table headers
    const data = [];

    let headers = [];
    const omittedColumns = message.omitColumns.split(',').map(Number).map(x => x - 1);
    const omittedRows = new Set(message.omitRows.split(',').map(Number).map(x => x - 1));

    // Scraping headers
    // :scope ensures we only select direct children
    table.querySelectorAll(':scope > thead > tr').forEach(row => {
      // Extract text from each th element
      const rowHeaders = Array.from(row.querySelectorAll('th'))
        .map(header => header.textContent.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim());
        // Necessary for handling tables with multiple header rows
        if (rowHeaders.length > headers.length) {
          headers = rowHeaders; // Update headers with the most comprehensive set found
        }
    });

    // Scraping data in table body, 
    // :scope ensures we only select direct children
    table.querySelectorAll(':scope > tbody > tr').forEach((row, rowIndex) => {
      if (!omittedRows.has(rowIndex)) {
        const rowData = {};
        // Iterate over each cell in the current row
        Array.from(row.querySelectorAll('td, th')).forEach((cell, cellIndex) => {
          if (!omittedColumns.includes(cellIndex) && cellIndex < headers.length) {
            rowData[headers[cellIndex]] = cell.textContent.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim();
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });

    const filename = message.fileName + (message.fileFormat === 'csv' ? '.csv' : '.json');
    const fileContent = message.fileFormat === 'csv' ? jsonToCSV(data) : JSON.stringify(data, null, 2);
    const blob = new Blob([fileContent], { type: 'text/' + (message.fileFormat === 'csv' ? 'csv' : 'json') });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = filename;
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });
  window.contentScriptHasListener = true; // Set the flag to prevent multiple listeners
}
