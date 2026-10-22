/**
 * ============================================================================
 * ITHI POORAM (ഇത്തിപ്പൂരം) — GOOGLE WORKSPACE LIVE SPREADSHEET SYNC ENGINE
 * Admin Account: adithiyanpv6@gmail.com
 * Location: Vanchiyoor, Trivandrum
 *
 * HOW TO USE IN GOOGLE SHEETS:
 * 1. Open Google Sheets (https://sheets.new) logged in as adithiyanpv6@gmail.com
 * 2. Rename the spreadsheet to: "ITHI POORAM — Central Restaurant Live Database"
 * 3. In the top menu, click: Extensions > Apps Script
 * 4. Delete any code in the editor and paste THIS ENTIRE FILE
 * 5. Update the RESTAURANT_SERVER_URL below with your deployed website URL (or ngrok/tunnel URL)
 * 6. Click Save (Ctrl+S) and then click "Run" > syncFromRestaurantSystem
 * 7. You can set a trigger to run syncFromRestaurantSystem every 1 minute or on edit!
 *
 * RESULTS:
 * - Creates & maintains 3 clean sheets:
 *   1. "Staff Register"
 *   2. "Live Login Sessions"
 *   3. "Table Orders Database"
 * - All changes modify the EXACT SAME sheet in real-time. No multiple files are ever created!
 * ============================================================================
 */

// CONFIGURATION: Live server URL (tunnel or deployed domain)
var RESTAURANT_SERVER_URL = "https://cruel-places-jump.loca.lt";
var ADMIN_EMAIL = "adithiyanpv6@gmail.com";

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🍽️ ITHI POORAM")
    .addItem("🔄 Sync Live Data Now", "syncFromRestaurantSystem")
    .addItem("⏰ Setup Auto-Sync (Every 1 Minute)", "setupAutoSyncTrigger")
    .addToUi();
}

function setupAutoSyncTrigger() {
  // Delete existing triggers to prevent duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncFromRestaurantSystem") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Create 1-minute recurring live sync trigger
  ScriptApp.newTrigger("syncFromRestaurantSystem")
    .timeBased()
    .everyMinutes(1)
    .create();

  SpreadsheetApp.getUi().alert(
    "✅ Auto-Sync Activated!\n\nThis Google Sheet will now automatically synchronize live data from Ithi Pooram every 1 minute without creating new files."
  );
}

function syncFromRestaurantSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    var response = UrlFetchApp.fetch(RESTAURANT_SERVER_URL + "/api/google-workspace/live-feed?format=json", {
      muteHttpExceptions: true,
      headers: {
        "bypass-tunnel-reminder": "true"
      }
    });

    if (response.getResponseCode() !== 200) {
      Logger.log("Failed to fetch live data: HTTP " + response.getResponseCode());
      return;
    }

    var payload = JSON.parse(response.getContentText());
    updateStaffSheet(ss, payload.staff || []);
    updateSessionsSheet(ss, payload.sessions || [], payload.activityLogs || []);
    updateTablesSheet(ss, payload.tables || [], payload.orders || []);

    // Remove empty default 'Sheet1' if present
    var defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }

    Logger.log("Successfully synchronized all 3 sheets in-place for " + ADMIN_EMAIL);
  } catch (err) {
    Logger.log("Error during sync: " + err.toString());
  }
}

/**
 * Updates Sheet 1: Staff Database
 */
function updateStaffSheet(ss, staffList) {
  var sheetName = "Staff Database";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.setTabColor("#9E341D");

  // Headers: No status, no counter/terminal, no security privilege notes
  var headers = ["#", "Staff ID", "Employee Name", "Access PIN / Password", "Role", "Registration Date & Time"];
  var rows = [headers];

  if (staffList.length === 0) {
    rows.push(["-", "No staff registered yet", "Fresh database ready", "-", "-", "-"]);
  } else {
    for (var i = 0; i < staffList.length; i++) {
      var s = staffList[i];
      rows.push([
        i + 1,
        s.staffId || "-",
        s.name || "-",
        s.pin || "-",
        s.role || "-",
        s.registeredAt || "Today"
      ]);
    }
  }

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  // Style Header
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#9E341D")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center");

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Updates Sheet 2: Staff Session Database
 */
function updateSessionsSheet(ss, sessions, logs) {
  var sheetName = "Staff Session Database";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.setTabColor("#1E293B");

  // SECTION 1: Active Sessions
  var sessionHeaders = ["#", "Session ID", "Staff ID", "Employee Name", "Role", "Login Date & Time", "Session Status", "Last Active Time"];
  var sessionRows = [sessionHeaders];

  if (sessions.length === 0) {
    sessionRows.push(["-", "No active sessions recorded yet", "-", "-", "-", "-", "CLEAN", "-"]);
  } else {
    for (var i = 0; i < sessions.length; i++) {
      var ses = sessions[i];
      sessionRows.push([
        i + 1,
        ses.sessionId || "-",
        ses.staffId || "-",
        ses.name || "-",
        ses.role || "-",
        ses.loginDateTime || "-",
        ses.status === "ACTIVE" ? "🟢 ACTIVE" : "⚪ LOGGED OUT",
        ses.lastActive || "-"
      ]);
    }
  }

  sheet.getRange(1, 1, sessionRows.length, sessionHeaders.length).setValues(sessionRows);

  var headerRange1 = sheet.getRange(1, 1, 1, sessionHeaders.length);
  headerRange1.setBackground("#1E293B")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center");

  // SECTION 2: Activity Logs
  var startRow2 = sessionRows.length + 3;
  sheet.getRange(startRow2 - 1, 1).setValue("Activity & Registration Event Trail").setFontWeight("bold").setFontSize(11);

  var logHeaders = ["#", "Log ID", "Date & Time", "Action / Event", "Staff ID", "Employee Name", "Role", "Status"];
  var logRows = [logHeaders];

  if (logs.length === 0) {
    logRows.push(["-", "No activity logs recorded yet", "-", "-", "-", "-", "-", "-"]);
  } else {
    for (var j = 0; j < logs.length; j++) {
      var lg = logs[j];
      logRows.push([
        j + 1,
        lg.logId || "-",
        lg.timestamp || "-",
        lg.action || "-",
        lg.staffId || "-",
        lg.name || "-",
        lg.role || "-",
        lg.status || "-"
      ]);
    }
  }

  sheet.getRange(startRow2, 1, logRows.length, logHeaders.length).setValues(logRows);

  var headerRange2 = sheet.getRange(startRow2, 1, 1, logHeaders.length);
  headerRange2.setBackground("#334155")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center");

  sheet.autoResizeColumns(1, Math.max(sessionHeaders.length, logHeaders.length));
}

/**
 * Updates Sheet 3: Table Orders Database
 */
function updateTablesSheet(ss, tables, orders) {
  var sheetName = "Table Orders Database";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.setTabColor("#059669");

  // Table summary
  var headers = ["#", "Table Code", "Display Name", "Room / Section", "Capacity (Seats)", "Unpaid Orders", "Unpaid Amount (INR)", "Status"];
  var rows = [headers];

  if (tables.length === 0) {
    rows.push(["-", "No tables added yet", "Clean database ready", "-", "-", "0", "0.00", "AVAILABLE"]);
  } else {
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      rows.push([
        i + 1,
        t.tableCode || "-",
        t.displayName || "-",
        t.room || "Dining Area",
        t.capacity || 4,
        t.unpaidOrders || 0,
        ((t.unpaidAmountPaise || 0) / 100).toFixed(2),
        t.status || "AVAILABLE"
      ]);
    }
  }

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#059669")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center");

  sheet.autoResizeColumns(1, headers.length);
}

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#059669")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Segoe UI")
    .setHorizontalAlignment("center");

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Optional Webhook receiver: Called when Next.js posts directly to Google Apps Script
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.staff) updateStaffSheet(ss, payload.staff);
    if (payload.sessions) updateSessionsSheet(ss, payload.sessions, payload.activityLogs || []);
    if (payload.tables) updateTablesSheet(ss, payload.tables, payload.orders || []);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet updated in-place" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
