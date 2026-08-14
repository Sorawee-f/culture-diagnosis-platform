/**
 * Culture Diagnosis -> Google Sheets sync receiver
 *
 * SETUP (recommended):
 * 1) Open the target Google Sheet > Extensions > Apps Script.
 * 2) Paste this file and save.
 * 3) Project Settings > Script Properties: add SYNC_SECRET.
 * 4) Run setupSpreadsheetId() ONCE from the Apps Script editor and authorize it.
 *    This stores SPREADSHEET_ID so the Web App always knows which Sheet to write to.
 * 5) Deploy > New deployment > Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 6) Put the /exec URL in Vercel GOOGLE_SHEETS_WEBHOOK_URL.
 * 7) Put the same secret in Vercel GOOGLE_SHEETS_SYNC_SECRET.
 */

function setupSpreadsheetId() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('ไม่พบ Google Sheet ที่ผูกกับ Apps Script นี้ กรุณาเปิด Apps Script จาก Extensions > Apps Script ของ Google Sheet เป้าหมาย');
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
  Logger.log('SPREADSHEET_ID saved: ' + spreadsheet.getId());
  return spreadsheet.getId();
}

function doGet() {
  var props = PropertiesService.getScriptProperties();
  return json_({
    ok: true,
    service: 'Culture Diagnosis Google Sheets Sync',
    spreadsheetConfigured: Boolean(props.getProperty('SPREADSHEET_ID')),
    secretConfigured: Boolean(props.getProperty('SYNC_SECRET'))
  });
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('SYNC_SECRET');
    if (!expected || payload.secret !== expected) {
      return json_({ ok: false, message: 'Unauthorized: SYNC_SECRET ไม่ตรงกัน' });
    }

    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      return json_({ ok: false, message: 'ยังไม่ได้ตั้ง SPREADSHEET_ID กรุณารัน setupSpreadsheetId() 1 ครั้งใน Apps Script' });
    }

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheets = payload.sheets || {};
    var names = ['Participants', 'Responses_Long', 'Responses_Wide'];
    names.forEach(function(name) {
      replaceSheet_(spreadsheet, name, sheets[name] || []);
    });

    var meta = spreadsheet.getSheetByName('Sync_Meta') || spreadsheet.insertSheet('Sync_Meta');
    meta.clearContents();
    meta.getRange(1, 1, 6, 2).setValues([
      ['Survey Version', payload.surveyVersion || ''],
      ['Synced At', payload.syncedAt || new Date().toISOString()],
      ['Source', 'Culture Diagnosis Platform'],
      ['Participants Rows', (sheets.Participants || []).length],
      ['Responses Long Rows', (sheets.Responses_Long || []).length],
      ['Responses Wide Rows', (sheets.Responses_Wide || []).length]
    ]);
    meta.setFrozenRows(1);
    meta.autoResizeColumns(1, 2);

    SpreadsheetApp.flush();
    return json_({
      ok: true,
      message: 'Synced',
      spreadsheetId: spreadsheetId,
      participants: (sheets.Participants || []).length,
      responsesLong: (sheets.Responses_Long || []).length,
      responsesWide: (sheets.Responses_Wide || []).length
    });
  } catch (err) {
    return json_({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function replaceSheet_(spreadsheet, name, rows) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clearContents();
  if (!rows.length) {
    sheet.getRange(1, 1).setValue('No data');
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
      return value === null || value === undefined ? '' : value;
    });
  }));

  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, Math.min(headers.length, 12));
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
