/**
 * Culture Diagnosis -> Google Sheets sync receiver
 * 1) Create a Google Sheet.
 * 2) Extensions > Apps Script, paste this file.
 * 3) Project Settings > Script Properties > add SYNC_SECRET.
 * 4) Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5) Put the deployment URL in Vercel GOOGLE_SHEETS_WEBHOOK_URL.
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents || "{}");
    var expected = PropertiesService.getScriptProperties().getProperty("SYNC_SECRET");
    if (!expected || payload.secret !== expected) {
      return json_({ ok: false, message: "Unauthorized" });
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = payload.sheets || {};
    Object.keys(sheets).forEach(function(name) {
      replaceSheet_(spreadsheet, name, sheets[name] || []);
    });

    var meta = spreadsheet.getSheetByName("Sync_Meta") || spreadsheet.insertSheet("Sync_Meta");
    meta.clearContents();
    meta.getRange(1, 1, 3, 2).setValues([
      ["Survey Version", payload.surveyVersion || ""],
      ["Synced At", payload.syncedAt || new Date().toISOString()],
      ["Source", "Culture Diagnosis Platform"]
    ]);
    meta.setFrozenRows(1);

    return json_({ ok: true, message: "Synced" });
  } catch (err) {
    return json_({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function replaceSheet_(spreadsheet, name, rows) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clearContents();
  if (!rows.length) {
    sheet.getRange(1, 1).setValue("No data");
    return;
  }

  var headers = [];
  rows.forEach(function(row) {
    Object.keys(row).forEach(function(key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
  });
  var values = [headers].concat(rows.map(function(row) {
    return headers.map(function(header) {
      var value = row[header];
      return value === null || value === undefined ? "" : value;
    });
  }));

  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, Math.min(headers.length, 12));
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
