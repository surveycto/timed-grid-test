/* global $, fieldProperties, setAnswer, getPluginParameter, getMetaData, setMetaData */

var duration = getPluginParameter('duration')
var endAfter = getPluginParameter('end-after')
var pause = getPluginParameter('pause')
var strict = getPluginParameter('strict')
var type = getPluginParameter('type')
var finishParameter = getPluginParameter('finish')
var allAnswered = getPluginParameter('all-answered')
var numberOfRows = getPluginParameter('page-rows')

var previousMetaData = getMetaData() // Load Metadata.

var choices = fieldProperties.CHOICES // Array of choices.
var complete = 'false' // Keep track of whether the test was completed
var currentAnswer // Keep track of the answer to be recorded.
var timePassed = 0 // Time passed so far.
var timerRunning = false // Track whether the timer is running.
var timeStart // Track time limit on each field in milliseconds.
var timeLeft = timeStart // Starts this way for the display.
var startTime = 0 // This will get an actual value when the timer starts in startStopTimer().
var selectedItems // Track selected (incorrect) items.
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
var punctuationArray = [] // An array of the
var extraItems// track whether to allow selecting items after time has run out.
var isNumber = 1
var rowCount
var prevPaused // Keep track of whether the test was paused when moving to and from the page.
var paused = 0 // keep track of whether the test is paused or not.

var div = document.getElementById('button-holder') // General div to house the grid.
var secondDIV
var screenSize
var pageNumber = 0
var prevPageNumber = 0
var marks = ['.', ',', '!', '?'] // List of punction marks.
var totalItems // Keep track of the total number of items.
// Check if the window size is 550px - this is treated as a small screen.
var x = window.matchMedia('(max-width: 550px)')
myFunction(x)
x.addListener(myFunction)
// end window size check and assignment.

// For testing purposes!
// screenSize = 'small'

// Set parameter default values.
if (duration == null) {
  timeStart = 60000 // Default time limit on each field in milliseconds
} else {
  timeStart = duration * 1000 // Parameterized time limit on each field in milliseconds
}

if (numberOfRows == null) {
  if (type === 'reading') {
    if (screenSize === 'small') {
      numberOfRows = 6 // Default time limit on each field in milliseconds
    }
  } else {
    if (screenSize === 'small') {
      numberOfRows = 4 // Default time limit on each field in milliseconds
    }
  }
} else {
  numberOfRows = parseInt(numberOfRows) // Parameterized time limit on each field in milliseconds
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
  columns = 10 // Number of columns on grid printout (words)
  if (screenSize === 'small') {
    columns = 5
  }
} else if (type === 'numbers') { // Allow user to enter numbers as parameter, but essentially works as words.
  type = 'words'
} else if (type === 'words') {
  columns = 5 // Number of columns on grid printout (words)
  if (screenSize !== 'small') {
    screenSize = 'large' // Screen size determines the CSS to be applied.
  }
} else if (type === 'reading') {
  columns = choices.length // Number of columns on grid printout (words)
  for (var x = 0; x < choices.length; x++) {
    var textLabel = choices[x].CHOICE_LABEL // Get the label of each item.
    if ($.inArray(textLabel, marks) !== -1) { // Check if the label is a punctuation mark.
      punctuationArray.push(choices[x].CHOICE_VALUE)
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

// Set end after default to 10 for letters and 5 for words.
if (endAfter == null && type === 'letters') {
  endAfter = 10
} else if (endAfter == null && type === 'words') {
  endAfter = 5
} else {
  endAfter = parseInt(endAfter)
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
  var previousPunctuationCount = parseInt(previousSelected[11])
  if (type === 'reading') {
    previousTotalItems = parseInt(previousSelected[4]) + parseInt(previousPunctuationCount)
  } else {
    previousTotalItems = previousSelected[4]
  }
  if (complete !== 'true' || complete == null) { // For incomplete test.
    if (!isNaN(parseInt(s1[0]))) {
      timeLeft = parseInt(s1[0]) // Get time left from metadata.
      var timeWhileGone = Date.now() - lastTimeNow
      var leftoverTime = timeLeft - timeWhileGone
      if (prevPaused === 1) {
        leftoverTime = timeLeft
      }
      if (leftoverTime < 0) {
        complete = true
        timeLeft = 0 // Completed test
        timeStart = 0
      } else {
        timeStart = leftoverTime // Start timer from time left.
      }
    }
  } else {
    timeLeft = 0 // For completed test
    finishButton.classList.add('hidden')
  }
  timerRunning = true
  var t = previousSelected[1].split(' ')
  var y
  var q
  var o
  for (q = 0; q < t.length; q++) {
    y = arrayValues.indexOf(t[q]) + 1
    o = o + ' ' + y
  }
  previousSelectedItems = o.split(' ') // Get an array of the previously selected items.
  items = previousSelectedItems.slice(1) // Remove the first item in the array which is undefined.
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
    if (!(box.classList.contains('pmBox'))) { // If the item doesn't have the class pmBox (its not a punctuation mark).
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
  intervalId = setInterval(timer, 10) // Start the timer.
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
var topTen = noPunctuationsArray.slice(0, endAfter) // Keep track of how many consecutive items can be selected before ending the test.
var firstTenItems = [] // Array of first items from choices.
for (x = 0; x < topTen.length; x++) {
  firstTenItems.push(noPunctuationsArray[x]) // Get the values of the first x items and put them in the array.
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

$('#gridTable td:first-child').each(function () {
  var tempSelected = [] // store selected items before highlighting row
  var tempSelected1 = []
  var clickCount = 1 // count the number of clicks
  $(this).on('click', function () {
    var clickedElement = $(this)
    var rowIndex = $(this).parent().parent().children().index($(this).parent()) + 1
    if (clickCount === 1) {
      firstClick(clickedElement)
      clickCount = 2
    } else if (clickCount === 2) {
      $(this).siblings().each(function () {
        if ($(this).hasClass('selected')) {
          var temp2 = $(this).text()
          tempSelected.push(temp2)
        }
      })
      if (type === 'letters' && screenSize === 'small') {
        $(this).closest('tr').next('tr').children().each(function () {
          if ($(this).hasClass('selected')) {
            var temp2 = $(this).text()
            tempSelected1.push(temp2)
          }
        })
      }
      secondClick(clickedElement, rowIndex)
      clickCount = 3
    } else if (clickCount === 3) {
      thirdClick(clickedElement, tempSelected, tempSelected1)
      clickCount = 1
      tempSelected = []
      tempSelected1 = []
    }
  })
})

if ((previousMetaData == null) || (s1[0] === 'undefined') || (complete === 'true')) { // The second check is to see if the timer had actually been started or not
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

function myFunction (x) {
  if (x.matches) {
    screenSize = 'small'
  }
}
// var choicesLength = checkAllAnswered()
// Function to create the grid. Takes a list of choices.
function createGrid (keys) {
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
        table += '<td class="count">' + '(' + i + ')' + '</td>'
      } else if (i % 2 === 1 && type === 'letters' && screenSize === 'small') {
        m = m + 1
        table += '<td rowspan="2" class="count">' + '(' + m + ')' + '</td>'
      }
      for (var j = 1; j <= columns; j++) {
        if (i === 0) {
          var h = ' id = head' + j
          var hId = '<th' + h + '></th>'
          table += hId
        } else {
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
      }
      table += '</tr>'
      if (i === 0) {
        table += '</thead>'
      }
    }
    table += '</table>'
    div.innerHTML = table // Add the row to main container.
  }
  if (isNumber === 2) {
    div.classList.add('pgNumber')
  }
  return true
}

function passagePaging (pageArray, isPage) {
  if (isPage) {
    $.map(gridItems, function (box) {
      var temp1 = parseInt(box.classList.item(1).slice(4))
      if (temp1 >= parseInt(pageArray[0])) {
        box.classList.add('hidden')
      }
    })
  }
}

// Click events for the row labels
function firstClick (clickedElement) {
  clickedElement.text('(?)') // Show question mark on first click.
}
var rowCounter = 0
var tempRows = Math.ceil(rowCount / columns)
function secondClick (clickedElement, rowNumber) {
  for (var i = 1; i < tempRows; i + 2) {
    if (rowNumber === i) {
      rowNumber = rowNumber - rowCounter
    }
    i = i + 2
    rowCounter++
  }
  clickedElement.text('(' + rowNumber + ')') // Replace question mark with row number on second click.
  clickedElement.siblings().addClass('selected')
  if (type === 'letters' && screenSize === 'small') {
    clickedElement.closest('tr').next('tr').children().addClass('selected')
  }
  rowCounter = 0
}

function thirdClick (clickedElement, row, row1) {
  clickedElement.siblings().each(function () {
    if ($.inArray($(this).text(), row) < 0) {
      $(this).removeClass('selected')
    }
  })
  if (type === 'letters' && screenSize === 'small') {
    clickedElement.closest('tr').next('tr').children().each(function () {
      if ($.inArray($(this).text(), row1) < 0) {
        $(this).removeClass('selected')
      }
    })
  }
}

function timer () { // Timer function.
  var timeNow = Date.now() // Set the time to current time.
  if (timerRunning) { // For a running timer.
    timePassed = timeNow - startTime
    timeLeft = timeStart - timePassed
  }
  selectedItems = getSelectedItems()
  if (complete !== 'true') { // For incomplete tests.
    currentAnswer = String(timeLeft) + ' ' + pageNumber + ' ' + String(timeNow) + ' ' + paused + '|' + selectedItems // Save progress whilst the timer is running.
    setMetaData(currentAnswer)
  }
  if (timeLeft <= 0) {
    endTimer() // End test if time is less than 0.
  }
  if (!isNaN(timeLeft)) {
    timerDisp.innerHTML = Math.ceil(timeLeft / 1000) // display the countdown timer.
  }
}

// Function to facilitate pausing and resuming tests.
function startStopTimer () {
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

function endEarly () {
  timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
  endTimer() // End the test.
}

// Ending the test.
function endTimer () {
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

function itemClicked (item, itemIndex) {
  if (timerRunning || (timeLeft === 0 && strict === 0 && extraItems === 1)) { // This way, it only works when the timer is running
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
    var isSame = (firstTenItems.sort().toString() === items.sort().toString()) // compare array of collected items to array of first 10 elements.
    if (isSame) {
      timerRunning = false // Stop timer
      endFirstLine = 'Yes' // Indicate that the first line was all incorrect
      openIncorrectItemsModal() // Inform user of wrong responses.
    }
  } else if (timeLeft === 0 && extraItems === 0) { // This is for selecting the last letter, and it will be used at the very end.
    if (item.classList.contains('disabled')) { // Shows modal warning user that that item cannot be selected
      modalContent.innerText = 'Either pick the last incorrect item, or one after that.'
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
      lastSelectedIndex = itemIndex // Get index of last selected item
      // checkLastItem() // Check that the selected last item is not before the last clicked item as part of the test.
      complete = 'true'
      finishEarly = 1
      setResult()
      openThankYouModal()
    }
  }
}

// Function to get list of selected items.
function getSelectedItems () {
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

function clearAnswer () {
  // setAnswer()
  timePassed = 0
}

// set the results to published
function setResult () {
  if (finishEarly === 0) {
    totalItems = choices.map(function (o) { return o.CHOICE_VALUE }).indexOf(lastSelectedIndex) + 1 // total number of items attempted
  } else {
    totalItems = lastSelectedIndex // total items are all the items.
  }
  if (type === 'reading') { // For reading test.
    for (var x = 0; x < totalItems; x++) {
      var textLabel = choices[x].CHOICE_LABEL // Get the label of each item.
      if ($.inArray(textLabel, marks) !== -1) { // Check if the label is a punctuation mark.
        if (textLabel === '.') { // If the label is a full stop increase the count of sentences.
          sentenceCount++
        }
        punctuationCount++ // Count of puntuation marks.
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
  var result = currentAnswer + '|' + complete + '|' + timeRemaining + '|' + totalItems + '|' + incorrectItems + '|' + correctItems + '|' + endFirstLine + '|' + sentenceCount + '|' + correctItemsList + '|' + notAnsweredItemsList + '|' + punctuationCount
  if (result != null) {
    var finalAnswer = []
    if (selectedItems.length === 0) {
      checkAnswer()
    } else {
      for (var i = 0; i < splitselectedItems.length; i++) {
        var position = parseInt(splitselectedItems[i]) - 1
        var choiceValue = choices[position].CHOICE_VALUE
        finalAnswer.push(choiceValue)
      }
      ans = finalAnswer.join(' ')
    }
    setAnswer(ans) // set answer to dummy result
  }
  setMetaData(result) // make result accessible as plugin metadata
}

// Creates paging for the reading test.
function pageReading () {
  $.map(gridItems, function (box) {
    var temp1 = parseInt(box.classList.item(1).slice(4)) // Get the item number.
    if (temp1 < parseInt(pageArr[aStart]) || temp1 >= parseInt(pageArr[aEnd])) {
      box.classList.add('hidden') // Hide items greater than current page limits.
    }
    if (temp1 >= parseInt(pageArr[aStart]) && ((temp1 < parseInt(pageArr[aEnd])) || (pageArr[aEnd] === undefined))) {
      box.classList.remove('hidden') // Show items within current page limits
    }
    if (pageArr[aEnd] === undefined) { // If on the last page.
      nextButton.classList.add('hideButton') // Hide nex button.
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
function openExtraItemsModal () {
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
function openThankYouModal () {
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
function openLastItemModal () {
  makeActive()
  // DISABLE HERE
  selectedItems = getSelectedItems()
  var selectedItemsArray = selectedItems.split(' ') // Create an array of the selected items.
  var beforeLastClicked = selectedItemsArray[selectedItemsArray.length - 1] - 1 // Item before last clicked
  for (var i = 0; i < beforeLastClicked; i++) {
    var thisBox = gridItems[i]
    thisBox.classList.add('disabled')
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

function openIncorrectItemsModal () {
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
      complete = true
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

function endTest () {
  if (finishParameter === 2) {
    modalContent.innerText = 'Do you want to end the test now?'
    firstModalButton.innerText = 'Yes'
    secondModalButton.innerText = 'No'
    modal.style.display = 'block'
    firstModalButton.onclick = function () {
      finishEarly = 1
      timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
      complete = true
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
    complete = true
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
function finishModal () {
  modalContent.innerText = 'Do you want to end the test now?'
  firstModalButton.innerText = 'Yes'
  secondModalButton.innerText = 'No'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
    finishEarly = 0 // Mark the test as finishing early.
    extraItems = 0
    endEarly() // Pause the timer.
    openLastItemModal() // Prompt user to select last item.
    moveForward()
    finishButton.classList.add('hidden') // Hide finish button.
  }
  secondModalButton.onclick = function () {
    modal.style.display = 'none'
    startStopTimer() // On cancel, continue the timer.
  }
}

function makeActive () {
  $.map(gridItems, function (box) {
    if (!(box.classList.contains('pmBox'))) { // If the item doesn't have the class pmBox (its not a punctuation mark).
      box.addEventListener('click', boxHandler, false) // Make it clickable.
      box.classList.remove('disabled')
    }
  })
}

function makeInActive () {
  $.map(gridItems, function (box) {
    box.removeEventListener('click', boxHandler, false) // Make all buttons unselectable.
    box.classList.add('disabled')
  })
  if (timerRunning) {
    startStopTimer()
  }
}

function hideFinishButton () {
  if (screenSize !== 'small' && (complete === 'true' || complete == null)) {
    finishButton.classList.add('hidden')
  } else {
    finishButton.classList.remove('hidden')
  }
}

function checkAnswer () {
  if (allAnswered != null && allAnswered == choices[choices.length - 1].CHOICE_VALUE) {
    ans = allAnswered
  } else {
    ans = choices[0].CHOICE_VALUE
  }
}

function checkAllAnswered () {
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

function moveForward () {
  button.innerHTML = 'Test complete'
  button.onclick = function () {
    goToNextField()
  }
}

// Resize the text to fit the button
function resizeText () {
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

function addPagination () {
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
    pageNumber++
    if (type !== 'reading') {
      var currPage = pageNumber
      var startItem = currPage * rowsShown
      var endItem = startItem + rowsShown
      $('#gridTable tbody tr').css('opacity', '0.0').hide().slice(startItem, endItem).css('display', 'table-row').animate({ opacity: 1 }, 300)
      checkPage(pageNumber, numPages)
    } else {
      backButton.classList.remove('hideButton') // Make back button visible on click.
      aStart++
      aEnd++
      pageReading()
    }
    resizeText()
  })

  $('#backButton').on('click', function (e) {
    pageNumber--
    if (type !== 'reading') {
      var currPage = pageNumber
      var startItem = currPage * rowsShown
      var endItem = startItem + rowsShown
      $('#gridTable tbody tr').css('opacity', '0.0').hide().slice(startItem, endItem).css('display', 'table-row').animate({ opacity: 1 }, 300)
      checkPage(pageNumber, numPages)
    } else {
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

function checkPage (pagNum, numPages) {
  if (pagNum === 0) {
    $('#nextButton').removeClass('hideButton')
    $('#backButton').addClass('hideButton')
    $('#finishButton').addClass('hidden')
  } else if (pagNum === numPages - 1) {
    $('#nextButton').addClass('hideButton')
    $('#backButton').removeClass('hideButton')
    $('#finishButton').removeClass('hidden')
  } else {
    $('#nextButton').removeClass('hideButton')
    $('#backButton').removeClass('hideButton')
    $('#finishButton').addClass('hidden')
  }
}
