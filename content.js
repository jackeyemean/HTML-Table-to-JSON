// Converts JSON array to CSV
function jsonToCSV(json) {
  const escapeCSV = (str) => {
    // Covers cases where table cells have commas or double quotes
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

// Listens for popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const table = document.getElementById(message.tableId);
  if (!table) {
    chrome.runtime.sendMessage({ type: 'TABLE_NOT_FOUND', id: message.tableId });
    return;
  }

  const data = [];
  let headers = [];
  const omitIndices = message.omitColumns.split(',').map(Number).map(x => x - 1);
  const omitRowIndices = new Set(message.omitRows.split(',').map(Number).map(x => x - 1));

  // The use of :scope avoids selecting nested table headers
  table.querySelectorAll(':scope > thead > tr').forEach(row => {
    const rowHeaders = Array.from(row.querySelectorAll('th'))
      .map(header => header.textContent.replace(/[\r\n]+/g, ' ').replace(/\s\s+/g, ' ').trim());
      if (rowHeaders.length > headers.length) {
        headers = rowHeaders;
      }
  });

  // The use of :scope avoids selecting nested tables
  table.querySelectorAll(':scope > tbody > tr').forEach((row, rowIndex) => {
    if (!omitRowIndices.has(rowIndex)) {
      const rowData = {};
      Array.from(row.querySelectorAll('td, th')).forEach((cell, cellIndex) => {
        if (!omitIndices.includes(cellIndex) && cellIndex < headers.length) {
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
