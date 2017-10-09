/*
 * ImageCropper.js
 * https://github.com/gregallensworth/ImageCropper
 */

jQuery.fn.ImageCropper = function(options) {
    // define default options, override with the user's options
    options = $.extend({
        width: 1024,                            // width of the cropper, and therefore of the cropped image
        height: 768,                            // height of the cropper, and therefore of the cropped image
        thumbWidth: 1024/4,                     // width of the thumbnail rendition to show the results; default is 1/4 the width
        thumbHeight: 768/4,                     // height of the thumbnail rendition to show the results; default is 1/4 the height
        fieldName: $(this).prop('name'),        // name of the input[type="hidden"] to hold the output; default is same as the file input
        clearFileInput: true,                   // empty the file input after we have a cropped version? defaults to true
        onImageLoaded: function () {},          // callback function when an image is loaded into the cropper tool
        onImageCropped: function () {},         // callback function when an image is cropped and done
        onImageCancel: function () {},          // callback function when a crop is canceled
        zoomInText: "+",                        // button text for Zoom-In button (HTML OK)
        zoomOutText: "-",                       // button text for Zoom-Out button (HTML OK)
        goText: "Save &amp; Crop",              // button text for Crop-and-Save button (HTML OK)
        cancelText: "Cancel",                   // button text for Cancel button (HTML OK)
    }, options);

    // a reference to our own file input
    $fileinput = $(this);

    // create the target input[type="hidden"] field; this receives the final base64 content
    // and the target thumbnail so the user can see the results (at a diminished size) once it becomes visible
    var $target_thumb = $('<img src="about:blank" />').hide().addClass('imageCropperThumbnail').width(options.thumbWidth).height(options.thumbHeight).appendTo( $fileinput.parent() );
    var $target_input = $('<input type="hidden" />').prop('name',options.fieldName).val('').appendTo( $fileinput.parent() );
    
    // create the cropper panel and the buttons, inside a wrapper to make them look good
    var $wrapper = $('<div></div>').addClass('imageCropperWrapper').appendTo($fileinput.parent()).width(options.width).hide();
    var $canvas  = $('<div></div>').addClass('imageCropperCanvas').appendTo($wrapper).width(options.width).height(options.height);
    var $buttons = $('<div></div>').addClass('imageCropperButtons').appendTo($wrapper);
    var $btnIn   = $('<button class="imageCropperButtons-zoomIn"></button>').html(options.zoomInText).appendTo($buttons).click(zoomIn);
    var $btnCrop = $('<button class="imageCropperButtons-performCrop"></button>').html(options.goText).appendTo($buttons).click(performCrop);
    var $btnOut  = $('<button class="imageCropperButtons-zoomOut">-</button>').html(options.zoomOutText).appendTo($buttons).click(zoomOut);
    var $btnCancel = $('<button class="imageCropperButtons-cancelCrop">Cancel</button>').html(options.cancelText).appendTo($buttons).click(cancelCrop);

    // create a new, blank Image element with a onload handler to trigger the refreshBackgroudn() when it receives content
    // this will in fact have its 'src' assigned in the file input's change-event handler
    var zoomRatio = 1.0;
    var imageInProgress = new Image();
    imageInProgress.onload = function() {
        $wrapper.show();
        $target_thumb.hide();
        zoomRatio = 1.0;
        refreshBackground();
        setTimeout(function () {
            options.onImageLoaded(imageInProgress, $canvas, $fileinput);
        },1);
    };

    // event handler: when this file input gets a file, kick off the file reader and get moving
    $fileinput.val('').change(function () {
        var reader    = new FileReader();
        reader.onload = function(event) {
            imageInProgress.src = event.target.result; // let the onload event handler take it from here
        }
        reader.readAsDataURL(this.files[0]);
    });

    // event handlers on the cropper canvas: dragging and ceasing to drag
    var mouseX, mouseY, draggable;
    $canvas.bind('mousedown', function(e) {
        e.stopImmediatePropagation();

        draggable = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    }).bind('mousemove', function(e) {
        e.stopImmediatePropagation();

        if (! draggable) return;

        var x = e.clientX - mouseX;
        var y = e.clientY - mouseY;

        var bg = $canvas.css('background-position').split(' ');
        var bgX = x + parseInt(bg[0]);
        var bgY = y + parseInt(bg[1]);
        $canvas.css('background-position', bgX +'px ' + bgY + 'px');

        mouseX = e.clientX;
        mouseY = e.clientY;
    }).bind('mouseout', function(e) {
        draggable = false;
    }).bind('mouseup', function(e) {
        draggable = false;
    }).bind('mousewheel DOMMouseScroll', function(e) {
        e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0 ? zoomIn() : zoomOut();
    });

    //
    // all those functions we've been referring to
    //
    function refreshBackground() {
        var w = parseInt(imageInProgress.width)  * zoomRatio;
        var h = parseInt(imageInProgress.height) * zoomRatio;
        var x = ( $canvas.width()  - w) / 2;
        var y = ( $canvas.height() - h) / 2;

        $canvas.css({
            'background-image': 'url(' + imageInProgress.src + ')',
            'background-size': w +'px ' + h + 'px',
            'background-position': x + 'px ' + y + 'px',
            'background-repeat': 'no-repeat'
        });
    };
    function zoomIn() {
        zoomRatio *= 1.25;
        refreshBackground();
    };
    function zoomOut() {
        zoomRatio *= 0.80;
        refreshBackground();
    };
    function performCrop() {
        // copy to canvas, generate the base64 version; thank you ezgoing!
        var width  = options.width,
            height = options.height,
            dim = $canvas.css('background-position').split(' '),
            size = $canvas.css('background-size').split(' '),
            dx = parseInt(dim[0]) - $canvas.width()/2 + width/2,
            dy = parseInt(dim[1]) - $canvas.height()/2 + height/2,
            dw = parseInt(size[0]),
            dh = parseInt(size[1]),
            sh = parseInt(imageInProgress.height),
            sw = parseInt(imageInProgress.width);

        var canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        context.drawImage(imageInProgress, 0, 0, sw, sh, dx, dy, dw, dh);
        var base64 = canvas.toDataURL('image/jpeg');

        // load the thumbnail, and the target text input
        // hide the editing UI
        // empty the file input in favor of the base64
        $target_thumb.prop('src',base64).show();
        $target_input.val( base64.replace('data:image/jpeg;base64,', '') );
        $wrapper.hide();
        if (options.clearFileInput) $fileinput.val('');

        // fire the optional callback
        setTimeout(function () {
            options.onImageCropped(imageInProgress, $target_input, $fileinput);
        },1);
    };
    function cancelCrop () {
        // hide the UI
        $wrapper.hide();
        // clear and hide the thumbnail
        $target_thumb.prop('src', 'about:blank').hide();
        // clear both the file upload and the encoded thumbnail-base64
        $target_input.val('');
        $fileinput.val('');

        setTimeout(function () {
            options.onImageCancel(imageInProgress, $canvas, $fileinput);
        },1);
    };
};
