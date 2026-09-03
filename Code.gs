function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Data Sanitizer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
