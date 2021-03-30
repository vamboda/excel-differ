const fs = require("fs");
const { mainModule } = require("process");
const xlsxFile = require("read-excel-file/node");

require("dotenv").config();

var folder1 = process.env.FOLDER_1;
var folder1FilePrefix = process.env.FOLDER_1_FILE_PREFIX;
var folder1Files = [];
var folder2 = process.env.FOLDER_2;
var folder2FilePrefix = process.env.FOLDER_2_FILE_PREFIX;
var folder2Files = [];

folder1Files = fs.readdirSync(folder1);
folder2Files = fs.readdirSync(folder2);

const errors = new Map();
const diffFilesMap = new Map();
validateInputFiles(errors, folder1Files, folder2Files, folder1, folder2);
indexInputFiles(
  diffFilesMap,
  folder1Files,
  folder2Files,
  folder1,
  folder2,
  folder1FilePrefix,
  folder2FilePrefix,
  errors
);

console.log("---ROWS----");
let promises = [];
diffFilesMap.forEach(async (file2, file1) => {
  promises.push(performDiff(file1, file2));
  //console.table(file1Rows);
});
Promise.all(promises).then((results) => {
  console.log("----DIFF RESULTS----", results);
});

console.log("----MATCHING FILES----", diffFilesMap);
console.log("----PRE DIFF ERRORS----", errors);

async function performDiff(file1, file2) {
  let failureReason = "";
  let result = {
    file1,
    file2,
  };
  console.log("latest", file1, file2);
  let file1Rows = await xlsxFile(file1);
  let file2Rows = await xlsxFile(file2);

  if (file1Rows.length !== file2Rows.length) {
    failureReason = `Rows count mismatch. ${key} has ${file1Rows.length}, while ${value} has ${file2Rows.length}.`;
    isMatching = false;
  }
  if (file1Rows[1].length !== file2Rows[1].length) {
    failureReason = `Rows count mismatch. ${key} has ${file1Rows.length}, while ${value} has ${file2Rows.length}.`;
    isMatching = false;
  }

  if (failureReason.length > 0) {
    result.failureReason = failureReason;
    result.isMatching = false;
  } else {
    // TODO: ADD VALIDATION LOGIC

    let rowsDiffResults = [];
    for (let index = 0; index < file1Rows.length; index++) {
      let rowDiffResult = {
        index,
      };
    }
  }

  return result;
}

/** ===========HELPER FUNCTIONS ===========**/

/**
 * This method validates the input files by count etc...
 * TODO: yet to add more validation logic
 * @param {*} errors
 * @param {*} folder1Files
 * @param {*} folder2Files
 * @param {*} folder1
 * @param {*} folder2
 */
function validateInputFiles(
  errors,
  folder1Files,
  folder2Files,
  folder1,
  folder2
) {
  if (folder1Files.length !== folder2Files.length) {
    errors.set(
      "incorrect_files_count",
      `Folder1: ${folder1} has ${folder1Files.length} and Folder2: ${folder2} has ${folder2Files.length}`
    );
  }
}

/**
 * This method is used to index files for verifying the diff
 */

function indexInputFiles(
  diffFilesMap,
  folder1Files,
  folder2Files,
  folder1,
  folder2,
  folder1FilePrefix,
  folder2FilePrefix,
  errors
) {
  const unknownFiles = new Set();
  const folder1FilesIndexByName = new Map();
  const folder2FilesIndexByName = new Map();
  // loop through folder2 files to index it's files by name with out prefix
  for (let index = 0; index < folder2Files.length; index++) {
    let folder2FileName = folder2Files[index];
    let fileName2WithoutPrefix = folder2FileName.startsWith(folder2FilePrefix)
      ? folder2FileName.split(folder2FilePrefix)[1]
      : undefined;
    const fullFileName = folder2 + "/" + folder2Files[index];
    if (!fileName2WithoutPrefix) {
      unknownFiles.add(fullFileName);
    } else {
      folder2FilesIndexByName.set(fileName2WithoutPrefix, fullFileName);
    }
  }

  // loop through folder1 files to build diff file map
  for (let index = 0; index < folder1Files.length; index++) {
    let folder1FileName = folder1Files[index];
    let fileName1WithoutPrefix = folder1FileName.startsWith(folder1FilePrefix)
      ? folder1FileName.split(folder1FilePrefix)[1]
      : undefined;
    const fullFileName = folder1 + "/" + folder1Files[index];

    if (
      !fileName1WithoutPrefix ||
      !folder2FilesIndexByName.has(fileName1WithoutPrefix)
    ) {
      unknownFiles.add(fullFileName);
    } else {
      diffFilesMap.set(
        fullFileName,
        folder2FilesIndexByName.get(fileName1WithoutPrefix)
      );
      folder1FilesIndexByName.set(fileName1WithoutPrefix, fullFileName);
    }
  }

  // loop through folder2 files to check if the file found a match in folder 1
  for (let index = 0; index < folder2Files.length; index++) {
    let folder2FileName = folder2Files[index];
    const fullFileName = folder2 + "/" + folder2Files[index];

    let fileName2WithoutPrefix = folder2FileName.startsWith(folder2FilePrefix)
      ? folder2FileName.split(folder2FilePrefix)[1]
      : undefined;
    if (!fileName2WithoutPrefix) {
      continue;
    }
    if (!folder1FilesIndexByName.has(fileName2WithoutPrefix)) {
      unknownFiles.add(fullFileName);
    }
  }

  if (unknownFiles.size !== 0) {
    errors.set("unknown_files", unknownFiles);
  }
}
