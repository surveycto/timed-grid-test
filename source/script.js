/* global $, fieldProperties, setAnswer, getPluginParameter, getMetaData, setMetaData, goToNextField, clearAnswer */

var duration = getPluginParameter('duration')
var endAfter = getPluginParameter('end-after')
var pause = getPluginParameter('pause')
var strict = getPluginParameter('strict')
var type = getPluginParameter('type')
var finishParameter = getPluginParameter('finish')
var allAnswered = getPluginParameter('all-answered')
var numberOfRows = getPluginParameter('page-rows')
var getDirection = getPluginParameter('direction')

// Milestone tracking parameters
var milestonesParam = getPluginParameter('milestones')
var milestoneAlertParam = getPluginParameter('milestone-alert') // 'modal' (default), 'flash', or 'auto'
var milestones = [] // Array of milestone times in milliseconds
var nextMilestoneIndex = 0 // Index of the next milestone to trigger
var milestoneData = [] // Array to store captured milestone data
var milestoneSelectionMode = false // Whether we're currently selecting a milestone item
var currentMilestoneIndex = -1 // The milestone index being captured
var milestoneVisualCue = true // Whether to show visual cue (red background) at milestone
var milestoneAlertMode = 'modal' // Default alert mode

// Check the language property
if ((fieldProperties.LANGUAGE !== null && checkRTL(fieldProperties.LANGUAGE)) || getDirection === 'rtl') {
  var isRTLMode = 1
}

var previousMetaData = getMetaData() // Load Metadata.

// Honor SurveyCTO read-only state. When the field is read-only the plug-in
// must render the prior answer for review without allowing any new input
// (no click bindings, no timer start, no finish/start buttons).
var isReadOnly = fieldProperties.READONLY === true

var choices = fieldProperties.CHOICES // Array of choices.
var complete = 'false' // Keep track of whether the test was completed
var currentAnswer // Keep track of the answer to be recorded.
var timePassed = 0 // Time passed so far.
var timerRunning = false // Track whether the timer is running.
var timeStart // Track time limit on each field in milliseconds.
var timeLeft = timeStart // Starts this way for the display.
var startTime = 0 // This will get an actual value when the timer starts in startStopTimer().
var selectedItems = '' // Track selected (incorrect) items. Initialized to empty string so setResult() can safely .split() before the first timer tick.
var lastSelectedIndex // Track index of last selected item.
var ans // Dummy answer.
var timeRemaining = 0 // Keep track of test time.
var endFirstLine = 'No' // Whether they ended on the firstline or not.
var choiceValuesArray = [] // Array of choice labels.
var columns = 10 // Number of columns on grid printout (letters).
var finishEarly = 0 // Track whether the test is finished on time.
var previousSelectedItems = []// Stores an array of previously selected values.
var previousTotalItems // Store the last selected item
var aStart = -1 // Counter for paging for reading test.
var aEnd = 0 // Counter for paging for reading test.
var arrayValues = choices.map(function (obj) { return obj.CHOICE_VALUE })
var items = [] // Array to keep the selected items.
var intervalId
var highestInteractedIndex = 0 // Track the highest item index ever clicked (for auto mode estimation)

var timerDisp = document.querySelector('#timer') // Span displaying the actual timer.
var backButton = document.getElementById('backButton') // back button for navigation
var button = document.querySelector('#startstop') // Button to start, stop, pause and resume test.
var pauseIcon = button.querySelector('#icon-pause')
var playIcon = button.querySelector('#icon-play')
var finishButton = document.getElementById('finishButton') // finish button to end the interview
var nextButton = document.getElementById('nextButton') // next button for navigation
var timerDisplay = document.querySelector('#timerDisplay') // div displaying the timer.
var modal = document.getElementById('modal') // Get the modal.
var modalContent = document.getElementById('modalContent') // Get the modal content.
var firstModalButton = document.getElementById('firstModalButton') // Get the first button on the modal.
var secondModalButton = document.getElementById('secondModalButton') // Get the second button on the modal.
var sentenceCount = 0 // count number of full stops in reading passage.
var punctuationCount = 0 // count number of punctuation marks in reading passage.
var punctuationArray = [] // An array of punctuation mark values
var extraItems// track whether to allow selecting items after time has run out.
var isNumber = 1
var rowCount
var prevPaused // Keep track of whether the test was paused when moving to and from the page.
var paused = 0 // keep track of whether the test is paused or not.
var wasRunningBeforeHide = false // Track timer state before visibility change

var div = document.getElementById('button-holder') // General div to house the grid.
var secondDIV
var screenSize
var pageNumber = 0
var prevPageNumber = 0
var marks = ['.', ',', '!', '?'] // List of punctuation marks.
var totalItems // Keep track of the total number of items.
// Check if the window size is 550px - this is treated as a small screen.
var mediaQuery = window.matchMedia('(max-width: 550px)')
myFunction(mediaQuery)
// MediaQueryList.addEventListener landed in WebView 75 (mid-2019). Fall back
// to the deprecated-but-universal addListener for older Android Collect WebViews.
if (typeof mediaQuery.addEventListener === 'function') {
  mediaQuery.addEventListener('change', myFunction)
} else if (typeof mediaQuery.addListener === 'function') {
  mediaQuery.addListener(myFunction)
}
// end window size check and assignment.

// Set parameter default values.
if (duration == null) {
  timeStart = 60000 // Default time limit on each field in milliseconds
} else {
  timeStart = duration * 1000 // Parameterized time limit on each field in milliseconds
}

if (numberOfRows == null) {
  if (type === 'reading') {
    if (screenSize === 'small') {
      numberOfRows = 6 // Default number of rows for reading test on small screen
    }
  } else {
    if (screenSize === 'small') {
      numberOfRows = 4 // Default number of rows on small screen
    }
  }
} else {
  numberOfRows = parseInt(numberOfRows) // Parameterized number of rows
}

if (pause == null) {
  pause = 0 // Default pause set to false.
} else {
  pause = parseInt(pause) // Parameterized pause set to value entered.
}

if (strict == null || strict == '0') {
  strict = 0 // Default strict set to false.
  extraItems = 1
} else {
  strict = parseInt(strict) // Parameterized strict set to value entered.
  extraItems = 0
}

if (finishParameter == null) {
  finishParameter = 1
} else {
  finishParameter = parseInt(finishParameter)
}

if (type === 'letters') {
  columns = 10 // Number of columns on grid printout (letters)
  if (screenSize === 'small') {
    columns = 5
  }
} else if (type === 'numbers') { // Allow user to enter numbers as parameter, but essentially works as words.
  columns = 5 // Match the documented 5-column layout for the EGMA number identification test
  type = 'words'
} else if (type === 'words') {
  columns = 5 // Number of columns on grid printout (words)
  if (screenSize !== 'small') {
    screenSize = 'large' // Screen size determines the CSS to be applied.
  }
} else if (type === 'reading') {
  columns = choices.length // Number of columns on grid printout (words)
  for (var idx = 0; idx < choices.length; idx++) {
    var textLabel = choices[idx].CHOICE_LABEL // Get the label of each item.
    if ($.inArray(textLabel, marks) !== -1) { // Check if the label is a punctuation mark.
      punctuationArray.push(choices[idx].CHOICE_VALUE)
    }
  }
  if (screenSize !== 'small') {
    screenSize = 'large' // Screen size determines the CSS to be applied.
  }
} else if (type === 'arithmetic') {
  columns = 2
  isNumber = 2
  type = 'reading'
} else {
  columns = parseInt(type)
}

// When endAfter is explicitly set to 0, disable the early-end prompt
if (endAfter == 0) {
  endAfter = null
}

// Set end after default to 10 for letters and 5 for words.
// For other types (reading, arithmetic), disable stop-rule unless explicitly set.
if (endAfter == null && type === 'letters') {
  endAfter = 10
} else if (endAfter == null && type === 'words') {
  endAfter = 5
} else if (endAfter == null) {
  // Keep as null to disable stop-rule for types like reading/arithmetic
  endAfter = null
} else {
  endAfter = parseInt(endAfter)
  // Guard against NaN if parse fails
  if (isNaN(endAfter)) {
    endAfter = null
  }
}

// Parse milestones parameter (comma-separated seconds, e.g., "60" or "60,120")
if (milestonesParam != null && milestonesParam !== '') {
  // Convert to string in case it's passed as a number (e.g., milestones = 60)
  var milestonesStr = String(milestonesParam)
  milestones = milestonesStr.split(',').map(function (s) {
    return parseInt(s.trim(), 10) * 1000 // Convert to milliseconds
  }).filter(function (n) {
    return !isNaN(n) && n > 0
  }).sort(function (a, b) {
    return a - b // Sort ascending
  })
}

// Parse milestone-alert parameter: 'modal' (default), 'flash', or 'auto'
if (milestoneAlertParam != null && milestoneAlertParam !== '') {
  var alertMode = String(milestoneAlertParam).toLowerCase().trim()
  if (alertMode === 'flash' || alertMode === 'auto') {
    milestoneAlertMode = alertMode
  }
}

// Check if MetaData exists
if (previousMetaData !== null) {
  var previousSelected = previousMetaData.split('|') // Split metadata into constituent parts.
  complete = previousSelected[2] // Keeps track of whether the test was completed or not (accidental swipe).
  currentAnswer = previousSelected[0] + '|' + previousSelected[1] // For a completed test
  var s1 = previousSelected[0].split(' ') // split the first value in metadata into time and page number.
  prevPageNumber = parseInt(s1[1]) // Get the last page number.
  var lastTimeNow = parseInt(s1[2])
  prevPaused = parseInt(s1[3])
  pageNumber = prevPageNumber // Update pageNumber to the last page number.
  var previousPunctuationCount = parseInt(previousSelected[11]) || 0 // Default to 0 for backward compatibility with older metadata
  if (type === 'reading') {
    previousTotalItems = parseInt(previousSelected[4]) + parseInt(previousPunctuationCount)
  } else {
    previousTotalItems = parseInt(previousSelected[4]) // Ensure consistent number type
  }
  if (complete !== 'true' || complete == null) { // For incomplete test.
    if (!isNaN(parseInt(s1[0]))) {
      timeLeft = parseInt(s1[0]) // Get time left from metadata.
      
      // Validate timeLeft is within reasonable bounds (prevent corruption)
      var originalDuration = duration != null ? duration * 1000 : 60000
      if (timeLeft < 0 || timeLeft > originalDuration) {
        // Corrupted value detected - reset to safe state
        console.warn('Timed grid: Detected corrupted timeLeft value (' + timeLeft + '), resetting')
        timeLeft = originalDuration
      }
      
      // Timer pauses on swipe-away and resumes from where it was
      // Time away is NOT subtracted - timer preserves state during navigation
      var leftoverTime = timeLeft
      timeStart = leftoverTime // Resume timer from where it was
    }
  } else {
    timeLeft = 0 // For completed test
    finishButton.classList.add('hidden')
  }
  timerRunning = true
  var previousValues = previousSelected[1].split(' ')
  var itemPositions = ''
  for (var pIdx = 0; pIdx < previousValues.length; pIdx++) {
    var position = arrayValues.indexOf(previousValues[pIdx]) + 1
    itemPositions = itemPositions + ' ' + position
  }
  previousSelectedItems = itemPositions.split(' ') // Get an array of the previously selected items.
  items = previousSelectedItems.slice(1) // Remove the first item in the array which is undefined.

  // Restore milestone data from metadata (positions 12+ contain milestone data)
  // Each milestone uses 5 positions: seconds, lastIndex, totalItems, incorrect, correct
  if (previousSelected.length > 12 && milestones.length > 0) {
    var milestoneStartPos = 12
    var milestonesRestored = 0
    while (milestoneStartPos + 4 < previousSelected.length && milestonesRestored < milestones.length) {
      var msSeconds = parseInt(previousSelected[milestoneStartPos])
      if (!isNaN(msSeconds) && msSeconds > 0) {
        milestoneData.push({
          seconds: msSeconds,
          lastIndex: parseInt(previousSelected[milestoneStartPos + 1]),
          totalItems: parseInt(previousSelected[milestoneStartPos + 2]),
          incorrect: parseInt(previousSelected[milestoneStartPos + 3]),
          correct: parseInt(previousSelected[milestoneStartPos + 4])
        })
        milestonesRestored++
        nextMilestoneIndex = milestonesRestored // Skip already-captured milestones
      }
      milestoneStartPos += 5
    }
  }
}

createGrid(choices) // Create a grid using the array of choices provided.

// For reading grid
var minLeft = null // Keep track of the left most position.
var rowPos = 0 // Keep track of the number of rows.

// function called when a box is clicked.
var boxHandler = function () {
  var it = this.classList.item(1) // Get the item class
  var itemIndex = it.slice(4) // Get the number of the item based on the item class. Item class has the word 'item' plus the item number.
  itemClicked(this, itemIndex) // function to call when the box is clicked.
}
var gridItems
// Once the grid is created.
if (createGrid) {
  gridItems = $.makeArray(document.querySelectorAll('.box')) // Get all grid items - they all have the box class.
  $.map(gridItems, function (box) {
    if (!isReadOnly && !(box.classList.contains('pmBox'))) { // If the item doesn't have the class pmBox (its not a punctuation mark) and the field is editable.
      box.addEventListener('click', boxHandler, false) // Make it clickable.
    }
    var it = box.classList.item(1) // Get the item class
    var itemIndex = it.slice(4) // Get the item number from the item class
    if (previousSelectedItems != null && ($.inArray(itemIndex, previousSelectedItems) !== -1)) { // If metadata exists check list of selected items.
      box.classList.add('selected') // Add the CSS class selected.
    }
    if (previousSelectedItems != null && itemIndex == previousTotalItems) {
      box.classList.add('lastSelected')
    }
  })

  // Restore milestone selection highlights from restored milestoneData
  if (milestoneData.length > 0) {
    for (var mi = 0; mi < milestoneData.length; mi++) {
      var msLastIndex = milestoneData[mi].lastIndex
      if (msLastIndex > 0 && msLastIndex <= gridItems.length) {
        var msItem = gridItems[msLastIndex - 1] // Convert 1-based index to 0-based
        if (msItem) {
          msItem.classList.add('milestoneSelected')
        }
      }
    }
  }
  intervalId = setInterval(timer, 100) // Start the timer (100ms for better battery life).
  
  // Clean up timer on page unload to prevent memory leaks
  window.addEventListener('beforeunload', function () {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  // Handle visibility change (app backgrounded, screen off, tab switch, etc.)
  // This prevents timer corruption and freezes when the page loses focus
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      // Page is hidden - pause the timer if running
      if (timerRunning && !milestoneSelectionMode) {
        wasRunningBeforeHide = true
        // Pause the timer
        timerRunning = false
        paused = 1
        // Update time tracking to preserve accurate state
        timePassed = Date.now() - startTime
        timeLeft = timeStart - timePassed
        // Persist current state to metadata
        selectedItems = getSelectedItems()
        var timeNow = Date.now()
        currentAnswer = String(timeLeft) + ' ' + pageNumber + ' ' + String(timeNow) + ' ' + paused + '|' + selectedItems
        setMetaData(currentAnswer + getMilestoneMetadataTail())
      } else {
        wasRunningBeforeHide = false
      }
    } else {
      // Page is visible again - resume if we were running before
      if (wasRunningBeforeHide && !milestoneSelectionMode && complete !== 'true') {
        paused = 0
        startTime = Date.now() - timePassed
        timerRunning = true
        wasRunningBeforeHide = false
        // Update UI state
        playIcon.style.display = 'none'
        pauseIcon.style.display = ''
      }
    }
  })
  if (previousMetaData != null && complete !== 'true') { // For a test in progress.
    timerRunning = false // mimick a paused test
    if (!isNaN(timeLeft)) {
      startStopTimer() // continue the test immediately on return
      if (screenSize !== 'small') {
        finishButton.classList.remove('hidden')
      }
    } else {
      timerDisplay.classList.add('hidden')
      button.classList.remove('hidden')
      finishButton.classList.add('hidden')
      if (complete == null) {
        if (screenSize !== 'small') {
          finishButton.classList.remove('hidden')
        }
      } else {
        moveForward()
      }
    }
  }
  if (screenSize === 'small') {
    addPagination()
  } else {
    if (numberOfRows != null) {
      addPagination()
    } else {
      finishButton.classList.remove('hidden')
      resizeText()
    }
  }
  if (complete === 'true') {
    finishButton.classList.add('hidden')
    makeInActive()
  }
  if (isReadOnly) {
    // Read-only: no timer, no finish, no start/stop button. Render only.
    finishButton.classList.add('hidden')
    button.classList.add('hidden')
    timerDisplay.classList.add('hidden')
    makeInActive()
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    timerRunning = false
  }
}

// For reading test.
var pageArr = [] // Keep track of items on each page.
var shouldPage = false // Whether to add another page on a small screen.
var boxes = document.querySelectorAll('.box')

$(document).ready(function () {
  if (type === 'reading' && screenSize === 'small') { // For reading test on a small screen.
    nextButton.classList.remove('hideButton') // hide next button
    var n
    for (n = 0; n < boxes.length; n++) {
      var el = boxes[n]
      var left = parseFloat(el.offsetLeft)// Get the left position.
      if (left <= minLeft || minLeft == null) { // Check whether its the leftmost item.
        rowPos++ // Create a new row if it is the leftmost item.
        if (rowPos >= numberOfRows) { // Check the number of rows so far.
          shouldPage = true // Add paging if more than 6 rows.
        }
        if (rowPos % numberOfRows === 0) { // Create a new page every 6 rows.
          var temp = el.classList.item(1).slice(4)
          pageArr.push(temp)
        }
        minLeft = left
      }
    }
    passagePaging(pageArr, shouldPage) // Create passage.
    // Manages paging for a grid test in progress.
    if (previousMetaData != null) {
      if (prevPageNumber > 0) {
        backButton.classList.remove('hideButton') // show back button for more than one page
      }
      aStart = prevPageNumber - 1
      aEnd = prevPageNumber
      pageReading()
    }
  }
})
var noPunctuationsArray = $.grep(arrayValues, function (value) { return $.inArray(value, punctuationArray) < 0 })

// Build array of first N non-punctuation item INDICES for stop-rule comparison
// FIX: Previously this stored VALUES but items array stores INDICES, causing comparison to fail
var firstTenItems = [] // Array of first item INDICES (as strings) for stop-rule
if (endAfter != null) {
  var nonPunctuationCount = 0
  for (var stopIdx = 0; stopIdx < choices.length && nonPunctuationCount < endAfter; stopIdx++) {
    var choiceVal = choices[stopIdx].CHOICE_VALUE
    // Skip punctuation marks
    if ($.inArray(choiceVal, punctuationArray) < 0) {
      firstTenItems.push(String(stopIdx + 1)) // Store as string index (1-based) to match items array
      nonPunctuationCount++
    }
  }
}

// Finish early
$('#finishButton').click(function () {
  if (timerRunning) {
    startStopTimer() // Pause the timer.
    if (finishParameter !== 1) {
      endTest()
    } else {
      finishModal() // open finish modal
    }
  }
})

// Row-label click handler. Skipped in read-only mode so the (1)/(2) labels
// can't be tapped to mass-select sibling boxes via firstClick/secondClick.
if (!isReadOnly) $('#gridTable td.count').each(function () {
  // We track how many times *this particular label cell* has been clicked
  let clickCount = 1;
  let tempSelected = [];
  let tempSelected1 = [];

  $(this).on('click', function () {
    const clickedElement = $(this);
    // Grab the “logical row index” from the data attribute
    const rowNumber = parseInt(clickedElement.attr('data-row-index'), 10);

    if (clickCount === 1) {
      firstClick(clickedElement);
      clickCount = 2;
    } else if (clickCount === 2) {
      // Gather selected items so we can revert them later (on 3rd click)
      tempSelected = [];
      tempSelected1 = [];

      // In the same `<tr>`: Store item INDICES instead of text to handle duplicate labels
      clickedElement.siblings('.box').each(function () {
        if ($(this).hasClass('selected')) {
          var match = $(this).attr('class').match(/item(\d+)/);
          if (match && match[1]) {
            tempSelected.push(match[1]);  // Store index, not text
          }
        }
      });
      // If "letters + small screen," also handle the next row
      if (type === 'letters' && screenSize === 'small') {
        clickedElement.closest('tr').next('tr').children('.box').each(function () {
          if ($(this).hasClass('selected')) {
            var match = $(this).attr('class').match(/item(\d+)/);
            if (match && match[1]) {
              tempSelected1.push(match[1]);  // Store index, not text
            }
          }
        });
      }

            secondClick(clickedElement, rowNumber);
      clickCount = 3;
    } else {
      thirdClick(clickedElement, tempSelected, tempSelected1);
      clickCount = 1; // reset
    }
  });
});

if ((previousMetaData == null) || (typeof s1 === 'undefined') || (s1[0] === 'undefined') || (complete === 'true')) { // The second check is to see if the timer had actually been started or not
  makeInActive() // Make all buttons inactive
} else { // Since the timer keeps track of time away from the field, and subtracts that from the time, then it makes sense to have the timer running when they return.
  if (!timerRunning) {
    startStopTimer()
  } else {
    makeActive()
    if (prevPaused === 1) {
      timerRunning = true
      pause = 1
      startStopTimer()
    }
  }
}

// START FUNCTIONS

function myFunction(x) {
  if (x.matches) {
    screenSize = 'small'
    if (isRTLMode === 1) {
      screenSize = 'large'
    }
  } else {
    // Handle resize from small to large
    screenSize = 'large'
  }
}

// Function to create the grid. Takes a list of choices.
function createGrid(keys) {
  var counter = 0 // Keep track of which choice is being referenced.
  var span
  var txlbl
  var text
  var itemValue
  var itemClass
  // rowCount
  if (allAnswered != null) {
    rowCount = keys.length - 1
  } else {
    rowCount = keys.length
  }

  if (type === 'reading') {
    // Add the row to main container.
    for (var i = 0; i < rowCount / columns; i++) {
      var fieldset = document.createElement('div') // Creates a section element. Each section is the equivalent of a row.
      fieldset.setAttribute('class', 'pg')
      if (isRTLMode === 1) {
        fieldset.dir = "rtl";
      }
      for (var j = 0; j < columns; j++) { // Create the individual boxes in each row/screen.
        if (counter !== checkAllAnswered()) {
          secondDIV = document.createElement('div') // Create the div element.
          span = document.createElement('span')
          txlbl = choices[counter].CHOICE_LABEL // Add the label.
          text = document.createTextNode(txlbl) // Get the label of the text.
          itemValue = counter + 1 // Start numbering the items at 1 instead of 0.
          itemClass = 'item' + itemValue // CSS class to be applied.
          secondDIV.classList.add('box', itemClass) // Add CSS class.
          secondDIV.classList.add('pgBox') // Add the pgBox class for different styling.
          if (isRTLMode === 1) {
            secondDIV.style.float = 'right';
          }
          for (var ch of txlbl) {
            if ($.inArray(ch, marks) !== -1) { // Check if the label is a punctuation mark.
              secondDIV.classList.add('pmBox') // Add the pmBox class to punctuation marks.
              span.classList.add('disabled')
            }
          }
          choiceValuesArray.push(choices[counter].CHOICE_VALUE) // add choice labels to Array
          counter++ // increment counter.
          span.appendChild(text)
          secondDIV.appendChild(span) // add the text to the div.
          fieldset.appendChild(secondDIV) // add the div to the fieldset (row).
        }
      }
      div.appendChild(fieldset) // Add the row to main container.

    }
  } else {
    if (screenSize !== 'small') {
      $('#nextButton').addClass('hideButton')
    }
    var m = 0
    var numOfRows = Math.ceil(rowCount / columns)
    var table = '<table id="gridTable" class="gridTable">'
    for (var i = 1; i <= numOfRows; i++) {
      table += '<tr>'
      if (screenSize !== 'small' || type !== 'letters') {
        // table += '<td class="count">' + '(' + i + ')' + '</td>'
        table += '<td class="count" data-row-index="' + i + '">(' + i + ')</td>'
      } else if (i % 2 === 1 && type === 'letters' && screenSize === 'small') {
        m = m + 1
        // table += '<td rowspan="2" class="count">' + '(' + m + ')' + '</td>'
        table += '<td rowspan="2" class="count" data-row-index="' + m + '">(' + m + ')</td>'
      }
      for (var j = 1; j <= columns; j++) {
        if (counter === checkAllAnswered()) {
          break
        }
        var item = 'item' + (counter + 1)
        var td = '<td class="box ' + item + '"' + '><span>'
        table += td
        table += choices[counter].CHOICE_LABEL
        table += '</span></td>'
        choiceValuesArray.push(choices[counter].CHOICE_VALUE) // add choice labels to Array
        counter++
      }
      table += '</tr>'
    }
    table += '</table>'
    div.innerHTML = table // Add the row to main container.
  }
  if (isNumber === 2) {
    div.classList.add('pgNumber')
  }
  if (isRTLMode === 1) {
    div.dir = "rtl";
  }
  return true
}

function passagePaging(pageArray, isPage) {
  if (isPage) {
    $.map(gridItems, function (box) {
      var temp1 = parseInt(box.classList.item(1).slice(4))
      if (temp1 >= parseInt(pageArray[0])) {
        box.classList.add('hidden')
      }
    })
  }
}

function firstClick(clickedElement) {
  // Show (?) when first clicked
  clickedElement.text('(?)');
}

function secondClick(clickedElement, rowNumber) {
  // Replace (?) with rowNumber and select all siblings
  clickedElement.text('(' + rowNumber + ')');
  clickedElement.siblings().addClass('selected');

  // Update the items array for each selected sibling (for stop-rule to work)
  clickedElement.siblings('.box').each(function () {
    var itemClass = $(this).attr('class').match(/item(\d+)/);
    if (itemClass && itemClass[1]) {
      var itemIndex = itemClass[1];
      if ($.inArray(itemIndex, items) < 0) {
        items.push(itemIndex);
      }
    }
  });

  // If letters + small screen, select the next row's siblings
  if (type === 'letters' && screenSize === 'small') {
    clickedElement.closest('tr')
      .next('tr')
      .children()
      .addClass('selected');

    // Update items array for the next row as well
    clickedElement.closest('tr').next('tr').children('.box').each(function () {
      var itemClass = $(this).attr('class').match(/item(\d+)/);
      if (itemClass && itemClass[1]) {
        var itemIndex = itemClass[1];
        if ($.inArray(itemIndex, items) < 0) {
          items.push(itemIndex);
        }
      }
    });
  }

  // Check if stop-rule should trigger after row selection.
  // Guard on firstTenItems.length: when endAfter is null (stop-rule disabled)
  // the array is empty and would spuriously match an empty items array.
  var isSame = firstTenItems.length > 0 &&
    (firstTenItems.slice().sort().toString() === items.slice().sort().toString());
  if (isSame) {
    timerRunning = false;
    endFirstLine = 'Yes';
    openIncorrectItemsModal();
  }
}

function thirdClick(clickedElement, tempSelected, tempSelected1) {
  // Deselect anything that wasn't in tempSelected (compare by ITEM INDEX, not text)
  clickedElement.siblings('.box').each(function () {
    var itemClass = $(this).attr('class');
    if (itemClass) {
      var match = itemClass.match(/item(\d+)/);
      if (match && match[1]) {
        var itemIndex = match[1];
        // Check if this item's INDEX was in the original selection
        if (!tempSelected.includes(itemIndex)) {
          $(this).removeClass('selected');
          // Also remove from items array
          var idx = items.indexOf(itemIndex);
          if (idx > -1) {
            items.splice(idx, 1);
          }
        }
      }
    }
  });

  // If letters + small screen, similarly revert next row
  if (type === 'letters' && screenSize === 'small') {
    clickedElement.closest('tr')
      .next('tr')
      .children('.box')
      .each(function () {
        var itemClass = $(this).attr('class');
        if (itemClass) {
          var match = itemClass.match(/item(\d+)/);
          if (match && match[1]) {
            var itemIndex = match[1];
            // Check if this item's INDEX was in the original selection
            if (!tempSelected1.includes(itemIndex)) {
              $(this).removeClass('selected');
              // Also remove from items array
              var idx = items.indexOf(itemIndex);
              if (idx > -1) {
                items.splice(idx, 1);
              }
            }
          }
        }
      });
  }
}

function timer() { // Timer function.
  var timeNow = Date.now() // Set the time to current time.
  if (timerRunning) { // For a running timer.
    timePassed = timeNow - startTime
    timeLeft = timeStart - timePassed

    // Check for milestone triggers
    if (milestones.length > nextMilestoneIndex && !milestoneSelectionMode) {
      var elapsed = timePassed
      if (elapsed >= milestones[nextMilestoneIndex]) {
        triggerMilestone(nextMilestoneIndex)
      }
    }
  }
  
  // Safeguard: Don't update selectedItems during milestone selection mode
  // This prevents stale data from corrupting the saved state
  if (!milestoneSelectionMode) {
    selectedItems = getSelectedItems()
  }
  if (complete !== 'true') { // For incomplete tests.
    // Validate timeLeft before persisting to prevent corruption
    var safeTimeLeft = timeLeft
    if (isNaN(safeTimeLeft) || safeTimeLeft < 0) {
      safeTimeLeft = 0
    }
    currentAnswer = String(safeTimeLeft) + ' ' + pageNumber + ' ' + String(timeNow) + ' ' + paused + '|' + selectedItems // Save progress whilst the timer is running.
    setMetaData(currentAnswer + getMilestoneMetadataTail())
  }
  if (timeLeft <= 0) {
    endTimer() // End test if time is less than 0.
  }
  if (!isNaN(timeLeft)) {
    timerDisp.innerHTML = Math.ceil(timeLeft / 1000) // display the countdown timer.
  }
}

// Function to facilitate pausing and resuming tests.
function startStopTimer() {
  if (isReadOnly) return // Read-only fields must not start or pause the timer.
  timerDisplay.classList.remove('hidden') // Make the timer visible (hidden by default).
  if (pause === 0) { // Check whether pausing is allowed as a parameter.
    button.classList.add('hidden') // Hide the pause button if not specified.
  }
  if (timerRunning) { // If the timer is running.
    timerRunning = false // Pause the timer.
    playIcon.style.display = ''
    pauseIcon.style.display = 'none'
    paused = 1
    makeInActive()
  } else {
    makeActive()
    paused = 0
    startTime = Date.now() - timePassed
    timerRunning = true // Start the timer.
    playIcon.style.display = 'none'
    pauseIcon.style.display = ''
  }
}

function endEarly() {
  timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
  endTimer() // End the test.
}

// Ending the test.
function endTimer() {
  clearInterval(intervalId)
  moveForward()
  button.classList.remove('hidden') // Make the button visible.
  timerDisplay.classList.add('hidden') // Hide the timer.
  timeLeft = 0 // set time to 0.
  timerRunning = false // Stop the timer.
  if (finishEarly === 0 && complete !== 'true') { // If the test can end directly or is already complete.
    if (strict === 0) { // If the test allows selecting items once the timer has run out.
      button.disabled = false
      finishButton.classList.add('hidden') // Hide finish button.
      button.innerHTML = 'Finished'
      openExtraItemsModal()
      button.onclick = function () { // Confirm that the test is complete.
        extraItems = 0
        openLastItemModal() // Select the last attempted item after selecting extras.
        moveForward()
      }
    } else {
      finishButton.classList.add('hidden') // Hide finish button.
      strict = 0
      extraItems = 0
      moveForward()
      openLastItemModal() // Select the last attempted item directly.
    }
  }
  selectedItems = getSelectedItems() // get list of selected items.
}

function itemClicked(item, itemIndex) {
  // Handle milestone selection mode
  if (milestoneSelectionMode) {
    // Remove previous milestone selection highlight
    for (var cell of gridItems) {
      cell.classList.remove('milestoneSelected')
    }
    // Add milestone selection highlight to this item
    item.classList.add('milestoneSelected')

    // Save the milestone result
    saveMilestoneResult(currentMilestoneIndex, itemIndex)

    // Exit milestone selection mode
    milestoneSelectionMode = false
    currentMilestoneIndex = -1

    // Remove visual cue (red background)
    document.documentElement.style.removeProperty('--milestone-active')
    document.body.classList.remove('milestone-active')

    // Resume the timer with validation to prevent state corruption
    // Validate timePassed is reasonable (not negative, not greater than duration)
    if (isNaN(timePassed) || timePassed < 0) {
      timePassed = 0
    }
    if (timePassed > timeStart) {
      timePassed = timeStart
    }
    
    paused = 0
    startTime = Date.now() - timePassed
    timerRunning = true
    playIcon.style.display = 'none'
    pauseIcon.style.display = ''

    return // Don't process as a normal click
  }

  if (timerRunning || (timeLeft === 0 && strict === 0 && extraItems === 1)) { // This way, it only works when the timer is running
    // Track the highest item ever interacted with (for auto mode milestone estimation)
    var clickedIdx = parseInt(itemIndex)
    if (clickedIdx > highestInteractedIndex) {
      highestInteractedIndex = clickedIdx
    }

    var classes = item.classList
    if (classes.contains('selected')) { // Toggle the state of the item with CSS selected class.
      classes.remove('selected')
      var index = items.indexOf(itemIndex)
      if (index > -1) {
        items.splice(index, 1) // Remove item from list when deselected.
      }
    } else {
      classes.add('selected')
      if ($.inArray(itemIndex, items) < 0) {
        items.push(itemIndex) // Add selected items to array.
      }
    }
    // Guard on firstTenItems.length: when endAfter is null (stop-rule disabled)
    // the array is empty and would spuriously match an empty items array.
    var isSame = firstTenItems.length > 0 &&
      (firstTenItems.slice().sort().toString() === items.slice().sort().toString()) // compare array of collected items to array of first 10 elements (use slice() to avoid mutating original arrays).
    if (isSame) {
      timerRunning = false // Stop timer
      endFirstLine = 'Yes' // Indicate that the first line was all incorrect
      openIncorrectItemsModal() // Inform user of wrong responses.
    }
  } else if (timeLeft === 0 && extraItems === 0) { // This is for selecting the last letter, and it will be used at the very end.
    if (item.classList.contains('disabled')) { // Shows modal warning user that that item cannot be selected
      modalContent.innerText = 'Please mark the last attempted item and ensure no other items are marked after it.'
      firstModalButton.innerText = 'Okay'
      secondModalButton.classList.add('hidden')
      firstModalButton.style.width = '100%'
      modal.style.display = 'block'
      firstModalButton.onclick = function () {
        modal.style.display = 'none'
      }
    } else {
      for (var cell of gridItems) { // This removes the red border in case another cell was previously selected
        cell.classList.remove('lastSelected')
      }
      item.classList.add('lastSelected')
      lastSelectedIndex = itemIndex // Get index of last selected item.
      complete = 'true'
      finishEarly = 1
      setResult()
      openThankYouModal()
    }
  }
}

// Function to get list of selected items.
function getSelectedItems() {
  var selectedLet = []
  for (var cell of gridItems) {
    if (cell.classList.contains('selected')) { // Loop through all items checking those with the CSS selected class.
      var m = cell.classList.item(1)
      var n = m.slice(4) // Get the number of the selected item.
      var v = arrayValues[n - 1]
      selectedLet.push(v) // Add the item to the array.
    }
  }
  return selectedLet.join(' ') // Convert array to string.
}

// set the results to published
function setResult() {
  // Defensive refresh: endTest() can call us directly before the first timer tick,
  // when selectedItems may still be the empty initializer. Re-read from the DOM.
  if (gridItems) {
    selectedItems = getSelectedItems()
  }
  // Note: lastSelectedIndex is always the 1-based item index (not the choice value)
  // Using parseInt ensures we work with the index directly, avoiding issues with
  // duplicate choice values (e.g., punctuation marks sharing value "0")
  // Validate lastSelectedIndex to prevent NaN from corrupting results
  if (lastSelectedIndex === undefined || isNaN(parseInt(lastSelectedIndex))) {
    lastSelectedIndex = 1
  }
  totalItems = parseInt(lastSelectedIndex)
  if (type === 'reading') { // For reading test.
    punctuationCount = 0 //Reset the current punctuation count
    for (var x = 0; x < totalItems; x++) {
      var textLabel = choices[x].CHOICE_LABEL // Get the label of each item.
      if ($.inArray(textLabel, marks) !== -1) { // Check if the label is a punctuation mark.
        if (textLabel === '.') { // If the label is a full stop increase the count of sentences.
          sentenceCount++
        }
        punctuationCount++ // Count of punctuation marks.
      }
    }
    totalItems = totalItems - punctuationCount // for reading test, subtract number of punctuation marks
  }
  var splitselectedItems = selectedItems.split(' ') // Create array of selected items.
  var incorrectItems = splitselectedItems.length // Number of incorrect items attempted
  arrayValues = choices.map(function (obj) { return obj.CHOICE_VALUE })
  var correctIncorrectArray = arrayValues.slice(0, lastSelectedIndex)
  var notAnsweredItemsArray = arrayValues.slice(totalItems, arrayValues.length)
  if (type === 'reading') {
    correctIncorrectArray = $.grep(correctIncorrectArray, function (value) { return $.inArray(value, punctuationArray) < 0 }) // Correct items without any punctuation marks.
    notAnsweredItemsArray = arrayValues.slice(totalItems + punctuationCount, arrayValues.length)
    notAnsweredItemsArray = $.grep(notAnsweredItemsArray, function (value) { return $.inArray(value, punctuationArray) < 0 })
  }
  var notAnsweredItemsArrayLength = notAnsweredItemsArray.length
  if (notAnsweredItemsArray[notAnsweredItemsArrayLength - 1] == allAnswered) {
    notAnsweredItemsArray.pop() // Remove last item from the array.
  }
  var notAnsweredItemsList = notAnsweredItemsArray.join(' ')
  if (notAnsweredItemsArrayLength === 1 && notAnsweredItemsArray[0] == allAnswered) {
    notAnsweredItemsList = ''
  }
  if (type === 'reading' && notAnsweredItemsArrayLength === punctuationCount) {
    notAnsweredItemsList = ''
  }
  var correctItemsArray = $.grep(correctIncorrectArray, function (value) { return $.inArray(value, splitselectedItems) < 0 })
  var correctItemsList = correctItemsArray.join(' ')
  if (selectedItems.length === 0) {
    incorrectItems = 0
  }
  var correctItems = totalItems - incorrectItems // Number of correct items attempted
  var result = currentAnswer + '|' + complete + '|' + timeRemaining + '|' + totalItems + '|' + incorrectItems + '|' + correctItems + '|' + endFirstLine + '|' + sentenceCount + '|' + correctItemsList + '|' + notAnsweredItemsList + '|' + punctuationCount + getMilestoneMetadataTail()
  if (result != null) {
    if (selectedItems.length === 0) {
      checkAnswer()
    } else {
      // splitselectedItems already contains CHOICE_VALUE strings from getSelectedItems().
      // The previous implementation parseInt'd each value and indexed back into `choices`,
      // which silently corrupted any non-numeric or non-positional choice value (e.g.
      // "word_a", or value "101" at index 5). Pass through directly.
      ans = selectedItems
    }
    setAnswer(ans) // set the field's select_multiple answer (space-separated CHOICE_VALUEs)
  }
  setMetaData(result) // make result accessible as plugin metadata
}

// Creates paging for the reading test.
function pageReading() {
  $.map(gridItems, function (box) {
    var temp1 = parseInt(box.classList.item(1).slice(4)) // Get the item number.
    if (temp1 < parseInt(pageArr[aStart]) || temp1 >= parseInt(pageArr[aEnd])) {
      box.classList.add('hidden') // Hide items greater than current page limits.
    }
    if (temp1 >= parseInt(pageArr[aStart]) && ((temp1 < parseInt(pageArr[aEnd])) || (pageArr[aEnd] === undefined))) {
      box.classList.remove('hidden') // Show items within current page limits
    }
    if (pageArr[aEnd] === undefined) { // If on the last page.
      nextButton.classList.add('hideButton') // Hide next button.
      hideFinishButton() // Show the finish button.
      if (complete === 'true') {
        finishButton.classList.add('hidden')
        // makeActive()
      }
    }
  })
  resizeText()
}

// Incorrect last item modal
function openExtraItemsModal() {
  modalContent.innerHTML = 'Make any corrections now. Tap the <strong>Finished</strong> button when you are finished.'
  firstModalButton.innerText = 'Okay'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
  }
}
// Thank you note modal
function openThankYouModal() {
  modalContent.innerHTML = 'Thank you! You can continue. <br> Tap on Test Complete.' // Text to display on the modal.
  firstModalButton.innerText = 'Done'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
    moveForward()
    secondModalButton.classList.remove('hidden')
    firstModalButton.style.width = '50%'
  }
}
// Modal to prompt user to select the last item.
function openLastItemModal() {
  makeActive()
  // Disable items before the last selected to prevent selecting an earlier item as "last attempted"
  selectedItems = getSelectedItems()
  var selectedItemsArray = selectedItems.split(' ') // Create an array of the selected items.
  // Guard against empty selection - if no items selected, beforeLastClicked would be NaN
  var lastItem = selectedItemsArray[selectedItemsArray.length - 1]
  var beforeLastClicked = (lastItem && !isNaN(parseInt(lastItem))) ? parseInt(lastItem) - 1 : 0
  for (var i = 0; i < beforeLastClicked; i++) {
    var thisBox = gridItems[i]
    if (thisBox) {
      thisBox.classList.add('disabled')
    }
  }
  modalContent.innerText = 'Please tap the last item attempted.'
  firstModalButton.innerText = 'Okay'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
  }
}

function openIncorrectItemsModal() {
  if (strict === 1 && endAfter != null) {
    modalContent.innerText = endAfter + ' wrong answers on row 1.'
    firstModalButton.innerText = 'Okay'
    secondModalButton.classList.add('hidden')
    firstModalButton.style.width = '100%'
    modal.style.display = 'block'
    firstModalButton.onclick = function () {
      finishEarly = 1
      timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
      startStopTimer()
      complete = 'true'
      lastSelectedIndex = endAfter
      setResult()
      moveForward()
      finishButton.classList.add('hidden') // Hide finish button.
      goToNextField(true)
    }
  } else {
    modalContent.innerText = 'End now? ' + endAfter + ' wrong answers on row 1.'
    firstModalButton.innerText = 'Yes'
    secondModalButton.innerText = 'No'
    modal.style.display = 'block'
    firstModalButton.onclick = function () {
      modal.style.display = 'none'
      endEarly()
    }
    secondModalButton.onclick = function () {
      modal.style.display = 'none'
      startStopTimer()
    }
  }
}

function endTest() {
  if (finishParameter === 2) {
    modalContent.innerText = 'Do you want to end the test now?'
    firstModalButton.innerText = 'Yes'
    secondModalButton.innerText = 'No'
    modal.style.display = 'block'
    firstModalButton.onclick = function () {
      finishEarly = 1
      timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
      complete = 'true'
      if (type === 'reading') {
        lastSelectedIndex = choices.length - 1
      } else {
        lastSelectedIndex = choices.length
        if (allAnswered != null) {
          lastSelectedIndex = choices.length - 1
        }
      }
      setResult()
      moveForward()
      finishButton.classList.add('hidden') // Hide finish button.
      goToNextField(true)
    }
    secondModalButton.onclick = function () {
      modal.style.display = 'none'
      startStopTimer() // On cancel, continue the timer.
    }
  } else {
    finishEarly = 1
    timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
    complete = 'true'
    if (type === 'reading') {
      lastSelectedIndex = choices.length - 1
    } else {
      lastSelectedIndex = choices.length
      if (allAnswered != null) {
        lastSelectedIndex = choices.length - 1
      }
    }
    setResult()
    moveForward()
    finishButton.classList.add('hidden') // Hide finish button.
    goToNextField(true)
  }
}

// Modal to confirm finishing a test early.
function finishModal() {
  modalContent.innerText = 'Do you want to end the test now?'
  firstModalButton.innerText = 'Yes'
  secondModalButton.innerText = 'No'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
    // FIX: Set finishEarly = 1 (not 0) to correctly indicate early finish
    // This prevents duplicate modal calls from endTimer()
    finishEarly = 1
    extraItems = 0
    endEarly() // End the timer (calls endTimer which calls moveForward)
    openLastItemModal() // Prompt user to select last item.
    // FIX: Removed duplicate moveForward() call - already called in endTimer()
    finishButton.classList.add('hidden') // Hide finish button.
  }
  secondModalButton.onclick = function () {
    modal.style.display = 'none'
    startStopTimer() // On cancel, continue the timer.
  }
}

function makeActive() {
  $.map(gridItems, function (box) {
    if (!(box.classList.contains('pmBox'))) { // If the item doesn't have the class pmBox (its not a punctuation mark).
      box.addEventListener('click', boxHandler, false) // Make it clickable.
      box.classList.remove('disabled')
    }
  })
}

function makeInActive() {
  $.map(gridItems, function (box) {
    box.removeEventListener('click', boxHandler, false) // Make all buttons unselectable.
    box.classList.add('disabled')
  })
  if (timerRunning) {
    startStopTimer()
  }
}

function hideFinishButton() {
  if (screenSize !== 'small' && (complete === 'true' || complete == null)) {
    finishButton.classList.add('hidden')
  } else {
    finishButton.classList.remove('hidden')
  }
}

function checkAnswer() {
  if (allAnswered != null && allAnswered == choices[choices.length - 1].CHOICE_VALUE) {
    ans = allAnswered
  } else {
    ans = choices[0].CHOICE_VALUE
  }
}

function checkAllAnswered() {
  var choiceListLength
  if (allAnswered != null && allAnswered == choices[choices.length - 1].CHOICE_VALUE) {
    choiceListLength = choices.length - 1
  } else if (allAnswered != null) {
    choiceListLength = choices.length
  } else {
    choiceListLength = choices.length
  }
  return choiceListLength
}

function moveForward() {
  button.innerHTML = 'Test complete'
  button.onclick = function () {
    goToNextField()
  }
}

// SurveyCTO calls this when the user clears the field's answer. Reset all in-memory
// state, the visible UI, and persisted metadata so a fresh start is genuinely fresh.
function clearAnswer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  timerRunning = false
  paused = 0
  timePassed = 0
  timeLeft = timeStart
  complete = 'false'
  finishEarly = 0
  lastSelectedIndex = undefined
  items = []
  selectedItems = ''
  pageNumber = 0
  endFirstLine = 'No'
  sentenceCount = 0
  punctuationCount = 0
  // Reset milestone tracking state
  milestoneData = []
  nextMilestoneIndex = 0
  milestoneSelectionMode = false
  currentMilestoneIndex = -1
  highestInteractedIndex = 0
  // Clear visible state on every grid cell
  if (gridItems) {
    $.map(gridItems, function (box) {
      box.classList.remove('selected')
      box.classList.remove('lastSelected')
      box.classList.remove('milestoneSelected')
      box.classList.remove('disabled')
    })
  }
  // Reset visible chrome
  if (modal) modal.style.display = 'none'
  if (timerDisp) timerDisp.innerHTML = ''
  if (timerDisplay) timerDisplay.classList.add('hidden')
  if (button) {
    button.innerHTML = ''
    button.classList.remove('hidden')
  }
  document.body.classList.remove('milestone-active')
  hideMilestoneToast()
  setAnswer('')
  setMetaData('')
}

// Resize the text to fit the button
function resizeText() {
  gridItems = $.makeArray(document.querySelectorAll('.box')) // Get all grid items - they all have the box class.
  var i // Temporary counter
  var tempItemClass
  var tempLength = gridItems.length
  // Loop through all the buttons
  for (i = 1; i <= tempLength; i++) {
    tempItemClass = '.' + 'item' + i // Get the item (button) class to refer to individual buttons
    $(tempItemClass).textfill({ // Use the textfill.js library to resize the button text.
      widthOnly: true, // Resize only text width
      maxFontPixels: 28 // Set maximum font size
    })
  }
}

function addPagination() {
  if (type !== 'reading') {
    var rowsShown = numberOfRows
    var rowsTotal = $('#gridTable tbody tr').length
    var numPages = Math.ceil(rowsTotal / rowsShown)
    var currPage1 = pageNumber
    var startItem1 = currPage1 * rowsShown
    var endItem1 = startItem1 + rowsShown
    $('#gridTable tbody tr').css('opacity', '0.0').hide().slice(startItem1, endItem1).css('display', 'table-row').animate({ opacity: 1 }, 300)
    checkPage(pageNumber, numPages)
    resizeText()
  }

  $('#nextButton').on('click', function (e) {
    if (type !== 'reading') {
      // Clamp so a rapid double-tap during the .animate() can't push past the last page
      // and leave us on an empty .slice() with both arrows visible.
      pageNumber = Math.min(numPages - 1, pageNumber + 1)
      var currPage = pageNumber
      var startItem = currPage * rowsShown
      var endItem = startItem + rowsShown
      $('#gridTable tbody tr').css('opacity', '0.0').hide().slice(startItem, endItem).css('display', 'table-row').animate({ opacity: 1 }, 300)
      checkPage(pageNumber, numPages)
    } else {
      // Reading mode: pageArr holds the index of the first item on each page.
      // The "last page" is signalled by pageArr[aEnd] === undefined (aEnd === pageArr.length).
      // Don't advance past that — pageReading() hides the next button there, but a rapid
      // tap could still drive aEnd past pageArr.length and corrupt subsequent back-presses.
      if (aEnd < pageArr.length) {
        pageNumber++
        aStart++
        aEnd++
        backButton.classList.remove('hideButton') // Make back button visible on click.
        pageReading()
      }
    }
    resizeText()
  })

  $('#backButton').on('click', function (e) {
    if (type !== 'reading') {
      // Clamp at 0 to prevent negative pageNumber on rapid taps.
      pageNumber = Math.max(0, pageNumber - 1)
      var currPage = pageNumber
      var startItem = currPage * rowsShown
      var endItem = startItem + rowsShown
      $('#gridTable tbody tr').css('opacity', '0.0').hide().slice(startItem, endItem).css('display', 'table-row').animate({ opacity: 1 }, 300)
      checkPage(pageNumber, numPages)
    } else if (aStart > -1) {
      // Reading mode first-page boundary: aStart === -1 represents "before the first
      // page-break index", i.e. we're on page 0. Don't decrement below that.
      pageNumber--
      nextButton.classList.remove('hideButton') // Show the next button.
      finishButton.classList.add('hidden') // Hide the next button.
      aStart--
      aEnd--
      $.map(gridItems, function (box) {
        var temp1 = parseInt(box.classList.item(1).slice(4))
        if (temp1 < parseInt(pageArr[aStart]) || temp1 >= parseInt(pageArr[aEnd])) {
          box.classList.add('hidden')
        }
        if (temp1 >= parseInt(pageArr[aStart]) && ((temp1 < parseInt(pageArr[aEnd])) || (pageArr[aEnd] === undefined))) {
          box.classList.remove('hidden')
        }
        if (pageArr[aStart] === undefined) {
          backButton.classList.add('hideButton')
          if (temp1 >= parseInt(pageArr[0])) {
            box.classList.add('hidden')
          }
          if (temp1 < parseInt(pageArr[0])) {
            box.classList.remove('hidden')
          }
        }
      })
    }
    resizeText()
  })
}

function checkPage(pagNum, numPages) {
  // Handle single-page case first - show Finish, hide navigation
  if (numPages === 1) {
    $('#nextButton').addClass('hideButton')
    $('#backButton').addClass('hideButton')
    $('#finishButton').removeClass('hidden')
  } else if (pagNum === 0) {
    // First page of multi-page grid
    $('#nextButton').removeClass('hideButton')
    $('#backButton').addClass('hideButton')
    $('#finishButton').addClass('hidden')
  } else if (pagNum === numPages - 1) {
    // Last page of multi-page grid
    $('#nextButton').addClass('hideButton')
    $('#backButton').removeClass('hideButton')
    $('#finishButton').removeClass('hidden')
  } else {
    // Middle pages
    $('#nextButton').removeClass('hideButton')
    $('#backButton').removeClass('hideButton')
    $('#finishButton').addClass('hidden')
  }
}

// Detect right-to-left languages
function checkRTL(s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
    rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
    rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');

  return rtlDirCheck.test(s);
}

// ==================== MILESTONE TRACKING FUNCTIONS ====================

// Show a toast notification for flash/auto modes
function showMilestoneToast(message, duration) {
  var toast = document.getElementById('milestoneToast')
  if (!toast) {
    // Create toast element if it doesn't exist
    toast = document.createElement('div')
    toast.id = 'milestoneToast'
    toast.className = 'milestone-toast'
    document.body.appendChild(toast)
  }
  toast.innerText = message
  toast.classList.add('show')
  if (duration > 0) {
    setTimeout(function () {
      toast.classList.remove('show')
    }, duration)
  }
}

// Hide the milestone toast
function hideMilestoneToast() {
  var toast = document.getElementById('milestoneToast')
  if (toast) {
    toast.classList.remove('show')
  }
}

// Flash the screen briefly
function flashScreen(duration) {
  document.body.classList.add('milestone-active')
  setTimeout(function () {
    document.body.classList.remove('milestone-active')
  }, duration || 300)
}

// Get the last item position using multiple heuristics (for auto mode)
// Uses a hybrid approach combining: selections, page position, and time estimation
function getLastItemPosition() {
  var lastSelected = 0
  var lastInteracted = highestInteractedIndex || 0

  // 1. Find highest selected (incorrect) item
  for (var i = 0; i < gridItems.length; i++) {
    var item = gridItems[i]
    // Skip punctuation marks
    if (item.classList.contains('pmBox')) continue
    if (item.classList.contains('selected')) {
      var itemIndex = parseInt(item.classList.item(1).slice(4))
      lastSelected = Math.max(lastSelected, itemIndex)
    }
  }

  // 2. Estimate minimum position based on current page
  // If enumerator has navigated to a page, student has at least reached that point
  var itemsPerPage = numberOfRows * columns
  var minFromPage = 1
  if (type === 'reading' && screenSize === 'small' && pageArr.length > 0) {
    // For reading type, use pageArr which tracks actual page boundaries
    if (pageNumber > 0 && pageArr[pageNumber - 1]) {
      minFromPage = parseInt(pageArr[pageNumber - 1])
    }
  } else if (numberOfRows && columns) {
    // For grid types, calculate based on rows and columns
    minFromPage = (pageNumber * itemsPerPage) + 1
  }

  // 3. Time-based estimation as fallback
  // Conservative estimate: ~0.7 words per second for early grade readers
  // This provides a reasonable floor when no other data is available
  var elapsedSeconds = timePassed / 1000
  var timeEstimate = Math.floor(elapsedSeconds * 0.7)

  // Return the highest of all estimates (minimum of 1)
  var result = Math.max(lastSelected, lastInteracted, minFromPage, timeEstimate, 1)

  // Cap at total number of items (excluding all-answered placeholder)
  var maxItems = checkAllAnswered()
  return Math.min(result, maxItems)
}

// Trigger a milestone capture
function triggerMilestone(milestoneIndex) {
  // Store which milestone we're capturing
  currentMilestoneIndex = milestoneIndex
  nextMilestoneIndex = milestoneIndex + 1 // Move to next milestone

  // Calculate milestone time in seconds for display
  var milestoneSeconds = milestones[milestoneIndex] / 1000

  if (milestoneAlertMode === 'auto') {
    // AUTO MODE: Flash screen, auto-capture based on last marked item, no pause
    flashScreen(500)

    // Get estimate of last position based on selections
    var autoLastIndex = getLastItemPosition()

    // If no items marked, show a brief warning
    if (autoLastIndex <= 1) {
      showMilestoneToast(milestoneSeconds + 's: No items marked - tap last word read', 3000)
      // Fall back to flash mode behavior
      milestoneSelectionMode = true
      currentMilestoneIndex = milestoneIndex
    } else {
      // Auto-save the milestone
      saveMilestoneResult(milestoneIndex, autoLastIndex, true) // true = auto mode (no confirmation modal)
      showMilestoneToast(milestoneSeconds + 's captured (item ' + autoLastIndex + ')', 2000)
    }
  } else if (milestoneAlertMode === 'flash') {
    // FLASH MODE: Flash screen, pause timer, wait for tap (no modal)
    timerRunning = false
    paused = 1

    // Apply visual cue
    if (milestoneVisualCue) {
      document.body.classList.add('milestone-active')
    }

    // Show toast instruction instead of modal
    showMilestoneToast('Tap last word read at ' + milestoneSeconds + 's', 0)

    // Enable milestone selection mode immediately (no modal to dismiss)
    milestoneSelectionMode = true
  } else {
    // MODAL MODE (default): Full modal dialog
    timerRunning = false
    paused = 1

    // Apply visual cue (red background like timeFlash)
    if (milestoneVisualCue) {
      document.body.classList.add('milestone-active')
    }

    // Show modal with instructions
    modalContent.innerHTML = '<strong>' + milestoneSeconds + ' seconds reached!</strong><br><br>' +
      'Tap <strong>OK</strong>, then tap the <strong>last word read</strong> at ' + milestoneSeconds + ' seconds.<br><br>' +
      '<em>The student can continue reading while you do this.</em>'
    firstModalButton.innerText = 'OK'
    secondModalButton.classList.add('hidden')
    firstModalButton.style.width = '100%'
    modal.style.display = 'block'

    firstModalButton.onclick = function () {
      modal.style.display = 'none'
      secondModalButton.classList.remove('hidden')
      firstModalButton.style.width = '50%'
      milestoneSelectionMode = true // Enable milestone selection mode
    }
  }
}

// Save milestone result with computed counts
// skipConfirmation: if true, don't show the confirmation modal (for auto mode)
function saveMilestoneResult(milestoneIndex, milestoneLastIndex, skipConfirmation) {
  var milestoneSeconds = milestones[milestoneIndex] / 1000

  // Calculate total items attempted up to the milestone last index
  var totalItemsAtMilestone = parseInt(milestoneLastIndex)

  // Count punctuation marks up to this point (for reading type)
  var localPunctuationCount = 0
  if (type === 'reading') {
    for (var x = 0; x < totalItemsAtMilestone; x++) {
      var textLabel = choices[x].CHOICE_LABEL
      if ($.inArray(textLabel, marks) !== -1) {
        localPunctuationCount++
      }
    }
    totalItemsAtMilestone = totalItemsAtMilestone - localPunctuationCount
  }

  // Count incorrect items that are within the milestone range
  // We iterate through grid items directly to avoid issues with duplicate values
  var incorrectAtMilestone = 0
  for (var gi = 0; gi < gridItems.length; gi++) {
    var gridItem = gridItems[gi]
    if (gridItem.classList.contains('selected')) {
      // Get the 1-based index from the item class (e.g., "item42" -> 42)
      var itemClass = gridItem.classList.item(1)
      var itemIdx = parseInt(itemClass.slice(4))
      if (itemIdx <= parseInt(milestoneLastIndex)) {
        incorrectAtMilestone++
      }
    }
  }

  var correctAtMilestone = totalItemsAtMilestone - incorrectAtMilestone

  // Store milestone data
  milestoneData.push({
    seconds: milestoneSeconds,
    lastIndex: parseInt(milestoneLastIndex),
    totalItems: totalItemsAtMilestone,
    incorrect: incorrectAtMilestone,
    correct: correctAtMilestone
  })

  // Immediately persist to metadata
  // IMPORTANT: Refresh selectedItems to avoid stale data (timer is paused during milestone mode)
  var freshSelectedItems = getSelectedItems()
  var timeNow = Date.now()
  var progress = String(timeLeft) + ' ' + pageNumber + ' ' + String(timeNow) + ' ' + paused + '|' + freshSelectedItems
  setMetaData(progress + getMilestoneMetadataTail())

  // Hide toast if visible (for flash mode)
  hideMilestoneToast()

  // Skip confirmation modal if requested (auto mode) or using flash mode
  if (skipConfirmation || milestoneAlertMode === 'flash') {
    return
  }

  // Show confirmation modal (modal mode only)
  modalContent.innerHTML = '<strong>Milestone captured!</strong><br><br>' +
    'At ' + milestoneSeconds + ' seconds:<br>' +
    '• Items attempted: ' + totalItemsAtMilestone + '<br>' +
    '• Correct: ' + correctAtMilestone + '<br>' +
    '• Incorrect: ' + incorrectAtMilestone + '<br><br>' +
    '<em>Test will continue now.</em>'
  firstModalButton.innerText = 'Continue'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'

  firstModalButton.onclick = function () {
    modal.style.display = 'none'
    secondModalButton.classList.remove('hidden')
    firstModalButton.style.width = '50%'
  }
}

// Generate milestone metadata tail string
function getMilestoneMetadataTail() {
  var tail = ''
  for (var i = 0; i < milestoneData.length; i++) {
    var ms = milestoneData[i]
    tail += '|' + ms.seconds + '|' + ms.lastIndex + '|' + ms.totalItems + '|' + ms.incorrect + '|' + ms.correct
  }
  return tail
}