// Super Stories - Google Apps Script
// This script runs on a daily timer. It reads new Google Form submissions,
// sets the uploaded files to be publicly viewable, and adds them to the
// Google Sheet that powers the Super Stories website.
//
// SETUP INSTRUCTIONS ARE IN THE README. Read that first.

// -----------------------------------------------------------------------
// CONFIGURATION - update these two values before you do anything else
// -----------------------------------------------------------------------

// The ID of your Google Sheet.
// IMPORTANT: paste ONLY the ID below, nothing else from the URL.
// Your sheet URL looks like: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
// Copy only the part between /d/ and /edit
// Example: '1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A'
var SHEET_ID = '1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A';

// The name of the sheet tab where stories are listed (usually "Sheet1")
var SHEET_TAB = 'Sheet1';

// -----------------------------------------------------------------------
// DO NOT EDIT BELOW THIS LINE
// -----------------------------------------------------------------------

function syncFormResponses() {
  // Strip anything after the ID in case extra URL text was accidentally included
  var cleanId = SHEET_ID.split('/')[0].split('?')[0].split('#')[0].trim();
  var sheet = SpreadsheetApp.openById(cleanId).getSheetByName(SHEET_TAB);
  var formUrl = sheet.getParent().getFormUrl();

  if (!formUrl) {
    Logger.log('No form is linked to this spreadsheet. See setup instructions.');
    return;
  }

  var form = FormApp.openByUrl(formUrl);
  var responses = form.getResponses();

  // Build a list of video names already in the sheet so we don't add duplicates
  var existingNames = [];
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var nameColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    nameColumn.forEach(function(row) {
      existingNames.push(row[0].toString().trim().toLowerCase());
    });
  }

  responses.forEach(function(response) {
    var items = response.getItemResponses();
    var storyName = '';
    var videoFileId = '';
    var imageFileId = '';

    items.forEach(function(item) {
      var title = item.getItem().getTitle().toLowerCase();
      var value = item.getResponse();

      if (title.indexOf('story name') !== -1 || title.indexOf('video name') !== -1) {
        storyName = value.toString().trim();
      } else if (title.indexOf('video') !== -1) {
        // File upload responses return an array of file IDs
        if (Array.isArray(value)) {
          videoFileId = value[0];
        } else {
          videoFileId = value;
        }
      } else if (title.indexOf('thumbnail') !== -1 || title.indexOf('image') !== -1 || title.indexOf('picture') !== -1) {
        if (Array.isArray(value)) {
          imageFileId = value[0];
        } else {
          imageFileId = value;
        }
      }
    });

    // Skip if we don't have all three pieces of information
    if (!storyName || !videoFileId || !imageFileId) {
      Logger.log('Skipping incomplete response: ' + storyName);
      return;
    }

    // Skip if this story name is already in the sheet
    if (existingNames.indexOf(storyName.toLowerCase()) !== -1) {
      Logger.log('Already exists, skipping: ' + storyName);
      return;
    }

    // Make both files publicly viewable so the website can display them
    try {
      var videoFile = DriveApp.getFileById(videoFileId);
      videoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var videoLink = 'https://drive.google.com/file/d/' + videoFileId + '/view';

      var imageFile = DriveApp.getFileById(imageFileId);
      imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var imageLink = 'https://drive.google.com/file/d/' + imageFileId + '/view';

      // Add a new row to the sheet: Name, Video Link, Image Link
      sheet.appendRow([storyName, videoLink, imageLink]);
      Logger.log('Added: ' + storyName);

    } catch (e) {
      Logger.log('Error processing ' + storyName + ': ' + e.toString());
    }
  });

  Logger.log('Sync complete.');
}
