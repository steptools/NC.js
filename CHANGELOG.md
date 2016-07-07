Version 1.3.0

Features:

- Faces now associated with corresponding geometry
- Added button and keyboard shortcut for aligning view to part (also now default view on startup)

Bugfixes:

- New Changelog! (Remove this when we get an actual bugfix)

Reverted:

-Workingstep list no longer supports property pane. Functionality reverted to v1.1.0

Version 1.2.0

Features:

- Updated references to reflect new names: STEPNode and NC.js
- Changed internal build structure
- Added properties pane with detailed information about selected workingstep, tool, tolerance, etc.
- Removed Backbone.js dependency
- Previous workingstep button enabled
- Updated endpoint structure to no longer use project ID
- Updated server to now use the command line to specify model to be loaded
- Relative pathing can now be used
- Now supports only running one file
- Pressing escape will close the properties pane
- Styling overhaul of the sidebar
- config.json deprecated and moved to config.js

Bugfixes:

- Sidebar now renders only when needed
- Sidebar can now be scrolled in Firefox
- Speed slider is now styled correctly in Edge
- Render radius is properly calculated when workingstep changes
- Bounding boxes update properly with each workingstep
- Tool Locations now properly update when workingstep changes
- View loads properly without errors on Safari / iOS
- Properties pane has correct height for scrolling
- Scrolling happens whenever tab is switched and on all tabs
- Contents of the Workplan tab can no longer be dragged
- Colors stopped working after code refactor but are now fixed
- Nodes in the Workplan tree can no longer be dragged and reordered
- Transitioned to React 15.2.0

Version 1.1.0

- Fixed sidebar text wrapping
- Implemented tabs to switch between list views
- Fixed styling for header
- Added tolerance view
- Changed perspective to be less wacky
- Fixed all assertion errors by making finder,apt, and tol global in file.js
- Stopped showing ids in tolerance view
- Removed useless code
- Added tools view
- Replaced references to StepNCNode with NC.js
- Added Changelog
