const axios = require('axios');

const handler = async event => {
  //GET KEY FROM .ENV
  const API_KEY = process.env.API_KEY;
  // CREATE URL VARIABLE
  let url;
  //IF THERE IS LAT OR LONG KEY IN PASSED OBJECT, DESCTRUCTURE COORDS VARIABLES AND USE GOELOCATION API
  if (event.queryStringParameters.lat || event.queryStringParameters.long) {
    const { lat, long } = event.queryStringParameters;
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${API_KEY}`;
  }
  // IF THERE IS QUERY KEY IN PASSED OBJECT, DESCTRUCTURE QUERY VARIABLE USE API FOR LOOKING UP NAMES IF PLACES
  if (event.queryStringParameters.query) {
    const { query } = event.queryStringParameters;
    url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${process.env.API_KEY}`;
  }

  try {
    const { data } = await axios.get(url);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    const { status, statusText, headers, data } = error.response;
    return {
      statusCode: status,
      body: JSON.stringify({ status, statusText, headers, data }),
    };
  }
};

module.exports = { handler };
