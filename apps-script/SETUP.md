# Super Stories Upload Setup

This guide walks you through setting up the Google Form and Apps Script so that uploading a new story to the website becomes as simple as filling in a form.

---

## How it works

You fill in a Google Form with the story name, the video file, and a thumbnail image. The files upload automatically to Google Drive. Once a day, the Apps Script runs, finds any new submissions, makes the files publicly viewable, and adds them to your Google Sheet. The website picks them up automatically from there.

---

## Step 1: Create the Google Form

1. Go to [forms.google.com](https://forms.google.com) and create a new form.
2. Give it a title, for example "Add a Super Story".
3. Add the following three questions in this order:

| Question title | Question type |
|---|---|
| Story Name | Short answer |
| Video File | File upload |
| Thumbnail Image | File upload |

For the two file upload questions, make sure "Allow only specific file types" is turned on. Set Video File to accept video files, and Thumbnail Image to accept image files.

4. In the top right, click the three-dot menu and choose "Link to a spreadsheet". Select your existing Super Stories spreadsheet. This creates a new tab called "Form Responses 1" but that is fine; the script reads from the form directly, not from that tab.

---

## Step 2: Add the Apps Script

1. Open your Super Stories Google Sheet.
2. Click Extensions > Apps Script.
3. Delete any code already in the editor.
4. Copy the entire contents of `Code.gs` (from this folder) and paste it in.
5. Check the `SHEET_ID` value near the top of the script. It should be only the ID portion of your sheet URL, nothing else. Your sheet URL looks like this:

   `https://docs.google.com/spreadsheets/d/1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A/edit?gid=0`

   The ID is the part between `/d/` and `/edit`. Copy only that part, with no slashes, question marks, or anything after it. It should look like a long string of letters and numbers with no spaces.

6. Click the save icon (or press Ctrl+S). Give the project a name like "Super Stories Sync".

---

## Step 3: Set up the daily trigger

1. In the Apps Script editor, click the clock icon in the left sidebar (Triggers).
2. Click "Add Trigger" in the bottom right corner.
3. Set the options as follows:

| Setting | Value |
|---|---|
| Function to run | syncFormResponses |
| Deployment | Head |
| Event source | Time-driven |
| Type of time-based trigger | Day timer |
| Time of day | Pick any time, for example 6am to 7am |

4. Click Save. You may be asked to grant permissions. Accept them.

---

## Step 4: Test it manually

Before relying on the daily trigger, it is worth running the script once by hand to make sure everything is working.

1. Submit your Google Form with a test story, a short video, and a thumbnail image.
2. Go back to the Apps Script editor.
3. In the function dropdown at the top, make sure `syncFormResponses` is selected.
4. Click the Run button (the triangle/play icon).
5. Check the Execution Log at the bottom. You should see "Added: [your story name]".
6. Open your Google Sheet and check that a new row has appeared with the name, video link, and image link.
7. Visit the Super Stories website and the new story should appear in the grid.

---

## Troubleshooting

**The script runs but nothing is added to the sheet.**
Check that your form question titles contain the words "Story Name" (or "Video Name"), "Video", and "Thumbnail" (or "Image" or "Picture"). The script matches on those keywords.

**The story appears in the sheet but the thumbnail does not show on the website.**
The image file sharing may not have been set correctly. Open the image file in Google Drive, click Share, and make sure "Anyone with the link" can view it.

**The script shows a permissions error.**
When you first run the script, Google will ask you to authorise it. Click "Review permissions", choose your school account, and click Allow.

---

## Your daily upload process (once everything is set up)

1. Open the Google Form.
2. Type the story name.
3. Upload the video file.
4. Upload the thumbnail image.
5. Submit.

That is it. The story will appear on the website within 24 hours.
