'use strict'

const axios = require('axios');
const URL = `http://www.igr.jp/`;

axios.get(URL, {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then((response) => {
    console.log(response.data);
    //let item = response.data;
    //let status = item.match(/operatinginfo"><strong>(.*?)<\/strong>/)[1];
    //console.log(status);
  })
  .catch((error) => {
    console.log(error);
  });