'use strict';

// CLASS USED FOR STORING DATA FOR WEATHER CARDS
class WeatherCard {
  constructor(
    name,
    icon,
    temp,
    descr,
    rain,
    id,
    //TIME AND TIMEZONE CURRENTLY NOT USED
    time,
    timezone,
    country,
    background
  ) {
    this.name = name;
    this.icon = icon;
    this.temp = temp;
    this.descr = descr;
    this.rain = rain;
    this.id = id;
    this.time = time;
    this.timezone = timezone;
    this.country = country;
    this.background = background;

    this.descrToUpper();
    this.rainDataExistCheck();
  }

  //FIRST LETTER OF DESCRIPTION TO UPPER CASE
  descrToUpper() {
    this.descr = this.descr[0].toUpperCase() + this.descr.slice(1);
  }

  //CHECK IF RAIN DATA EXISTS (SOMETIMES API DOESNT HAVE IT)
  rainDataExistCheck() {
    this.rain = this.rain
      ? `<i class="fas fa-tint"></i> ${this.rain.toFixed(1)} mm`
      : '';
  }
}

// ELEMENTS SELECTION
const header = document.querySelector('.header');
const units = document.querySelector('.units');
const myPlacesBtn = document.querySelector('.my-places');
const searchBox = document.querySelector('.search');
const searchBar = document.querySelector('.search-bar');
const searchBtn = document.querySelector('.search-btn');
const searchBtnGeo = document.querySelector('.search-btn-geo');

const main = document.querySelector('.main');
const card = document.querySelector('.card');

const overlay = document.querySelector('.overlay');
const form = document.querySelector('.form');
const formInput = document.querySelector('.form input');
const formBtn = document.querySelector('.form button');
const changeKeyBtn = document.querySelector('.change-key');

class App {
  // USED FOR TEMP UNITS
  unitsMetric = true;
  //WEATHER CARDS
  card;
  myPlaces = [];
  myPlacesIndex = 0;
  API_KEY;

  constructor() {
    this.getLocalStorage();
    this.focusSearchBar();
    // DISPLAY FORM FOR INPUTING API KEY IF THERE WAS NO API KEY IN THE STORAGE
    this.displayKeyForm();
    // GET USERS LOCATION AND LOAD WEATHER FOR IT
    this.weatherForGeolocation();

    // HANDLERS
    header.addEventListener('click', this.changeUnits.bind(this));
    myPlacesBtn.addEventListener(
      'click',
      this.weatherForMyPlaces.bind(this, this.myPlacesIndex)
    );

    searchBtn.addEventListener('click', this.weatherForSearch.bind(this));
    searchBtnGeo.addEventListener(
      'click',
      this.weatherForGeolocation.bind(this)
    );

    card.addEventListener('click', this.addOrRemoveCard.bind(this));
    card.addEventListener('click', this.nextMyPlace.bind(this));
    card.addEventListener('click', this.prevMyPlace.bind(this));

    formBtn.addEventListener('click', this.getAPIKey.bind(this));
    changeKeyBtn.addEventListener('click', this.openKeyForm);
    overlay.addEventListener('click', this.closeKeyForm);
  }

  //GET USER LOCATION AND SHOW WEATHER BASED ON IT
  weatherForGeolocation() {
    if (!this.API_KEY) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.getWeather.bind(this),
        this.renderError
      );
    }
    this.focusSearchBar();
  }

  weatherForSearch(e) {
    e.preventDefault();
    this.getWeather(searchBar.value);
    this.focusSearchBar();
  }

  weatherForMyPlaces(index) {
    if (!this.myPlaces.length) return;
    //SET INDEX TO ZERO WHEN FUNCTION CALLED FOR INDEX ZERO
    if (index === 0) this.myPlacesIndex = 0;
    this.getWeather(
      `${this.myPlaces[index].name},${this.myPlaces[index].country}`
    );
  }

  // GET WEATHER BASED ON LOCATION
  getWeather = async function (fetchData) {
    try {
      if (!fetchData) return;
      if (!this.API_KEY) return;
      //RENDER SPINNER UNTIL THE DATA IS READY TO RENDER
      this.renderSpinner();
      const response = fetchData.coords
        ? //IF COORDS OBJECT EXIST IN FETCH DATA, USE API WITH GEO INPUT
          await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${fetchData.coords.latitude}&lon=${fetchData.coords.longitude}&appid=${this.API_KEY}&lang=${navigator.language}`
          )
        : // ELSE USE API WITH CITY NAME INPUT
          await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${fetchData}&appid=${this.API_KEY}&lang=${navigator.language}`
          );

      if (!response.ok) {
        throw new Error(
          `We don't know that place, or possibly your API key is not valid :(`
        );
      }
      const data = await response.json();
      this.newCard(data);
    } catch (err) {
      this.renderError(err);
    }
  };

  // CREATE NEW WEATHER CARD
  newCard(data) {
    const name = data.name;
    const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    const temp = data.main.temp;
    const descr = data.weather[0].description;
    const rain = data.rain ? data.rain['1h'] : '';
    const id = data.id;
    const time = data.dt;
    const timezone = data.timezone;
    const country = data.sys.country;
    const background = `./img/bg/${data.weather[0].icon}.jpg`;

    this.card = new WeatherCard(
      name,
      icon,
      temp,
      descr,
      rain,
      id,
      time,
      timezone,
      country,
      background
    );

    this.renderCard(this.card);
    this.renderBackground(this.card);
  }

  renderCard(data) {
    // HTML MARKUP FOR CARD
    card.innerHTML = '';
    const markup = `
        <button class="card-btn">
        ${
          this.setCardBtnType(data)
            ? '<i class="fas fa-minus"></i>'
            : '<i class="fas fa-plus"></i>'
        }
        </button>
        <h2 class="name">${data.name}</h2>
        <p class="country">(${data.country})</p>
        <button class="arrow arrow-left">
        ${
          this.setCardBtnType(data) && this.myPlaces.length > 1
            ? '<i class="fas fa-chevron-left"></i>'
            : ''
        }
        </button>
        <img src="${data.icon}" alt="weather icon"  class="icon" />
        <button class="arrow arrow-right">
          ${
            this.setCardBtnType(data) && this.myPlaces.length > 1
              ? '<i class="fas fa-chevron-right"></i>'
              : ''
          }
        </button>
        <p class="temp">${this.tempCovertion(data.temp)}  </p>
        <p class="descr">${data.descr}</p>
        <p class="rain">${data.rain}</p>
        <div class="dots">${this.renderDots(data)}</div>
      `;
    card.insertAdjacentHTML('afterbegin', markup);
  }

  nextMyPlace(e) {
    const btn = e.target.closest('.arrow-right');
    if (!btn) return;
    //SET INDEX
    this.myPlacesIndex =
      this.myPlacesIndex === this.myPlaces.length - 1
        ? 0
        : this.myPlacesIndex + 1;
    //DISPLAY CARD ON THAT INDEX
    this.weatherForMyPlaces(this.myPlacesIndex);
  }

  prevMyPlace(e) {
    const btn = e.target.closest('.arrow-left');
    if (!btn) return;
    //SET INDEX
    this.myPlacesIndex =
      this.myPlacesIndex === 0
        ? this.myPlaces.length - 1
        : this.myPlacesIndex - 1;
    //DISPLAY CARD ON THAT INDEX
    this.weatherForMyPlaces(this.myPlacesIndex);
  }

  renderDots(data) {
    return this.myPlaces
      .map((_, i) =>
        this.setCardBtnType(data)
          ? `<button class="dot ${
              i === this.myPlacesIndex ? 'active' : ''
            }" data-index="${i}"></button>`
          : ''
      )
      .join('');
  }

  //HELPER TO DECIDE WHAT THE CARD BUTTON DISPLAYS
  setCardBtnType(data) {
    if (this.myPlaces.some(place => place.id === data.id)) return true;
    else return false;
  }

  // ADDING AND REMOVING PLACES TO/FROM MY PLACES
  addOrRemoveCard(e) {
    const btn = e.target.closest('.card-btn');
    if (!btn) return;
    //ADD TO MY PLACES IF IT DOESNT ALREADY CONTAIN THE PLACE AND SET INDEX
    if (!this.setCardBtnType(this.card)) {
      this.myPlaces.push(this.card);
      this.myPlacesIndex = this.myPlaces.length - 1;
    }
    // ELSE REMOVE IT FROM MY PLACES AND SET INDEX
    else {
      const index = this.myPlaces.findIndex(place => place.id === this.card.id);
      this.myPlaces.splice(index, 1);
      this.myPlacesIndex = 0;
    }
    this.renderCard(this.card);
    this.setLocalStorage();
  }

  displayKeyForm() {
    //check if there already is a key, if not render the form
    if (!this.API_KEY) {
      this.openKeyForm();
    } else {
      this.closeKeyForm();
    }
  }

  openKeyForm() {
    overlay.classList.remove('hidden');
    form.classList.remove('hidden');
    formInput.focus();
  }

  closeKeyForm() {
    overlay.classList.add('hidden');
    form.classList.add('hidden');
  }

  getAPIKey(e) {
    // SAVE THE KEY FROM THE FORM TO LOCAL STORAGE, CLOSE FORM AND LOAD WEATHER
    e.preventDefault();
    if (!formInput.value) return;
    this.API_KEY = formInput.value;
    this.setLocalStorage();
    this.displayKeyForm();
    this.weatherForGeolocation();
  }

  setLocalStorage() {
    localStorage.setItem('myPlaces', JSON.stringify(this.myPlaces));
    localStorage.setItem('APIKey', JSON.stringify(this.API_KEY));
  }

  getLocalStorage() {
    // get data for myPlaces
    const myPlaces = JSON.parse(localStorage.getItem('myPlaces'));
    if (!myPlaces) return;
    this.myPlaces = myPlaces;
    //  SET PROTOTYPES OF DATA FROM STORAGE
    this.myPlaces.forEach(place => {
      if (place.__proto__ !== WeatherCard.prototype)
        place.__proto__ = WeatherCard.prototype;
    });
    // GET API KEY
    const key = JSON.parse(localStorage.getItem('APIKey'));
    if (!key) return;
    this.API_KEY = key;
  }

  renderBackground(data) {
    // SET BODY BACKGROUND ACCORDING TO WEATHER CONDITIONS
    document.body.style.background = `linear-gradient(
      0deg,
      rgba(0, 0, 0, 0) 75%,
      rgba(0, 0, 0, 0.9) 100%
    ),
    url(${data.background})`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundSize = 'cover';
  }

  renderSpinner() {
    card.innerHTML = '';
    const markup = `
      <i class="fas fa-sun"></i>
    `;
    card.insertAdjacentHTML('afterbegin', markup);
  }

  renderError(err) {
    card.innerHTML = '';
    const markup = `
      <p class="err">${err.message}</p>
    `;
    card.insertAdjacentHTML('afterbegin', markup);
  }

  //HELPER FOR UNITS CONVERTION
  tempCovertion(temp) {
    if (this.unitsMetric) return `${Math.round(temp - 273.15)}°C`;
    else return `${Math.round(temp * (9 / 5) - 459.67)}°F`;
  }

  changeUnits(e) {
    const btn = e.target.closest('.units');
    if (!btn) return;
    //CHANGE UNITS BUTTONS TEXT CONTENT AND UNITS ON DISPLAY ACCORDINGLY
    if (this.unitsMetric) {
      units.textContent = '°F';
      this.unitsMetric = false;
    } else {
      units.textContent = '°C';
      this.unitsMetric = true;
    }
    this.renderCard(this.card);
  }

  focusSearchBar() {
    searchBar.value = '';
    searchBar.focus();
  }
}

const app = new App();
