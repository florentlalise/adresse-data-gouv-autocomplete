class Autocomplete {
  constructor(inputId, dropdownId, callback, autocompleteType = "housenumber") {
    this.input = document.getElementById(inputId);
    this.dropdown = document.getElementById(dropdownId);
    this.type = this.input.autocompleteType || autocompleteType;
    this.request = null;
    this.callback = callback;

    this.input.addEventListener('input', this.handleInput.bind(this));
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  async handleInput() {
    if (this.input.value.length < 4) return;

    const url = this.constructUrl(this.input.value, this.type);
    const features = await this.requestAddress(url);

    if (this.type === 'housenumber') {
      if (features.length > 0) {
        this.displayPredictions(features);
      } else {
        const url = this.constructUrl(this.input.value, 'street');
        const features = await this.requestAddress(url);
        this.displayPredictions(features);
      }
    } else {
      this.displayPredictions(features);
    }
  }

  handleFocus() {
    const searchDropdown = this.dropdown;
    if (searchDropdown.children[0] && searchDropdown.children[0].children.length > 0) {
      searchDropdown.style.display = "block";
    }
  }

  handleFocusOut() {
    setTimeout(() => {
      this.dropdown.style.display = "none";
    }, 150);
  }

  constructUrl(value, type) {
    let addressTable = value.split(' ');
    let address = "";

    for (let i = 0; i < addressTable.length; i++) {
      if ((addressTable.length - 1) === i) {
        address += addressTable[i];
        break;
      }
      address += addressTable[i] + '+';
    }

    if (type) {
      return `https://api-adresse.data.gouv.fr/search/?q=${address}&limit=5&type=${type}`;
    } else {
      return `https://api-adresse.data.gouv.fr/search/?q=${address}&limit=5`;
    }
  }

  requestAddress(url) {
    return new Promise((resolve, reject) => {
      if (this.request !== null) this.request.abort();
      this.request = new XMLHttpRequest();
      this.request.open('GET', url, true);
      this.request.send(null);
      this.request.onload = () => {
        const result = JSON.parse(this.request.response);
        resolve(result.features);
      };
    });
  }

  displayPredictions(predictions) {
    const dropdownBloc = document.createElement('div');
    const elem = this.dropdown;

    if (predictions.length > 0) {
      elem.style.display = "block";
    } else {
      elem.style.display = "none";
    }

    for (let i = 0; i < predictions.length; i++) {
      let txt;
      const predictionNode = document.createElement('div');
      if (this.type === 'municipality') {
        txt = `${predictions[i].properties.label} (${predictions[i].properties.postcode.substr(0, 2)})`;
      } else {
        txt = `${predictions[i].properties.label}`;
      }
      
      predictionNode.dataset.autocompleteCity = `${predictions[i].properties.city ? predictions[i].properties.city : ''}`;
      predictionNode.dataset.autocompleteLongitude = `${predictions[i].geometry.coordinates[0] ? predictions[i].geometry.coordinates[0] : ''}`;
      predictionNode.dataset.autocompleteLatitude = `${predictions[i].geometry.coordinates[1] ? predictions[i].geometry.coordinates[1] : ''}`;
      predictionNode.dataset.autocompleteLabel = `${predictions[i].properties.label ? predictions[i].properties.label : ''}`;
      predictionNode.dataset.autocompleteHousenumber = `${predictions[i].properties.housenumber ? predictions[i].properties.housenumber : ''}`;
      predictionNode.dataset.autocompleteStreet = `${predictions[i].properties.street ? predictions[i].properties.street : ''}`;
      predictionNode.dataset.autocompletePostcode = `${predictions[i].properties.postcode ? predictions[i].properties.postcode : ''}`;
      predictionNode.innerText = `${txt}`;
      predictionNode.addEventListener('click', this.clickCallBack.bind(this));
      dropdownBloc.appendChild(predictionNode);
    }
    elem.innerHTML = '';
    elem.appendChild(dropdownBloc);
  }

  clickCallBack(evt) {
    this.input.value = evt.target.dataset.autocompleteLabel;
    this.dropdown.style.display = "none";
    const prediction = {
      city: evt.target.dataset.autocompleteCity,
      housenumber: evt.target.dataset.autocompleteHousenumber,
      street: evt.target.dataset.autocompleteStreet,
      coordinates: { longitude: evt.target.dataset.autocompleteLongitude, latitude: evt.target.dataset.autocompleteLatitude },
      label: evt.target.dataset.autocompleteLabel,
      postcode: evt.target.dataset.autocompletePostcode
    };

    this.callback(prediction);
  }
}