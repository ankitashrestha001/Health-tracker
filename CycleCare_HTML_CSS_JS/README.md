# CycleCare — HTML, CSS, JavaScript + IndexedDB

This version connects the existing CycleCare interface to a real browser database using **IndexedDB**. It does not use PHP or MySQL.

## Run the project
1. Extract the ZIP folder.
2. Open the folder in Visual Studio Code.
3. If available, install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Add period records and symptom notes. Check the History section to see saved data.

You can try opening `index.html` directly, but a local web server is recommended for consistent browser behaviour.

## Database connection
- Database name: `CycleCareDB`
- Version: `1`
- Object store: `cycles` — period dates, cycle length, period length, notes
- Object store: `symptoms` — symptom date, symptom name, notes, optional cycle reference
- Object store: `notifications` — reminder message, scheduled date, read status (schema created for future reminder features)

IndexedDB is built into the browser. The app creates the database and object stores automatically when first opened.

## Important limitation
This is a client-side database. Records are stored in the current browser profile and do not automatically sync to another device. Clearing browser data may remove them. There are no online accounts or automatic SMS/email/push notifications in this version.

## Cycle estimate notice
The app provides calendar estimates only. It cannot confirm ovulation, diagnose a health condition, or prevent pregnancy.
