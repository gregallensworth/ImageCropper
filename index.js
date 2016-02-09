$(document).ready(function () {
    // initialize each of the image inputs, explicitly specifying some options such as the text field's name, and the width & height
    $('input[type="file"][name="image"]').each(function () {
        $(this).ImageCropper({
            width: 800,
            height: 600,
            thumbWidth: 200,
            thumbHeight: 150,
            fieldName: 'encoded',
            clearFileInput: false
        });
    });
});