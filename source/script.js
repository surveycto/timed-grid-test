/* global $, fieldProperties, setAnswer, getPluginParameter, getMetaData, setMetaData */

var continuity = getPluginParameter('continuity')
var duration = getPluginParameter('duration')
var endAfter = getPluginParameter('end-after')
var pause = getPluginParameter('pause')
var strict = getPluginParameter('strict')
var type = getPluginParameter('type')
var allAnswered = getPluginParameter('all-answered')

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
var previousSelectedItems // Stores an array of previously selected values.
var previousTotalItems // Store the last selected item
var aStart = -1 // Counter for paging for reading test.
var aEnd = 0 // Counter for paging for reading test.

var timerDisp = document.querySelector('#timer') // Span displaying the actual timer.
var backButton = document.getElementById('backButton') // back button for navigation
var button = document.querySelector('#startstop') // Button to start, stop, pause and resume test.
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

// Set parameter default values.
if (duration == null) {
  timeStart = 60000 // Default time limit on each field in milliseconds
} else {
  timeStart = duration * 1000 // Parameterized time limit on each field in milliseconds
}

if (continuity == null) {
  continuity = 0 // Default continuity set to false.
} else {
  continuity = parseInt(continuity) // Parameterized continuity set to value entered.
}

if (pause == null) {
  pause = 0 // Default pause set to false.
} else {
  pause = parseInt(pause) // Parameterized pause set to value entered.
}

if (strict == null) {
  strict = 0 // Default strict set to false.
  extraItems = 1
} else {
  strict = parseInt(strict) // Parameterized strict set to value entered.
  extraItems = 0
}

if (type === 'letters') {
  columns = 10 // Number of columns on grid printout (words)
  if (screenSize !== 'small') {
    screenSize = 'medium'
  }
}

if (type === 'numbers') { // Allow user to enter numbers as parameter, but essentially works as words.
  type = 'words'
}

if (type === 'words') {
  columns = 5 // Number of columns on grid printout (words)
  if (screenSize !== 'small') {
    screenSize = 'large' // Screen size determines the CSS to be applied.
  }
}

if (type === 'reading') {
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
}

if (type === 'arithmetic') {
  columns = 2
  isNumber = 2
  type = 'reading'
}

// Set end after default to 10 for letters and 5 for words.
if (endAfter == null && columns === 10) {
  endAfter = 10
} else if (endAfter == null && columns === 5) {
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
  previousSelectedItems = previousSelected[1].split(' ') // Get list of items that had been selected before leaving the page.
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

// Once the grid is created.
if (createGrid) {
  var gridItems = $.makeArray(document.querySelectorAll('.box')) // Get all grid items - they all have the box class.
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
  updateGrid() // Draw grid based on selections and paging done so far.
  if (complete === 'true') {
    finishButton.classList.add('hidden')
    makeInActive()
  }
  setInterval(timer, 1) // Start the timer.
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
        button.innerHTML = 'Start'
        if (screenSize !== 'small') {
          finishButton.classList.remove('hidden')
        }
      } else {
        button.innerHTML = 'Test complete'
        button.disabled = true
      }
    }
  }
}

// For reading test.
var pageArr = [] // Keep track of items on each page.
var shouldPage = false // Whether to add another page on a small screen.

$(document).ready(function () {
  if (type === 'reading' && screenSize === 'small') { // For reading test on a small screen.
    nextButton.classList.remove('hideButton') // hide next button.
    $('.box').each(function () { // for each item in the grid.
      var div1 = $(this)
      var left = div1.position().left // Get the left position.
      if (left <= minLeft || minLeft == null) { // Check whether its the leftmost item.
        rowPos++ // Create a new row if it is the leftmost item.
        if (rowPos >= 6) { // Check the number of rows so far.
          shouldPage = true // Add paging if more than 6 rows.
        }
        if (rowPos % 7 === 0) { // Create a new page every 6 rows.
          var temp = div1[0].classList.item(1).slice(4)
          pageArr.push(temp)
        }
        minLeft = left
      }
    })
    passagePaging(pageArr, shouldPage) // Create passage.
    // Manages paging for a grid test in progress.
    if (previousMetaData != null) {
      if (prevPageNumber > 0) {
        backButton.classList.remove('hideButton') // show back button for more than one page
      }
      if (prevPageNumber === 1) {
        aStart = 0
        aEnd = 1
        pageReading()
      } else if (prevPageNumber === 2) {
        aStart = 1
        aEnd = 2
        pageReading()
      } else if (prevPageNumber === 3) {
        aStart = 2
        aEnd = 3
        pageReading()
      } else if (prevPageNumber === 4) {
        aStart = 3
        aEnd = 4
        pageReading()
      } else if (prevPageNumber === 5) {
        aStart = 4
        aEnd = 5
        pageReading()
      }
    }
  }
})

var topTen = choices.slice(0, endAfter) // Keep track of how many consecutive items can be selected before ending the test.
var firstTenItems = [] // Array of first items from choices.

for (x = 0; x < topTen.length; x++) {
  firstTenItems.push(choices[x].CHOICE_VALUE) // Get the values of the first x items and put them in the array.
}

var itemCounter = 0 // Count the number of items.
var items = [] // Array to keep the selected items.

// get next button and bind click event handler
document.querySelector('.next').addEventListener('click', function () {
  ++pageNumber
  backButton.classList.remove('hideButton') // Make back button visible on click.

  var fieldset1 = document.querySelector('#fieldset1')
  var fieldset2 = document.querySelector('#fieldset2')
  var fieldset3 = document.querySelector('#fieldset3')
  var fieldset4 = document.querySelector('#fieldset4')
  var fieldset5 = document.querySelector('#fieldset5')
  var fieldset6 = document.querySelector('#fieldset6')
  var fieldset7 = document.querySelector('#fieldset7')
  var fieldset8 = document.querySelector('#fieldset8')
  var fieldset9 = document.querySelector('#fieldset9')
  var fieldset10 = document.querySelector('#fieldset10')

  /*  For each test, show and hide rows on button click using CSS classes. Continuity allows the last row on a page
      to become the first row on the next page */

  // Letters test on small screen with no continuity.
  if (type === 'letters' && screenSize === 'small' && continuity === 0) {
    if (!fieldset1.classList.contains('hidden')) {
      fieldset1.classList.add('hidden')
      fieldset2.classList.add('hidden')
      fieldset3.classList.remove('hidden')
      fieldset4.classList.remove('hidden')
    } else if (!fieldset3.classList.contains('hidden')) {
      fieldset3.classList.add('hidden')
      fieldset4.classList.add('hidden')
      fieldset5.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset5.classList.add('hidden')
      fieldset6.classList.add('hidden')
      fieldset7.classList.remove('hidden')
      fieldset8.classList.remove('hidden')
    } else if (!fieldset7.classList.contains('hidden')) {
      fieldset7.classList.add('hidden')
      fieldset8.classList.add('hidden')
      fieldset9.classList.remove('hidden')
      fieldset10.classList.remove('hidden')
      nextButton.classList.add('hideButton')
      hideFinishButton()
    }
  }
  // Letters test on small screen with continuity.
  if (type === 'letters' && screenSize === 'small' && continuity === 1) {
    if (!fieldset1.classList.contains('hidden')) {
      fieldset1.classList.add('hidden')
      fieldset2.classList.remove('hidden')
      fieldset3.classList.remove('hidden')
    } else if (!fieldset2.classList.contains('hidden')) {
      fieldset2.classList.add('hidden')
      fieldset3.classList.remove('hidden')
      fieldset4.classList.remove('hidden')
    } else if (!fieldset3.classList.contains('hidden')) {
      fieldset3.classList.add('hidden')
      fieldset4.classList.remove('hidden')
      fieldset5.classList.remove('hidden')
    } else if (!fieldset4.classList.contains('hidden')) {
      fieldset4.classList.add('hidden')
      fieldset5.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset5.classList.add('hidden')
      fieldset6.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
    } else if (!fieldset6.classList.contains('hidden')) {
      fieldset6.classList.add('hidden')
      fieldset7.classList.remove('hidden')
      fieldset8.classList.remove('hidden')
    } else if (!fieldset7.classList.contains('hidden')) {
      fieldset7.classList.add('hidden')
      fieldset8.classList.remove('hidden')
      fieldset9.classList.remove('hidden')
    } else if (!fieldset8.classList.contains('hidden')) {
      fieldset8.classList.add('hidden')
      fieldset9.classList.remove('hidden')
      fieldset10.classList.remove('hidden')
      nextButton.classList.add('hideButton')
      hideFinishButton()
    }
  }
  // Words test on small screen with no continuity.
  if (type === 'words' && screenSize === 'small' && continuity === 0) {
    if (!fieldset1.classList.contains('hidden')) {
      fieldset1.classList.add('hidden')
      fieldset2.classList.add('hidden')
      fieldset3.classList.add('hidden')
      fieldset4.classList.add('hidden')
      fieldset5.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
      fieldset8.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset5.classList.add('hidden')
      fieldset6.classList.add('hidden')
      fieldset7.classList.add('hidden')
      fieldset8.classList.add('hidden')
      fieldset9.classList.remove('hidden')
      fieldset10.classList.remove('hidden')
      nextButton.classList.add('hideButton')
      hideFinishButton()
    }
  }
  // Letters test on small screen with continuity.
  if (type === 'words' && screenSize === 'small' && continuity === 1) {
    if (!fieldset1.classList.contains('hidden')) {
      fieldset1.classList.add('hidden')
      fieldset2.classList.add('hidden')
      fieldset3.classList.add('hidden')
      fieldset5.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
    } else if (!fieldset4.classList.contains('hidden')) {
      fieldset4.classList.add('hidden')
      fieldset5.classList.add('hidden')
      fieldset6.classList.add('hidden')
      fieldset8.classList.remove('hidden')
      fieldset9.classList.remove('hidden')
      fieldset10.classList.remove('hidden')
      nextButton.classList.add('hideButton')
      hideFinishButton()
    }
  }
  // Reading test on small screen.
  if (type === 'reading' && screenSize === 'small') {
    // Increment page counters.
    aStart++
    aEnd++
    pageReading()
  }
})

// get back button and bind click event handler
document.querySelector('.back').addEventListener('click', function () {
  nextButton.classList.remove('hideButton') // Show the next button.
  finishButton.classList.add('hidden') // Hide the next button.
  --pageNumber
  var fieldset1 = document.querySelector('#fieldset1')
  var fieldset2 = document.querySelector('#fieldset2')
  var fieldset3 = document.querySelector('#fieldset3')
  var fieldset4 = document.querySelector('#fieldset4')
  var fieldset5 = document.querySelector('#fieldset5')
  var fieldset6 = document.querySelector('#fieldset6')
  var fieldset7 = document.querySelector('#fieldset7')
  var fieldset8 = document.querySelector('#fieldset8')
  var fieldset9 = document.querySelector('#fieldset9')
  var fieldset10 = document.querySelector('#fieldset10')

  if (type === 'letters' && continuity === 0) {
    if (!fieldset10.classList.contains('hidden')) {
      fieldset10.classList.add('hidden')
      fieldset9.classList.add('hidden')
      fieldset8.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
    } else if (!fieldset7.classList.contains('hidden')) {
      fieldset8.classList.add('hidden')
      fieldset7.classList.add('hidden')
      fieldset6.classList.remove('hidden')
      fieldset5.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset6.classList.add('hidden')
      fieldset5.classList.add('hidden')
      fieldset4.classList.remove('hidden')
      fieldset3.classList.remove('hidden')
    } else if (!fieldset3.classList.contains('hidden')) {
      fieldset4.classList.add('hidden')
      fieldset3.classList.add('hidden')
      fieldset2.classList.remove('hidden')
      fieldset1.classList.remove('hidden')
      backButton.classList.add('hideButton')
    }
  }

  if (type === 'letters' && continuity === 1) {
    if (!fieldset10.classList.contains('hidden')) {
      fieldset10.classList.add('hidden')
      fieldset9.classList.remove('hidden')
      fieldset8.classList.remove('hidden')
    } else if (!fieldset9.classList.contains('hidden')) {
      fieldset9.classList.add('hidden')
      fieldset8.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
    } else if (!fieldset8.classList.contains('hidden')) {
      fieldset8.classList.add('hidden')
      fieldset7.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
    } else if (!fieldset7.classList.contains('hidden')) {
      fieldset7.classList.add('hidden')
      fieldset6.classList.remove('hidden')
      fieldset5.classList.remove('hidden')
    } else if (!fieldset6.classList.contains('hidden')) {
      fieldset6.classList.add('hidden')
      fieldset5.classList.remove('hidden')
      fieldset4.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset5.classList.add('hidden')
      fieldset4.classList.remove('hidden')
      fieldset3.classList.remove('hidden')
    } else if (!fieldset4.classList.contains('hidden')) {
      fieldset4.classList.add('hidden')
      fieldset3.classList.remove('hidden')
      fieldset2.classList.remove('hidden')
    } else if (!fieldset3.classList.contains('hidden')) {
      fieldset3.classList.add('hidden')
      fieldset2.classList.remove('hidden')
      fieldset1.classList.remove('hidden')
      backButton.classList.add('hideButton')
    }
  }

  if (type === 'words' && screenSize === 'small' && continuity === 0) {
    if (!fieldset10.classList.contains('hidden')) {
      fieldset10.classList.add('hidden')
      fieldset9.classList.add('hidden')
      fieldset8.classList.remove('hidden')
      fieldset7.classList.remove('hidden')
      fieldset6.classList.remove('hidden')
      fieldset5.classList.remove('hidden')
    } else if (!fieldset5.classList.contains('hidden')) {
      fieldset8.classList.add('hidden')
      fieldset7.classList.add('hidden')
      fieldset6.classList.add('hidden')
      fieldset5.classList.add('hidden')
      fieldset4.classList.remove('hidden')
      fieldset3.classList.remove('hidden')
      fieldset2.classList.remove('hidden')
      fieldset1.classList.remove('hidden')
      backButton.classList.add('hideButton')
    }
  }

  if (type === 'words' && screenSize === 'small' && continuity === 1) {
    if (!fieldset10.classList.contains('hidden')) {
      fieldset10.classList.add('hidden')
      fieldset9.classList.add('hidden')
      fieldset8.classList.add('hidden')
      fieldset6.classList.remove('hidden')
      fieldset5.classList.remove('hidden')
      fieldset4.classList.remove('hidden')
    } else if (!fieldset7.classList.contains('hidden')) {
      fieldset7.classList.add('hidden')
      fieldset6.classList.add('hidden')
      fieldset5.classList.add('hidden')
      fieldset3.classList.remove('hidden')
      fieldset2.classList.remove('hidden')
      fieldset1.classList.remove('hidden')
      backButton.classList.add('hideButton')
    }
  }

  if (type === 'reading' && screenSize === 'small') {
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
})

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = 'none'
  }
}

// Finish early
$('#finishButton').click(function () {
  if (timerRunning) {
    startStopTimer() // Pause the timer.
    finishModal() // open finish modal
  }
})

var counter1 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend1').click(function () {
  var clickedElement = $(this)
  if (counter1 === 0) {
    firstClick(clickedElement)
  } else if (counter1 === 1) {
    secondClick(clickedElement, 1)
    openIncorrectItemsModal()
  } else if (counter1 === 2) {
    thirdClick(clickedElement, 1)
    counter1 = -1
  }
  counter1++
})

var counter2 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend2').click(function () {
  var clickedElement = $(this)
  if (counter2 === 0) {
    firstClick(clickedElement)
  } else if (counter2 === 1) {
    secondClick(clickedElement, 2)
  } else if (counter2 === 2) {
    thirdClick(clickedElement, 2)
    counter2 = -1
  }
  counter2++
})
var counter3 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend3').click(function () {
  var clickedElement = $(this)
  if (counter3 === 0) {
    firstClick(clickedElement)
  } else if (counter3 === 1) {
    secondClick(clickedElement, 3)
  } else if (counter3 === 2) {
    thirdClick(clickedElement, 3)
    counter3 = -1
  }
  counter3++
})
var counter4 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend4').click(function () {
  var clickedElement = $(this)
  if (counter4 === 0) {
    firstClick(clickedElement)
  } else if (counter4 === 1) {
    secondClick(clickedElement, 4)
  } else if (counter4 === 2) {
    thirdClick(clickedElement, 4)
    counter4 = -1
  }
  counter4++
})
var counter5 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend5').click(function () {
  var clickedElement = $(this)
  if (counter5 === 0) {
    firstClick(clickedElement)
  } else if (counter5 === 1) {
    secondClick(clickedElement, 5)
  } else if (counter5 === 2) {
    thirdClick(clickedElement, 5)
    counter5 = -1
  }
  counter5++
})
var counter6 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend6').click(function () {
  var clickedElement = $(this)
  if (counter6 === 0) {
    firstClick(clickedElement)
  } else if (counter6 === 1) {
    secondClick(clickedElement, 6)
  } else if (counter6 === 2) {
    thirdClick(clickedElement, 6)
    counter6 = -1
  }
  counter6++
})
var counter7 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend7').click(function () {
  var clickedElement = $(this)
  if (counter7 === 0) {
    firstClick(clickedElement)
  } else if (counter7 === 1) {
    secondClick(clickedElement, 7)
  } else if (counter7 === 2) {
    thirdClick(clickedElement, 7)
    counter7 = -1
  }
  counter7++
})
var counter8 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend8').click(function () {
  var clickedElement = $(this)
  if (counter8 === 0) {
    firstClick(clickedElement)
  } else if (counter8 === 1) {
    secondClick(clickedElement, 8)
  } else if (counter8 === 2) {
    thirdClick(clickedElement, 8)
    counter8 = -1
  }
  counter8++
})
var counter9 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend9').click(function () {
  var clickedElement = $(this)
  if (counter9 === 0) {
    firstClick(clickedElement)
  } else if (counter9 === 1) {
    secondClick(clickedElement, 9)
  } else if (counter9 === 2) {
    thirdClick(clickedElement, 9)
    counter9 = -1
  }
  counter9++
})

var counter10 = 0
// Add click event to row numbers and allow selecting of the whole row
$('#legend10').click(function () {
  var clickedElement = $(this)
  if (counter10 === 0) {
    firstClick(clickedElement)
  } else if (counter10 === 1) {
    secondClick(clickedElement, 10)
  } else if (counter10 === 2) {
    thirdClick(clickedElement, 10)
    counter10 = -1
  }
  counter10++
})

function myFunction (x) {
  if (x.matches) {
    screenSize = 'small'
  }
}
// Function to create the grid. Takes a list of choices.
function createGrid (keys) {
  var counter = 0 // Keep track of which choice is being referenced.
  var fieldsetClass
  var rowCount
  if (allAnswered != null) {
    rowCount = keys.length - 1
  } else {
    rowCount = keys.length
  }
  // Loop through list of choices.
  for (var i = 0; i < rowCount / columns; i++) {
    var fieldset = document.createElement('section') // Creates a section element. Each section is the equivalent of a row.
    var tracker = i + 1 // tracker used for numbering the sections.
    if (type !== 'reading') { // applies to letter and word tests.
      var legend = document.createElement('h1') // Create h1 element to label the row.
      var legendId = 'legend' + tracker // Create and id for the legend based on the section number (tracker).
      legend.setAttribute('id', legendId) // Sets the id for the legend.
      var text1 = '(' + tracker + ')' // Add the row number.
      var legendText = document.createTextNode(text1) // Create text element for the row number.
      legend.appendChild(legendText) // Add the text to the legend.
      fieldset.appendChild(legend) // Add the legend to the fieldset.
      var fieldsetId = 'fieldset' + tracker // Create id for the section.
      if (screenSize === 'small' && type === 'letters') { // for small screens and the letter test.
        fieldsetClass = 'sm' + tracker // CSS class to be applied.
        if (tracker > 2) { // checker whether there are two rows displayed already.
          fieldset.classList.add('hidden') // Hide all other rows except the first two.
        }
      } else if (screenSize === 'small' && type === 'words') { // for small screen and the words test.
        fieldsetClass = 'lg' + tracker // CSS class to be applied.
        if (tracker > 4) { // check whether there are four rows displayed.
          fieldset.classList.add('hidden') // Hide all other rows except the first four.
          nextButton.classList.remove('hideButton') // hide next button.
          finishButton.classList.add('hidden')
        } else {
          nextButton.classList.add('hideButton') // hide next button.
          finishButton.classList.remove('hidden')
        }
      } else if (screenSize === 'medium') { // this is really a large screen for the words test *NEED TO RENAME THIS*
        fieldsetClass = 'ms' + tracker // CSS class to be applied.
        nextButton.classList.add('hideButton') // Hide the next button.
        finishButton.classList.remove('hidden') // Show the finish button.
      } else if (screenSize === 'large') { // this is for a large screen.
        fieldsetClass = 'lg' + tracker // CSS class to be applied.
        nextButton.classList.add('hideButton') // Hide the next button.
        finishButton.classList.remove('hidden') // Show the finish button.
      }
      fieldset.setAttribute('id', fieldsetId) // Create id for the section.
      fieldset.classList.add(fieldsetClass, 'fieldset') // Add the fieldset CSS class to the section.
    } else {
      if (isNumber === 2) {
        // fieldset.classList.add('pgNumber')
      } else {
        fieldset.classList.add('pg') // Add the pg CSS class to the section for reading test on large screen.
      }
      if (screenSize !== 'small') {
        finishButton.classList.remove('hidden') // Show the button.
      }
    }
    for (var j = 0; j < columns; j++) { // Create the individual boxes in each row/screen.
      if (counter !== checkAllAnswered()) {
        secondDIV = document.createElement('div') // Create the div element.
        var text = document.createTextNode(choices[counter].CHOICE_LABEL) // Get the label of the text.
        var itemValue = counter + 1 // Start numbering the items at 1 instead of 0.
        var itemClass = 'item' + itemValue // CSS class to be applied.
        secondDIV.classList.add('box', itemClass) // Add CSS class.
        if (type === 'reading') { // for the reading test.
          nextButton.classList.add('hideButton')
          secondDIV.classList.add('pgBox') // Add the pgBox class for different styling.
          var textLabel = choices[counter].CHOICE_LABEL // Add the label.
          for (var ch of textLabel) {
            if ($.inArray(ch, marks) !== -1) { // Check if the label is a punctuation mark.
              secondDIV.classList.add('pmBox') // Add the pmBox class to punctuation marks.
            }
          }
        }
        choiceValuesArray.push(choices[counter].CHOICE_VALUE) // add choice labels to Array
        counter++ // increment counter.
        secondDIV.appendChild(text) // add the text to the div.
        fieldset.appendChild(secondDIV) // add the div to the fieldset (row).
      }
    }
    div.appendChild(fieldset) // Add the row to main container.
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

function secondClick (clickedElement, rowNumber) {
  clickedElement.text('(' + rowNumber + ')') // Replace question mark with row number on second click.
  var rowId = '#fieldset' + rowNumber // Get the id of the section identified by this row number.
  var nodes = document.querySelector(rowId).childNodes
  for (var b = 0; b < nodes.length; b++) {
    if (nodes[b].nodeName.toLowerCase() === 'div') {
      nodes[b].classList.add('selected') // Mark all items in this row as selected.
    }
  }
}

function thirdClick (clickedElement, rowNumber) {
  var rowId = '#fieldset' + rowNumber // Get the id of the section identified by this row number.
  var nodes = document.querySelector(rowId).childNodes
  for (var b = 0; b < nodes.length; b++) {
    if (nodes[b].nodeName.toLowerCase() === 'div') {
      nodes[b].classList.remove('selected') // Remove the selected class from all items in the row.
    }
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
    currentAnswer = String(timeLeft) + ' ' + pageNumber + ' ' + String(timeNow) + '|' + selectedItems // Save progress whilst the timer is running.
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
    button.innerHTML = 'Resume' // Change the button text to Resume.
  } else {
    startTime = Date.now() - timePassed
    timerRunning = true // Start the timer.
    button.innerHTML = 'Pause' // Change the button text to Pause.
  }
}

function endEarly () {
  timeRemaining = Math.ceil(timeLeft / 1000) // Amount of time remaining
  endTimer() // End the test.
}

// Ending the test.
function endTimer () {
  button.innerHTML = 'Test Complete' // Change the button test.
  button.disabled = true
  button.classList.remove('hidden') // Make the button visible.
  timerDisplay.classList.add('hidden') // Hide the timer.
  timeLeft = 0 // set time to 0.
  timerRunning = false // Stop the timer.
  if (finishEarly === 0 && complete !== 'true') { // If the test can end directly or is already complete.
    if (strict === 0) { // If the test allows selecting items once the timer has run out.
      button.disabled = false
      finishButton.classList.add('hidden') // Hide finish button.
      button.innerHTML = 'Finished?'
      button.onclick = function () { // Confirm that the test is complete.
        extraItems = 0
        openLastItemModal() // Select the last attempted item after selecting extras.
        button.innerHTML = 'Test Complete'
        button.disabled = true
      }
    } else {
      finishButton.classList.add('hidden') // Hide finish button.
      strict = 0
      extraItems = 0
      button.innerHTML = 'Test Complete'
      button.disabled = true
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
    } else {
      classes.add('selected')
      if (itemCounter <= 9) { // Check number of items selected.
        itemCounter++
        items.push(itemIndex) // Add selected items to array.
        var isSame = (firstTenItems.sort().toString() === items.sort().toString()) // compare array of collected items to array of first 10 elements.
        if (isSame) {
          timerRunning = false // Stop timer
          endFirstLine = 'Yes' // Indicate that the first line was all incorrect
          openIncorrectItemsModal() // Inform user of wrong responses.
        }
      }
    }
  } else if (timeLeft === 0 && extraItems === 0) { // This is for selecting the last letter, and it will be used at the very end.
    for (var cell of gridItems) { // This removes the red border in case another cell was previously selected
      cell.classList.remove('lastSelected')
    }
    item.classList.add('lastSelected')
    lastSelectedIndex = itemIndex // Get index of last selected item.
    checkLastItem() // Check that the selected last item is not before the last clicked item as part of the test.
    if (complete === 'true') { // For a complete test.
      setResult() // Set the results.
      openThankYouModal()
      makeInActive()
    } else {
      for (var cell of gridItems) { // This removes the red border in case another cell was previously selected
        cell.classList.remove('lastSelected')
      }
      item.classList.add('lastSelected')
      lastSelectedIndex = itemIndex // Get index of last selected item
      checkLastItem() // Check that the selected last item is not before the last clicked item as part of the test.
    }
  }
}

// Check that the selected last item is not before the last clicked item as part of the test.
function checkLastItem () {
  var selectedItemsArray = selectedItems.split(' ') // Create an array of the selected items.
  var lastClickedItem = selectedItemsArray[selectedItemsArray.length - 1] // Get the last item that was incorrect.
  var indexLastClickedItem = choiceValuesArray.lastIndexOf(lastClickedItem) // Get index of last clicked item.
  var indexLastSelectedItem = choiceValuesArray.lastIndexOf(lastSelectedIndex) // Get index of last selected item.
  if (indexLastClickedItem > (indexLastSelectedItem)) {
    openModal('Either pick the last incorrect item, or one after that.') // Prompt the user to select another item.
    $.map(gridItems, function (box) {
      box.addEventListener('click', function () {
        var a = this.classList.item(1)
        var b = a.slice(4)
        itemClicked(this, b)
      })
    })
  } else {
    $.map(gridItems, function (box) {
      box.addEventListener('click', function () {
        var a = this.classList.item(1)
        var b = a.slice(4)
        itemClicked(this, b)
      })
    })
    complete = 'true'
  }
}

// Function to get list of selected items.
function getSelectedItems () {
  var selectedLet = []
  for (var cell of gridItems) {
    if (cell.classList.contains('selected')) { // Loop through all items checking those with the CSS selected class.
      var m = cell.classList.item(1)
      var n = m.slice(4) // Get the number of the selected item.
      selectedLet.push(n) // Add the item to the array.
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
  var arrayValues = choices.map(function (obj) { return obj.CHOICE_VALUE })
  var correctIncorrectArray = arrayValues.slice(0, lastSelectedIndex)
  var notAnsweredItemsArray = arrayValues.slice(totalItems, arrayValues.length)
  if (type === 'reading') {
    correctIncorrectArray = $.grep(correctIncorrectArray, function (value) { return $.inArray(value, punctuationArray) < 0 })
    notAnsweredItemsArray = arrayValues.slice(totalItems + punctuationCount, arrayValues.length)
    notAnsweredItemsArray = $.grep(notAnsweredItemsArray, function (value) { return $.inArray(value, punctuationArray) < 0 })
  }
  if (notAnsweredItemsArray[notAnsweredItemsArray.length - 1] == allAnswered) {
    notAnsweredItemsArray.pop() // Remove last item from the array.
  }
  var notAnsweredItemsList = notAnsweredItemsArray.join(' ')
  if (notAnsweredItemsArray.length === 1 && notAnsweredItemsArray[0] == allAnswered) {
    notAnsweredItemsList = ''
  }
  if (type === 'reading' && notAnsweredItemsArray.length === punctuationCount) {
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
}

// Incorrect last item modal
function openModal (content) {
  modalContent.innerText = content
  firstModalButton.innerText = 'Yes'
  secondModalButton.innerText = 'No'
  modal.style.display = 'block'
}
// Thank you note modal
function openThankYouModal () {
  modalContent.innerText = 'Thank you! You can continue.' // Text to display on the modal.
  firstModalButton.innerText = 'Done'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
    button.innerText = 'Test Complete'
    button.disabled = true
    secondModalButton.classList.remove('hidden')
    firstModalButton.style.width = '50%'
  }
  $.map(gridItems, function (box) { // Make all grid unclickable once test is complete.
    if (!(box.classList.contains('pmBox'))) {
      box.removeEventListener('click', boxHandler, false)
    }
  })
}
// Modal to prompt user to select the last item.
function openLastItemModal () {
  modalContent.innerText = 'Please tap the last item attempted'
  firstModalButton.innerText = 'Okay'
  secondModalButton.classList.add('hidden')
  firstModalButton.style.width = '100%'
  modal.style.display = 'block'
  firstModalButton.onclick = function () {
    modal.style.display = 'none'
  }
  secondModalButton.onclick = function () {
    modal.style.display = 'none'
  }

  // DISABLE HERE
  var selectedItemsArray = selectedItems.split(' ') // Create an array of the selected items.
  var beforeLastClicked = selectedItemsArray[selectedItemsArray.length - 1] - 1 // Item before last clicked
  for (var i = 0; i < beforeLastClicked; i++) {
    var thisBox = gridItems[i]
    thisBox.classList.add('notLastItem')
  }
}

function openIncorrectItemsModal () {
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
    button.innerHTML = 'Test Complete'
    finishButton.classList.add('hidden') // Hide finish button.
  }
  secondModalButton.onclick = function () {
    modal.style.display = 'none'
    startStopTimer() // On cancel, continue the timer.
  }
}

function makeActive () {
  $.map(gridItems, function (box) {
    box.addEventListener('click', boxHandler, false) // Make all buttons unselectable.
  })
}

function makeInActive () {
  $.map(gridItems, function (box) {
    box.removeEventListener('click', boxHandler, false) // Make all buttons unselectable.
    box.classList.add('disabled')
  })
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

// Paging for letter and word tests that have already started or have been completed.
function updateGrid () {
  var fieldset1 = document.querySelector('#fieldset1')
  var fieldset2 = document.querySelector('#fieldset2')
  var fieldset3 = document.querySelector('#fieldset3')
  var fieldset4 = document.querySelector('#fieldset4')
  var fieldset5 = document.querySelector('#fieldset5')
  var fieldset6 = document.querySelector('#fieldset6')
  var fieldset7 = document.querySelector('#fieldset7')
  var fieldset8 = document.querySelector('#fieldset8')
  var fieldset9 = document.querySelector('#fieldset9')
  var fieldset10 = document.querySelector('#fieldset10')
  if (previousSelectedItems != null) { // Check that the test has started.
    if (type === 'letters' && screenSize === 'small' && continuity === 0) {
      if (prevPageNumber === 1) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.remove('hidden')
        fieldset4.classList.remove('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 2) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.remove('hidden')
        fieldset6.classList.remove('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 3) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.remove('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 4) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.remove('hidden')
        fieldset10.classList.remove('hidden')
        hideFinishButton()
        nextButton.classList.add('hideButton')
        backButton.classList.remove('hideButton')
      }
    }
    if (type === 'letters' && screenSize === 'small' && continuity === 1) {
      if (prevPageNumber === 1) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.remove('hidden')
        fieldset3.classList.remove('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 2) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.remove('hidden')
        fieldset4.classList.remove('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 3) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.remove('hidden')
        fieldset5.classList.remove('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 4) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.remove('hidden')
        fieldset6.classList.remove('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 5) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.remove('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 6) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.remove('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 7) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.remove('hidden')
        fieldset9.classList.remove('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 8) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.remove('hidden')
        fieldset10.classList.add('hidden')
        hideFinishButton()
        backButton.classList.remove('hideButton')
      }
    }
    if (type === 'words' && screenSize === 'small' && continuity === 0) {
      if (prevPageNumber === 1) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.remove('hidden')
        fieldset6.classList.remove('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.remove('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 2) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.add('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.remove('hidden')
        fieldset10.classList.remove('hidden')
        hideFinishButton()
        nextButton.classList.add('hideButton')
        backButton.classList.remove('hideButton')
      }
    }
    if (type === 'words' && screenSize === 'small' && continuity === 1) {
      if (prevPageNumber === 1) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.remove('hidden')
        fieldset5.classList.remove('hidden')
        fieldset6.classList.remove('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.add('hidden')
        fieldset9.classList.add('hidden')
        fieldset10.classList.add('hidden')
        nextButton.classList.remove('hideButton')
        backButton.classList.remove('hideButton')
      } else if (prevPageNumber === 2) {
        fieldset1.classList.add('hidden')
        fieldset2.classList.add('hidden')
        fieldset3.classList.add('hidden')
        fieldset4.classList.add('hidden')
        fieldset5.classList.add('hidden')
        fieldset6.classList.add('hidden')
        fieldset7.classList.remove('hidden')
        fieldset8.classList.remove('hidden')
        fieldset9.classList.remove('hidden')
        fieldset10.classList.remove('hidden')
        hideFinishButton()
        nextButton.classList.add('hideButton')
        backButton.classList.remove('hideButton')
      }
    }
  }
}
