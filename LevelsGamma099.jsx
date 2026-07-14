/*
 * LevelsGamma099.jsx
 * -------------------------------------------------------------
 * Batch-applies a Levels adjustment to every photo in a folder,
 * setting the middle slider (gamma / midtone) from 1.00 to 0.99.
 *
 * HOW TO RUN (on the machine with Photoshop):
 *   Photoshop  ->  File  ->  Scripts  ->  Browse...  ->  pick this file
 *   (or drag the .jsx onto the Photoshop window)
 *
 * It will ask you for:
 *   1. The INPUT folder (the photos to process)
 *   2. It writes results into a "processed" subfolder so your
 *      originals are never overwritten.
 * -------------------------------------------------------------
 */

#target photoshop

// ---- SETTINGS you can tweak ------------------------------------------------
var GAMMA          = 0.99;   // the middle Levels value (1.00 -> 0.99)
var JPEG_QUALITY   = 12;     // 0-12, only used when saving JPEGs
var INCLUDE_SUBFOLDERS = false;
var FILE_TYPES = /\.(jpg|jpeg|png|tif|tiff|psd)$/i;
// ---------------------------------------------------------------------------

function applyLevelsGamma(gamma) {
    // Applies a Levels adjustment to the active layer with the given gamma.
    var desc = new ActionDescriptor();
    var adjList = new ActionList();
    var adjDesc = new ActionDescriptor();

    // Target the composite (RGB) channel
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Cmps"));
    adjDesc.putReference(charIDToTypeID("Chnl"), ref);

    // Gamma = the middle input slider
    adjDesc.putDouble(charIDToTypeID("Gmm "), gamma);

    adjList.putObject(charIDToTypeID("LvlA"), adjDesc);
    desc.putList(charIDToTypeID("Adjs"), adjList);

    executeAction(charIDToTypeID("Lvls"), desc, DialogModes.NO);
}

function collectFiles(folder, recurse) {
    var out = [];
    var items = folder.getFiles();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item instanceof Folder) {
            if (recurse) out = out.concat(collectFiles(item, recurse));
        } else if (FILE_TYPES.test(item.name)) {
            out.push(item);
        }
    }
    return out;
}

function saveResult(doc, srcFile, outFolder) {
    var base = srcFile.name.replace(/\.[^\.]+$/, "");
    var ext  = srcFile.name.match(/\.[^\.]+$/);
    ext = ext ? ext[0].toLowerCase() : ".jpg";

    var outFile = new File(outFolder + "/" + base + ext);

    if (ext === ".png") {
        var pngOpts = new PNGSaveOptions();
        doc.saveAs(outFile, pngOpts, true, Extension.LOWERCASE);
    } else if (ext === ".tif" || ext === ".tiff") {
        var tiffOpts = new TiffSaveOptions();
        doc.saveAs(outFile, tiffOpts, true, Extension.LOWERCASE);
    } else if (ext === ".psd") {
        var psdOpts = new PhotoshopSaveOptions();
        doc.saveAs(outFile, psdOpts, true, Extension.LOWERCASE);
    } else {
        var jpgOpts = new JPEGSaveOptions();
        jpgOpts.quality = JPEG_QUALITY;
        doc.saveAs(outFile, jpgOpts, true, Extension.LOWERCASE);
    }
}

function main() {
    var inputFolder = Folder.selectDialog("Select the folder of photos to process");
    if (!inputFolder) return;

    var outFolder = new Folder(inputFolder + "/processed");
    if (!outFolder.exists) outFolder.create();

    var files = collectFiles(inputFolder, INCLUDE_SUBFOLDERS);
    if (files.length === 0) {
        alert("No supported image files found in that folder.");
        return;
    }

    var originalDialogMode = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;

    var processed = 0, failed = 0;
    for (var i = 0; i < files.length; i++) {
        try {
            var doc = app.open(files[i]);
            applyLevelsGamma(GAMMA);
            saveResult(doc, files[i], outFolder);
            doc.close(SaveOptions.DONOTSAVECHANGES);
            processed++;
        } catch (e) {
            failed++;
        }
    }

    app.displayDialogs = originalDialogMode;
    alert("Done.\nProcessed: " + processed + "\nFailed: " + failed +
          "\nSaved to: " + outFolder.fsName);
}

main();
