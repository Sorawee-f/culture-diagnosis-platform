/**
 * Culture Diagnosis <-> Google Sheets bridge
 *
 * Supports 2 directions:
 * A) Culture Diagnosis -> Google Sheets (Participants / Responses_Long / Responses_Wide)
 * B) Google Sheets Employee_Master -> Supabase via Admin button
 *
 * SETUP:
 * 1) Open the target Google Sheet > Extensions > Apps Script.
 * 2) Replace the code with this file and save.
 * 3) Project Settings > Script Properties: add SYNC_SECRET.
 * 4) Run setupSpreadsheetId() ONCE and authorize it.
 * 5) Keep an Employee Master tab named Employee_Master.
 * 6) Deploy > Manage deployments > Edit > New version > Deploy.
 *    Execute as: Me / Who has access: Anyone
 * 7) Vercel uses the same GOOGLE_SHEETS_WEBHOOK_URL and GOOGLE_SHEETS_SYNC_SECRET.
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
  var spreadsheetConfigured = Boolean(props.getProperty('SPREADSHEET_ID'));
  var secretConfigured = Boolean(props.getProperty('SYNC_SECRET'));
  var employeeMasterFound = false;

  if (spreadsheetConfigured) {
    try {
      var spreadsheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
      employeeMasterFound = Boolean(findEmployeeMasterSheet_(spreadsheet));
    } catch (err) {
      employeeMasterFound = false;
    }
  }

  return json_({
    ok: true,
    service: 'Culture Diagnosis Google Sheets Sync',
    spreadsheetConfigured: spreadsheetConfigured,
    secretConfigured: secretConfigured,
    employeeMasterFound: employeeMasterFound
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

    if (payload.action === 'pull_employee_master') {
      var masterSheet = findEmployeeMasterSheet_(spreadsheet);
      if (!masterSheet) {
        return json_({
          ok: false,
          message: 'ไม่พบ Tab ชื่อ Employee_Master กรุณาสร้าง/เปลี่ยนชื่อ Tab Employee Master ก่อน Sync'
        });
      }

      var rows = readSheetObjects_(masterSheet);
      return json_({
        ok: true,
        action: 'pull_employee_master',
        sheetName: masterSheet.getName(),
        rows: rows,
        rowCount: rows.length
      });
    }

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

function findEmployeeMasterSheet_(spreadsheet) {
  return spreadsheet.getSheetByName('Employee_Master') || spreadsheet.getSheetByName('Employees');
}

function readSheetObjects_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  if (!values || values.length < 2) return [];

  var headers = values[0].map(function(value) {
    return String(value || '').trim();
  });

  if (!headers.some(function(header) { return Boolean(header); })) return [];

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var current = values[r];
    var hasValue = current.some(function(value) {
      return String(value || '').trim() !== '';
    });
    if (!hasValue) continue;

    var row = {};
    headers.forEach(function(header, index) {
      if (!header) return;
      row[header] = current[index] === undefined ? '' : current[index];
    });
    rows.push(row);
  }
  return rows;
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
