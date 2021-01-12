/* eslint-disable */
const shell = require('shelljs');
const argv = require('yargs').argv;
const fs = require('fs');
const moment = require('moment');

const { buildModules } = require('./get_config');

function deleteFile(proj) {
  let file;
  try {
    file = fs.readFileSync(`prod/${proj}/index.html`).toString();
  }
  catch (error) {
    // do nothing
  }
  if (file) {
    const dateMatchStr = file.match(/release-date="(.+?)"/ig);
    if (dateMatchStr) {
      const dateStr = dateMatchStr[0].replace('release-date="', '').replace('"', '').replace('--', ' ');
      console.log('dateStr', dateStr);
      if (dateStr && dateStr.length) {
        const releaseDate = moment(dateStr, 'YYYY-MM-DD HH:mm:ss');
        if (releaseDate.isValid()) {
          const deleteCmd = `find prod/${proj} -type f ! -newermt "${releaseDate.format('ll')}" -delete`;
          console.log('deleteCmd', deleteCmd);
          const deleteResult = shell.exec(deleteCmd);
          console.log('deleteResult', deleteResult);
        }
      }
    }
  }
}

if (argv.proj) {
  if (buildModules.includes(argv.proj)) {
    deleteFile(argv.proj);
  }
}
else if (argv.all) {
  buildModules.map(function (elem) {
    deleteFile(elem);
  });
}
