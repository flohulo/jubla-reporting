"use strict";

const { httpPost } = require("./http");

/**
 * Uploads a base64 encoded image to Google Drive.
 * @param {string} token Google Access Token
 * @param {string} folderId The ID of the Drive folder
 * @param {string} filename The desired filename
 * @param {string} base64WithPrefix The base64 string with data: prefix
 * @returns {Promise<Object>} The Drive file object
 */
async function uploadFile(token, folderId, filename, base64WithPrefix) {
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID missing in environment!");

  const parts = base64WithPrefix.split(",");
  const mimeType = parts[0].match(/:(.*?);/)[1];
  const base64Data = parts[1];

  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const metadata = {
    name: filename,
    parents: [folderId],
  };

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: " + mimeType + "\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    base64Data +
    close_delim;

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

  const response = await httpPost(url, multipartBody, {
    Authorization: "Bearer " + token,
    "Content-Type": 'multipart/related; boundary="' + boundary + '"',
  });

  const parsed = JSON.parse(response);
  if (parsed.error) throw new Error(parsed.error.message);
  return parsed;
}

module.exports = { uploadFile };
