

# Timed grid test

![Screenshot](extras/egra-test.jpg)

## Description

This field plug-in is designed to help execute timed tests and assessments, where buttons are arranged in grid format. In particular, timed-grid-test is optimal for executing educational assessments like the Early Grade Reading Assessment (EGRA) and the Early Grade Mathematics Assessment (EGMA) on SurveyCTO. See features for a list of supported tests.


[![Download now](extras/beta-release-download.jpg)](https://github.com/surveycto/timed-grid-test/raw/master/timed-grid-test.fieldplugin.zip)

### Features

The timed-grid-test field plug-in has the following features:

* Appropriate choice list arrangement into a grid or text passage.
* Adaptive button layouts and pagination, depending on screen size.
* A built-in timer for limiting the duration of assessed activities.
* Prompt to prematurely end the test after X number of incorrect answers in line/row 1 of assessed text.
* Prompt to stop the test once the time runs out.
* Prompt to pick the last attempted item for the purpose of scoring.
* Stores sentence progress in the oral reading test.
* Allows completing the test before allotted time has elapsed using the “Finish” button.

For EGRA, the following subtasks are possible:

* Letter identification
* Familiar word reading
* Nonword reading
* Oral reading fluency with comprehension

For details on these tests, please consult the [USAID EGRA Toolkit](https://pdf.usaid.gov/pdf_docs/PA00M4TN.pdf). Also see the [Support Center Guide to EGRA on SurveyCTO](https://support.surveycto.com/hc/en-us/articles/360052796233).

In the case of EGMA, this field plug-in can be used for these subtasks:

* Number identification
* Addition Level 1
* Subtraction Level 1

For details on these tests, please consult the [USAID EGMA Toolkit](https://ierc-publicfiles.s3.amazonaws.com/public/resources/EGMA%20Toolkit_March2014.pdf). Also see the [Support Center Guide to EGMA on SurveyCTO](https://support.surveycto.com/hc/en-us/articles/360052750634).

The [timed-field-list](https://github.com/surveycto/timed-field-list/blob/master/README.md) field plug-in is also useful for certain EGRA and EGMA subtasks.

### Data format

This field plug-in supports the [*select_multiple* field type]([https://docs.surveycto.com/02-designing-forms/01-core-concepts/03i.field-types-select-multiple.html](https://docs.surveycto.com/02-designing-forms/01-core-concepts/03i.field-types-select-multiple.html)). The field stores the list of items selected, representing items marked incorrect, whilst other test data is stored in the field plug-in's metadata. The metadata is stored in a pipe-separated (|) list. For example:

    16714 0 16700|7 14 16|true|17|88|3|85|No|12|1 2 3|18 19 20|0

You can retrieve the specific values with the [plug-in-metadata() function](https://docs.surveycto.com/02-designing-forms/01-core-concepts/09.expressions.html#plug-in-metadata) in your form design to return the following from these positions in the metadata:

* 0 to 2 - Reserved for internal processing and can safely be ignored. Check [this wiki](https://github.com/surveycto/timed-grid-test/wiki/Extended-metadata-details) if you are interested in the more technical aspects.
* 3 - Amount of time remaining in seconds.
* 4 - Total number of items attempted.
* 5 - Number of incorrect items.
* 6 - Number of correct items.
* 7 - Whether the firstline was all incorrect.
* 8 - The number of sentence end marks (e.g. periods) passed, as indicated by the last attempted item when using the oral reading test type.
* 9 - The list of correct items.
* 10 - The list of items not attempted/answered.
* 11 - The total number of punctuation marks.

See the use of the `plug-in-metadata()` function in the [sample form](https://github.com/surveycto/timed-grid-test/raw/master/extras/sample-form/Sample%20form%20-%20Timed%20grid%20test%20field%20plug-in.xlsx) for details.

## How to use

1. Download the [sample form](https://github.com/surveycto/timed-grid-test/raw/master/extras/sample-form/Sample%20form%20-%20Timed%20grid%20test%20field%20plug-in.xlsx) from this repo and upload it to your SurveyCTO server.
1. Download the [timed-grid-test.fieldplugin.zip](https://github.com/surveycto/timed-grid-test/raw/master/timed-grid-test.fieldplugin.zip) file from this repo, and attach it to the test form on your SurveyCTO server.
1. Make sure to provide the correct parameters (see below).

### Parameters

|Key|Value|
|---|---|
|`type` (required)|Used to specify the kind of test the field plug-in is being used for. This determines the screen layout. You can specify any one of these values: <ul><li>`letters` - for the EGRA letter reading test. Creates 10 columns.</li><li> `words` - for the EGRA nonword or familiar word reading test. Creates 5 columns.</li><li>`reading` - for the EGRA reading/comprehension test. Arranges choice list in passage with variable button widths according to the size of words. </li><li>`numbers` - for the EGMA number identification test. Creates 5 columns.</li><li> `arithmetic` - for the EGMA addition/subtraction level 1 tests. Creates 2 columns.</li></ul><br>It can also take an integer value which determines the number of columns to display on a screen. This is useful for screens that can accomodate more or fewer columns than the standard tests, as well as cases where the width of items would be better presented in a grid with fewer columns. Simply assign the type an integer value, for example: `type = 8`.|
|`all-answered` (recommended)|Used to define a value to be stored as the fields answer if all the items are correct. This is important because in both EGRA and EGMA subtasks, selections indicate incorrect answers. The `all-answered` value must also be included in the choice list. If you do not supply an `all-answered` value, the failsafe behavior is to store the first item in the choice list, but this can be misleading.|
|`page-rows` (optional)|Used to specify the number of rows to display on a screen. Like `type` with an integer value which manages the number of columns, this gives flexibilty on the number of rows that can be displayed on the screen. If more rows are available, paging will automatically be activated. Simply assign the type an integer value, for example: `page-rows = 8`. Default is `4` rows per page.|
|`duration` (optional)|Used to specify the length of the test in seconds. Default is 60 seconds. Enter a custom value as required to override the default as required.|
|`end-after` (optional)|Used to specify a limit on the number of consecutive incorrect items that can be marked from the start before being prompted to end the test early. The default is 10 items for the EGRA letter reading test and 5 for the EGRA nonword or familiar reading test, but you can specify a custom value, including 0 to disable.  By default, a pop-up is presented to the user, and they can select whether to end the test there, or to continue. If they choose to end the test, they will then be prompted to select the last attempted item, and then they can move forward. A more strict mode is available when the `strict` parameter is set to `1`; in this strict mode, the user is notified with a pop-up saying that the test is ending early, and on acknowledging the popup, they are immediately advanced to the next field.|
|`strict` (optional)|Enable to enforce strict adherence to the time limit specified in `duration`. When strict is enabled (`strict = 1`), when the timer runs out, no more selections are possible. When strict is off (the default behavior) the user can continue to make selections once time runs out. This will allow slower users to catch up according to what they heard just before time ran out. `strict` does not prevent the last attempted item from being revised. `strict` also governs the behavior of `end-after` (read more above).|
|`finish` (optional)|Used to customize the behavior of the finish button. It can take three values: <ul><li>`1` (the default)  means the user will be asked to confirm that the subtask is over, and to pick the last attempted item. The user must manually advance to the next screen.</li><li>`2` means the user will be asked to confirm the subtask is over, and on confirmation, assumes the last attempted item to be the last item in the list. Confirming that the subtask is over automatically advances to the next field.</li><li>`3` skips the confirmation altogether, assuming the last item attempted to be the last item in the list, and automatically progresses to the next field.</li></ul>|
|`pause` (optional)|The default behavior is to not allow pausing a timed EGRA test. However, if you would like the user to be allowed to pause the test, specify `pause = 1`.|
|`continuity` (optional)|Applies only to smaller screens if the test becomes paginated. When enabled (`continuity = 1`), it provides some visual continuity as to where the user is on their screen in relation to the print handout in front of the student being assessed. It achieves this by moving the bottom row on screen to the top of the next screen when you page forward. This feature is disabled by default, so specify nothing if you do not wish to use continuity.|


### Examples

To create an EGRA letter reading test that stores 99 if all items were correct, allowing 30 seconds, with a strictly observed time limit, and ends if the respondent gets the first 10 letters incorrect, the following would be placed in the appearance column of the spreadsheet form definition:

    custom-timed-grid-test(type='letters', all-answered=99, duration=30, strict=1)

If you're using the online form designer, you could simply add the following to the _Plug-in parameters_ properties box:

    type='letters', all-answered=99, duration=30, strict=1

Similarly, an EGMA addition level 1 test that stores 99 if all items were correct, and allows 50 seconds would have the following in its _appearance_ column of a spreadsheet form design:

    custom-timed-grid-test(type='arithmetic', all-answered=99, duration = 50)


## More resources

* **Sample form** <br>
You can find a form definition in this repo here: <br>
[extras/sample_form](https://github.com/surveycto/timed-grid-test/raw/master/extras/sample-form/Sample%20form%20-%20Timed%20grid%20test%20field%20plug-in.xlsx).
* **Developer documentation** <br>
More instructions for developing and using field plug-ins can be found here: <br>
[https://github.com/surveycto/Field-plug-in-resources](https://github.com/surveycto/Field-plug-in-resources)
* **User documentation** <br>
How to get started using field plug-ins in your SurveyCTO form. <br>
[https://docs.surveycto.com/02-designing-forms/03-advanced-topics/06.using-field-plug-ins.html](https://docs.surveycto.com/02-designing-forms/03-advanced-topics/06.using-field-plug-ins.html)
* **Support Center guide to EGRA** <br>
How to administer the Early Grade Reading Assessment (EGRA) using SurveyCTO. <br>
[https://support.surveycto.com/hc/en-us/articles/360052796233](https://support.surveycto.com/hc/en-us/articles/360052796233)
* **Support Center guide to EGMA** <br>
How to administer the Early Grade Mathematics Assessment (EGMA) using SurveyCTO. <br>
[https://support.surveycto.com/hc/en-us/articles/360052750634](https://support.surveycto.com/hc/en-us/articles/360052750634)
