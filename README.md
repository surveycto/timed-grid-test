# EGRA test

![Screenshot](extras/egra-test.jpg)

## Description

This field plug-in is designed to help execute the Early Grade Reading Assessment (EGRA) on SurveyCTO. It supports the following tests:

1. Letter identification
1. Familiar word reading
1. Nonword reading
1. Oral reading fluency with comprehension

For details on these tests, please consult the [USAID EGRA Toolkit](https://pdf.usaid.gov/pdf_docs/PA00M4TN.pdf). Also see the [Support Center Guide to EGRA on SurveyCTO](https://support.surveycto.com/hc/en-us/articles/360052796233).

[![Download now](extras/beta-release-download.jpg)](https://github.com/surveycto/egra-test/raw/master/egra-test.fieldplugin.zip)

### Features

The egra-test field plug-in has a number of features to help EGRA assessors:

* Appropriate choice list arrangement into a grid or text passage.
* Adaptive button layouts and pagination, depending on screen size.
* A built-in timer for limiting the duration of EGRA subtasks.
* Prompt to prematurely end the test after X number of incorrect answers in line/row 1 of assessed text.
* Prompt to stop the subtask once the time runs out.
* Prompt to pick the last attempted item for the purpose of scoring.
* Stores sentence progress in the oral reading subtask.

### Data format

This field plug-in supports the [*select_multiple* field type]([https://docs.surveycto.com/02-designing-forms/01-core-concepts/03i.field-types-select-multiple.html](https://docs.surveycto.com/02-designing-forms/01-core-concepts/03i.field-types-select-multiple.html)), though the EGRA test data is stored in the field plug-ins metadata. The data is stored in a pipe-separated (|) list. For example:

    16714|7 14 16|true|17|88|3|85|No|12

You can retrieve the specific values with the [plug-in-metadata() function](https://docs.surveycto.com/02-designing-forms/01-core-concepts/09.expressions.html#plug-in-metadata) in your form design to return the following from these positions in the metadata:

* 0 to 2 - Reserved for internal processing
* 3 - Amount of time remaining in seconds
* 4 - Total number of letters attempted
* 5 - Number of incorrect letters
* 6 - Number of correct letters
* 7 - Whether the firstline was all incorrect
* 8 - The number of sentence end marks (e.g. periods) passed, as indicated by the last attempted item when using the oral reading version of the test.

See the use of the `plug-in-metadata()` function in the [sample form](https://github.com/surveycto/egra-test/raw/master/extras/sample-form/Sample%20form%20-%20EGRA%20Test%20field%20plug-in.xlsx) for details.

## How to use

1. Download the [sample form](https://github.com/surveycto/egra-test/raw/master/extras/sample-form/Sample%20form%20-%20EGRA%20Test%20field%20plug-in.xlsx) from this repo and upload it to your SurveyCTO server.
1. Download the [egra-test.fieldplugin.zip](https://github.com/surveycto/egra-test/raw/master/egra-test.fieldplugin.zip) file from this repo, and attach it to the test form on your SurveyCTO server.
1. Make sure to provide the correct parameters (see below).

### Parameters

|Key|Value|
|---|---|
|`type` (required)|Used to specify the kind of test the field plug-in is being used for. This determines the screen layout. You can specify one of three values: `letters` - for a letter reading test. `words` - for nonword or familiar word reading test. `reading` - for reading/comprehension test.|
|`duration` (optional)|Used to specify the length of the test in seconds. Default is 60 seconds. Enter a custom value as required to override the default as required.|
|`end-after` (optional)|Used to specify the limit on the number of consecutive incorrect items that can be marked from the start before being prompted to end the test. The default is 10 for a letter reading test and 5 for a nonword or familiar reading test, but you can specify a custom value, including 0 to disable.|
|`strict` (optional)|Enable to enforce strict adherence to the time limit in `duration`. When strict is enabled (`strict=1`), when the timer runs out, no more selections are possible. When strict is off (the default behavior) the user can continue to make selections once the time runs out. This will allow slower users to catch up according to what they heard before finishing the activity.|
|`pause` (optional)|The default behavior is to not allow pausing a timed EGRA test. You can omit the pause parameter if the default behavior is desirable. However, if you would like the user to be allowed to pause the test, specify `pause=1`.|
|`continuity` (optional)|Applies only to smaller screens if the test becomes paginated. When enabled (`continuity=1`), letters and words type tests provide some visual continuity as to where the user is on their screen in relation to print handout for the student being assessed. It achieves this by moving the bottom row on screen to the top of the next screen when you page forward. This feature is disabled by default, so specify nothing if you do not wish to use continuity.|

### Example

To create a letter reading test that takes 30 seconds, with a strictly observed time limit, and ends if the respondent gets the first 10 letters incorrect, the following would be placed in the appearance column of the spreadsheet form definition:

    custom-egra-test(type='letters', duration=30, strict=1, ends-with=10)

If you're using the online form designer, you could simply add the following to the _parameters_ field properties box:

    type='letters', duration=30, strict=1, ends-with=10

## More resources

* **Sample form**
[extras/sample_form](https://github.com/surveycto/egra-test/raw/master/extras/sample-form/Sample%20form%20-%20EGRA%20Test%20field%20plug-in.xlsx).
* **Developer documentation**
[https://github.com/surveycto/Field-plug-in-resources](https://github.com/surveycto/Field-plug-in-resources)
* **User documentation**
[https://docs.surveycto.com/02-designing-forms/03-advanced-topics/06.using-field-plug-ins.html](https://docs.surveycto.com/02-designing-forms/03-advanced-topics/06.using-field-plug-ins.html)
* **Support Center guide**
[https://support.surveycto.com/hc/en-us/articles/360052796233](https://support.surveycto.com/hc/en-us/articles/360052796233)
