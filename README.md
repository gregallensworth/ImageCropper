# ImageCropper

This jQuery plugin makes it copy-paste simple to add an image-cropping tool to your website.

http://gregallensworth.github.io/ImageCropper/

* Call *ImageCropper()* on your file-input element, like this:

```
$('input[type="file"][name="thumbimage"]').ImageCropper({
    width:800,
    height:600,
    thumbWidth:200,
    thumbHeight:150
})
```

* When a file is selected, the user will be walked through cropping the image. The UI is slim and minimal so it won't stomp on your other page content, but the CSS is documented so you can style it as you like.

* After cropping, the file-input element will be cleared so the file will not upload (optional, default) and a new hidden-input element will be created with the base64-encoded JPEG content. By default, this hidden-input will have the same name as the file-input did.

* Handling the base64-encoded image server-side, is up to you. See below for some ideas.


# Options And Callbacks

* **width** -- The width of the cropping panel, and therefore of the final cropped image.
  * Integer; defaults to **1024**.

* **height** -- The height of the cropping panel, and therefore of the final cropped image.
  * Integer; defaults to **768**.

* **thumbWidth** -- The width of the generated thumbnail, so the user can see their results (albeit downscaled).
  * Integer; defaults to 1/4 of width.

* **thumbHeight** -- The height of the generated thumbnail, so the user can see their results (albeit downscaled).
  * Integer; defaults to 1/4 of height.

* **clearFileInput** -- Clear the file-input when a crop is done? If true, this effectively disables the file upload from happening because the file input is cleared.
  * This is typically convenient, on the assumption that you prefer the cropped base64 version. If you do want to keep the uploaded file as well as the base64-encoded string, set this to **false** and set **fieldName** as well.
  * Boolean; defaults to **true**

* **fieldName** -- The **name** of the hidden-input field that will be created.
  * Text; defaults to same as the name of the file input.
  * Changing this to something else could make sense, if you want to keep both the original image as a file upload, and also the cropped version as base64 text.

* **onImageLoaded** -- An optional callback function after an image has been loaded into the cropper. Params are as follows:

```
onImageLoaded: function (rawimg, $cropcanvas, $fileinput)
```

* **onImageCropped** -- An optional callback function after an image has been cropped and finished. Params are as follows:

```
onImageCropped: function (rawimg, $hiddeninput, $fileinput)
```

* **onImageCancel** -- An optional callback function after an image crop has been cancelled. Params are as follows:

```
onImageCancel: function (rawimg, $hiddeninput, $fileinput)
```

* **zoomInText** -- Optional, text for the *Zoom In* button.
  * Text and HTML are acceptable. Try FontAwesome or Glyphicons.

* **zoomOutText** -- Optional, text for the *Zoom Out* button.
  * Text and HTML are acceptable. Try FontAwesome or Glyphicons.

* **goText** -- Optional, text for the *Save and Crop* button.
  * Text and HTML are acceptable. Try FontAwesome or Glyphicons.

* **cancelText** -- Optional, text for the *Cancel* button.
  * Text and HTML are acceptable. Try FontAwesome or Glyphicons.


# Handling the Base64-Encoded Image Content

So, how would one save this cropped image? It's just a blob of random letters. This is image data, encoded in base64, a format which can be parsed by Python, PHP, and other languages. The resulting image could be saved to a database as a string field, could be opened by GD or PIL to save it as a new file, or could be passed to a Django ImageField.

*Don't forget the cardinal rule* of accepting input from users: they could be hackers or could be running malware. Always check that the image data parsed properly as image data and add relevant exception handlers, and never let them decide what filename you'll use for saving.

```
# Django / Python
# if you're not using Django, you could instead call cropdata.save()
# to save to a file on-disk

import base64
import PIL.Image
import cStringIO

from django.core.files.base import File

if request.POST.get('image_cropped', None):
    # strip that header
    strip_mime_header = re.compile('^data:image/\w+;base64,')
    imgdata = request.POST['image_cropped']
    imgdata  = strip_mime_header.sub('', imgdata)

    # use PIL to convert the image data into a JPEG, into a new image string
    img_crop = cStringIO.StringIO()
    cropdata = cStringIO.StringIO( base64.b64decode(imgdata) )
    cropdata = PIL.Image.open(cropdata)
    cropdata.save(img_crop, 'JPEG', quality=75, dpi=(72,72) )
    img_crop.seek(0)

    # save it to the model's ImageField
    yourmodelinstance.photo.save("yourfilename.jpg", File(img_crop) )
```

```
// PHP
// decode the base64 and open it with GD
// then save it as a JPEG file on disk
$imgdata = base64_decode($_FILES['image_cropped']);
$img = imagecreatefromstring($data);
imagejpeg($img, "somefile.jpg", 75);
imagedestroy($img);
```


# Credits and Origin

A lot of the "heavy lifting" workflow, was adapted from the following gist by "ezgoing" dated September 14 2014. http://cssdeck.com/labs/xnmcokhc

My own initial work in this adaptation was focused on:

* having the HTML generated by the ImageCropper() so as to reduce the HTML-pasting and CSS-fussing overhead
* internal documentation/ /comments and cleanup
* some event-binding fixes when running multiple instances of ImageCropper on one page
