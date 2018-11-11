// Adobe Premiere Simple Slideshow Generator

// run main block of code
main();

// main function where everything is checked and ran
function main() {

// have the user select a folder where their images are located
var importFolder = new Folder;
importFolder = Folder.selectDialog("Open a folder");

// if folder is not selected, tell them to run script again
if(importFolder == null) {
        alert("No folder selected", "Please run again");
        return false;
    }

// if folder is selected, get all the files inside of it
var files = importFolder.getFiles();

// no files were found. rerun script and tell user to select a valid folder
if(files.length < 1) {
        alert("No files detected", "Select a valid folder");
        main();
    } 

// gets the paths for all the images in the folder
var imageFiles = getImagePaths(files);

// if there are no image files in the folder, have the user to try again
if(imageFiles.length < 1) {
        alert("No image files in this folder", "Try again!");
        main();
    }

// let the user decide how many seconds each image will be
var seconds = prompt("Seconds per image", "5", "");

// project setup
var project = app.project;
var projectItem = project.rootItem;

// import the files we found earlier
project.importFiles(imageFiles);

// create a Bin called "Image Folder"
var imageFolder = projectItem.createBin("Image Folder");
// create a new sequence to put our photos in
var slideshowSequence = project.createNewSequence("Your Slideshow", "id");

// after importing our images, we need to locate them in the project
var importedImages = getImageProjectItems(projectItem);


// get list of tracks
var videoTracks = slideshowSequence.videoTracks;

// get the first video track (where all the images will be)
var videoTrackOne = videoTracks[0];

// the length of one frame in premiere pro time (comes in handy later)
var frameLength = time.seconds;

var startTime = 0;

// create a new time object for easier calculations later
var thisTime = new Time();
thisTime.seconds = parseInt(seconds);

// move images into image folder
for(var e = 0; e < importedImages.length; e++) {
    importedImages[e].moveBin(imageFolder);
    // automatically scale image to fit sequence size
    importedImages[e].setScaleToFrameSize();
    // insert the current image into the slideshow sequence
    videoTrackOne.insertClip(importedImages[e], startTime);
    // change the current start time of the image
    startTime+=parseInt(seconds)+frameLength;
    // change the end pont of the current image
    videoTrackOne.clips[e].end = videoTrackOne.clips[e].start.seconds+parseInt(seconds);
    }

// get all the images that were inserted to the sequence
var trackItems = getTrackClips(videoTrackOne);

for(var i = 0; i < trackItems.length; i++) {
// get effect objects of the current image
var components = trackItems[i].components;

// [motionObj, opacityObj]
var videoComponentObjs = getComponentObjs(components);

// adjust opacity (add keys too)
var opacityParam = videoComponentObjs[1].opacity;
fadeOpacity(opacityParam, 1, trackItems[i], parseInt(seconds));

// get scale, position, and anchor point values
var positionValue = videoComponentObjs[0].position.getValue();
var scaleHeight = videoComponentObjs[0].scale.getValue();
var scaleWidth = videoComponentObjs[0].scaleWidth.getValue();
var anchorPointValue = videoComponentObjs[0].anchorPoint.getValue();

// animate the scale of the current image (with keyframes)
animateScale(videoComponentObjs[0].scale, 1, trackItems[i], scaleHeight, parseInt(seconds));
}
} 

function animateScale(param, length, image, scale, seconds) {    
    // allow keyframes
    param.setTimeVarying(true);
    // add a keyframe at the beginning, and end of the image (for scale)
    param.addKey(image.inPoint.seconds);
    param.addKey(image.inPoint.seconds+seconds);
    
    // change those keyframes to be the original value, and original value  + 10%
    param.setValueAtKey(image.inPoint.seconds, scale);
    param.setValueAtKey(image.inPoint.seconds+seconds, scale*1.1);
    }

function fadeOpacity(param, length, image, seconds) {
    // allow keyframes
    param.setTimeVarying(true);
    // add keyframes at beginning and end of the image layer (for opacity)
    param.addKey(image.inPoint.seconds);
    param.addKey(image.inPoint.seconds+length);
    param.addKey(image.inPoint.seconds+seconds-length);
    param.addKey(image.inPoint.seconds+seconds);
    
    // change the keyframes to be 0 and 100
    param.setValueAtKey(image.inPoint.seconds, 0);
    param.setValueAtKey(image.inPoint.seconds+length, 100);
    param.setValueAtKey(image.inPoint.seconds+seconds-length, 100);
    param.setValueAtKey(image.inPoint.seconds+seconds, 0);
    }

function getComponentObjs(components) {
    var opacityComponent;
    var motionComponent;
    // search for the opacity and motion components for this given image
    var motionObj = {
        
        };
    
    for(var i = 0; i < components.numItems; i++) {
    if(components[i].displayName == "Opacity") {
            opacityComponent = components[i];
        }
    if(components[i].displayName == "Motion") {
            motionComponent = components[i];
        }
    }

var opacityObj = {
        opacity: opacityComponent.properties[0]
        };
// once the opacity and motion components are found, we need to get the other values (like position, scale, rotation, etc.)
    for(var e = 0; e < motionComponent.properties.numItems; e++) {
        switch(motionComponent.properties[e].displayName) {
                case "Position":
                    motionObj.position = motionComponent.properties[e];
                break;
                case "Scale":
                    motionObj.scale = motionComponent.properties[e];
                break;
                case "Scale Width":
                    motionObj.scaleWidth = motionComponent.properties[e];
                    motionObj.scaleCheck = motionComponent.properties[e+1];
                break;
                case "Rotation":
                    motionObj.rotation = motionComponent.properties[e];
                break;
                case "Anchor Point":
                    motionObj.anchorPoint = motionComponent.properties[e];
                break;
            }
        }
    
        motionObj.scaleCheck.setValue(true, true);
    // send back a proprietary object that only we know the hierarchy of
    return [motionObj, opacityObj];
    }

function getTrackClips(videoTrack) {
        var clips = [];
        // get all the clips from the current track
        for(var i = 0; i < videoTrack.clips.numItems; i++) {
            clips.push(videoTrack.clips[i]);
            }
        
        return clips;
    }

function getImageProjectItems(projectItem) {
        var projectImages = [];
        var thisName;
// get all the image files in our project panel (jpg, jpeg, and png)
for(var i = 0; i < projectItem.children.numItems; i++) {
    thisName = projectItem.children[i].name;
    if(thisName.substring(thisName.length - 3, thisName.length).toLowerCase() == "jpg" || thisName.substring(thisName.length - 3, thisName.length).toLowerCase() == "jpeg" || thisName.substring(thisName.length - 3, thisName.length).toLowerCase() == "png") {
        projectImages.push(projectItem.children[i]);
        }
    }

return projectImages;
    }

function getImagePaths(files) {
    var thisName;
    var paths = [];
    // check all the files in the folder the user selected. If it's an image, we want to keep it, and use its path
    for(var i = 0; i < files.length; i++) {
        thisName = files[i].name;
        if(thisName.substring(thisName.length-3, thisName.length).toLowerCase() == "jpg" || thisName.substring(thisName.length-3, thisName.length).toLowerCase() == "jpeg" || thisName.substring(thisName.length-3, thisName.length).toLowerCase() == "png") {
            paths.push(files[i].fsName);
            }
        }
    return paths;
    }