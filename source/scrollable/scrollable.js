/* global parent, ResizeSensor, getPluginParameter */

var frameAdjust = getPluginParameter('frame_adjust')
if (frameAdjust == null) {
  frameAdjust = 0
} else if (!isNaN(frameAdjust)) {
  if (frameAdjust % 1 > 0) {
    frameAdjust = parseInt(frameAdjust)
    console.log('Frame adjust value is not an integer, so rounding down to ' + String(frameAdjust) + '.')
  }
} else {
  try {
    frameAdjust = parseInt(frameAdjust)
  } catch {
    console.log('Value given for frame adjust is invalid. Using 0 instead.')
    frameAdjust = 0
  }
}

var scrollableElement = document.querySelector('.scrollable')

var platform
if (document.body.className.indexOf('web-collect') >= 0) {
  platform = 'web'
} else {
  platform = 'mobile' // Currently, iOS or Android does not matter, but will add the distinction later if needed
}

if (platform === 'web') {
  parent.onresize = adjustWindow
  try {
    var iframe = parent.document.querySelector('iframe')
    scrollableElement.onscroll = function () {
      iframe.offsetHeight = 100 // Fixes an issue where during certain scroll events, the iframe becomes way to long, so this makes it smaller again
    }
  } catch (e) {
    Error(e) // Not a big deal if there is an error, since this is just a basic aethetic thing, so the respondent can continue even if there is an error here.
  }
} else {
  window.onresize = adjustWindow
}

adjustWindow()

ResizeSensor(scrollableElement, adjustWindow) // Adjust whenever the size of the scrollableElement changes

function adjustWindow () {
  var usedHeight // This will be an estimation of how much height has already been used by the interface
  var windowHeight // Height of the working area. In web forms, it's the height of the window, otherwise, it's the height of the device.

  if (platform === 'web') {
    usedHeight = 355 // This is an estimation for web collect
    windowHeight = parent.outerHeight // Height of the document of the web page.
  } else {
    usedHeight = 200 // This is an estimation for mobile devices
    windowHeight = window.screen.height // Height of the device.
  }
  var shiftPos = scrollableElement.getBoundingClientRect().top

  var containerHeight = windowHeight - shiftPos - usedHeight + frameAdjust // What the height of the scrolling container should be

  scrollableElement.style.height = String(containerHeight) + 'px'
}
