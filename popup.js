// Listens for scrape button to be clicked
document.getElementById('scrape').addEventListener('click', debounce(() => {
  // Retrieving values from user input fields
  const tableId = document.getElementById('tableId').value;
  const fileName = document.getElementById('fileName').value || 'Table-Data';
  const omitColumns = document.getElementById('omitColumns').value;
  const omitRows = document.getElementById('omitRows').value;
  const fileFormat = document.getElementById('fileFormat').value;

  // Validate user inputs
  if (omitColumns && !/^(\d+,)*\d+$/.test(omitColumns)) {
    alert("Please enter a valid 'Columns to Omit' value. Example: 1,3,8");
    return;
  }

  if (tableId) {
    // Execute content.js script and sends user inputs
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "SCRAPE",
          tableId: tableId,
          fileName: fileName,
          omitColumns: omitColumns,
          fileFormat: fileFormat,
          omitRows: omitRows
        });
      });
    });
  } else {
    alert('Please enter a table ID.');
  }
}, 500));  // Debounce to prevent multiple rapid clicks

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
