/**
 * Execute the logic on load
 */

window.addEventListener("load", event => {
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.

    document
      .getElementById("file_input_id")
      .addEventListener("change", handleFileSelect, false);

    // Setup the dnd listeners.
    var dropZone = document.getElementById("dragAndDrop");
    dropZone.addEventListener("dragover", handleDragOver, false);
    dropZone.addEventListener("drop", handleFileSelect, false);
  } else {
    alert("The File APIs are not fully supported in this browser.");
  }
});

handleFileSelect = evt => {
  evt.stopPropagation();
  evt.preventDefault();

  var files;

  if (evt.dataTransfer) {
    files = evt.dataTransfer.files;
  } else if (evt.target) {
    files = evt.target.files;
  } else {
    return;
  }

  // files is a FileList of File objects. List some properties.
  var output = [];
  var allowedTypes = ["ai", "doc", "jpg", "pdf", "png", "psd", "xls"];
  for (var i = 0, f; (f = files[i]); i++) {
    var ext = f.name.split(".").pop();

    if (allowedTypes.indexOf(ext) === -1) {
      alert("These file extensions are not allowed in our File Uploader!");
      continue;
    }

    var div = document.createElement("div");
    div.className = "input-container-" + i;

    var img = document.createElement("img");
    img.className = "img-" + ext + " svg";
    img.src = "/img/icon-file-" + ext + ".svg";

    var status = document.createElement("img");
    status.id = "status-" + i;
    status.className = "status svg inprogress";
    status.src = "/img/icon-close.svg";

    var li = document.createElement("li");
    var fileName = document.createElement("input");
    fileName.type = "text";
    fileName.setAttribute("value", escape(f.name));
    fileName.className = "fileName-" + i;
    li.appendChild(fileName);
    div.appendChild(img);
    div.appendChild(li);
    div.appendChild(status);

    output.push(div.outerHTML);
  }
  document.getElementById("list").innerHTML =
    "<ul>" + output.join("") + "</ul>";

  replaceSVG();

  var asyncArray = [];

  for (var i = 0, f; (f = files[i]); i++) {
    var asyncUpload = function(i, f) {
      return function(callback) {
        var reader = new FileReader();
        var li = document.querySelector(".input-container-" + i + " li");
        var status = document.getElementById("status-" + i);
        var progressBar = document.createElement("div");
        progressBar.id = "progress-bar-" + i;
        progressBar.className = "progress_bar";
        var percent = document.createElement("div");
        percent.className = "percent";
        progressBar.appendChild(percent);
        percent.style.width = "0%";

        li.appendChild(progressBar);

        reader.onloadstart = function(e) {
          progressBar.className = "progress_bar loading";
        };

        reader.onload = function(e) {
          // Ensure that the progress bar displays 100% at the end.
          percent.style.width = "100%";
          percent.style.opacity = "0";
          progressBar.className = "progress_bar";
          status = document.getElementById(status.id);
          var div = status.parentElement;
          div.querySelector('[class^="fileName-"]').style.opacity = 1;
          div.querySelector('[class^="img-"]').style.opacity = 1;
          status.remove();
          var img = document.createElement("img");
          img.id = status.id;
          img.src = "/img/icon-check.svg";
          img.className = "status svg completed";
          div.appendChild(img);
          replaceSVG();
          callback();
        };

        updateProgress = evt => {
          // evt is an ProgressEvent.
          if (evt.lengthComputable) {
            var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
            // Increase the progress bar length.
            if (percentLoaded < 100) {
              percent.style.width = percentLoaded + "%";
            }
          }
        };

        errorHandler = evt => {
          switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
              alert("File Not Found!");
              break;
            case evt.target.error.NOT_READABLE_ERR:
              alert("File is not readable");
              break;
            case evt.target.error.ABORT_ERR:
              break; // noop
            default:
              alert("An error occurred reading this file.");
          }
          callback();
        };

        reader.onerror = errorHandler;
        reader.onprogress = updateProgress;
        reader.readAsBinaryString(f);
      };
    };
    asyncArray.push(asyncUpload(i, f));
  }

  async.waterfall(asyncArray);
};

replaceSVG = () => {
  /*
     * Replace all SVG images with inline SVG
     */
  jQuery("img.svg").each(function() {
    var $img = jQuery(this);
    var imgID = $img.attr("id");
    var imgClass = $img.attr("class");
    var imgURL = $img.attr("src");

    jQuery.get(
      imgURL,
      function(data) {
        // Get the SVG tag, ignore the rest
        var $svg = jQuery(data).find("svg");

        // Add replaced image's ID to the new SVG
        if (typeof imgID !== "undefined") {
          $svg = $svg.attr("id", imgID);
        }
        // Add replaced image's classes to the new SVG
        if (typeof imgClass !== "undefined") {
          $svg = $svg.attr("class", imgClass + " replaced-svg");
        }

        // Remove any invalid XML tags as per http://validator.w3.org
        $svg = $svg.removeAttr("xmlns:a");

        // Replace image with new SVG
        $img.replaceWith($svg);
      },
      "xml"
    );
  });
};

handleDragOver = evt => {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
};
