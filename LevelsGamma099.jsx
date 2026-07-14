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
var INCLUDE_SUBFOLDERS = true;
// Matches normal image extensions AND files whose name ends in "_z"
// (extensionless files exported that way). "_z" files are saved out as .jpg.
var FILE_TYPES = /(\.(jpg|jpeg|png|tif|tiff|psd)$|_z$)/i;
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
            // never descend into our own output folder
            if (recurse && item.name !== "processed") {
                out = out.concat(collectFiles(item, recurse));
            }
        } else if (item.name.charAt(0) !== "." && FILE_TYPES.test(item.name)) {
            // skip hidden/system files (.DS_Store, ._resource forks, etc.)
            out.push(item);
        }
    }
    return out;
}

function saveResult(doc, srcFile, outFolder) {
    var base = srcFile.name.replace(/\.[^\.]+$/, "");
    var ext  = srcFile.name.match(/\.[^\.]+$/);
    // Extensionless files (e.g. "..._z") are PNG data -> save as .png
    ext = ext ? ext[0].toLowerCase() : ".png";

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

function openImage(file) {
    // Files with a normal image extension open directly.
    if (/\.(jpg|jpeg|png|tif|tiff|psd)$/i.test(file.name)) {
        return app.open(file);
    }
    // Extensionless files (e.g. "..._z"): copy to a temp file ending in .png
    // so Photoshop can determine the format (these exports are PNG data).
    var tmp = new File(Folder.temp + "/psbatch_" + (new Date()).getTime() +
                       "_" + file.name + ".png");
    file.copy(tmp);
    var doc = app.open(tmp);
    tmp.remove(); // safe: the document is already loaded in memory
    return doc;
}

function ensureFolder(folder) {
    // Creates a folder and any missing parent folders above it.
    if (folder.exists) return;
    ensureFolder(folder.parent);
    folder.create();
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

    var rootPath = inputFolder.fsName;
    var processed = 0, failed = 0;
    for (var i = 0; i < files.length; i++) {
        try {
            // Mirror the source subfolder structure under processed/ so that
            // same-named files in different subfolders never overwrite each other.
            var relDir = files[i].parent.fsName.substring(rootPath.length);
            var destFolder = new Folder(outFolder.fsName + relDir);
            ensureFolder(destFolder);

            var doc = openImage(files[i]);
            applyLevelsGamma(GAMMA);
            saveResult(doc, files[i], destFolder);
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
