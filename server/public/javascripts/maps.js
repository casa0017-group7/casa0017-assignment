let map;

let carbonData = [];
var state = [];
let carbonMin = Number.MAX_VALUE,
  carbonMax = -Number.MAX_VALUE;

var regioninuk = "./resources/UK.geojson"
var CarbonApiUrl = "https://api.carbonintensity.org.uk/regional";



let hoverFlag = false;
let nameFrom = null;


async function initMap() {
  // The location of London
  const position = { lat: 54.6819964, lng: -8 };


  const { Map } = await google.maps.importLibrary("maps");
  //const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  document.body.appendChild(infoElement);
  
  // The map, centered at UK
  map = new Map(document.getElementById("map-canvas"), {
    zoom: 6.2,
    center: position,
    styles: carbon,
    disableDefaultUI: true,
    fullscreenControl: true
  });

  // Add events for google maps
  map.data.setStyle(setFeatureStyle);
  map.data.addListener("mouseover", hoverIn);
  map.data.addListener("mouseout", hoverOut);
  map.data.addListener('click', clickFeature);

  //Call function to load polygon boundaries
  loadPolygon();

}
initMap();

// ================== functions to be loaded onto maps ============================= //

//Load the boundaries polygon from Geojson files
function loadPolygon () {
  // Load Geojson files
  map.data.loadGeoJson(regioninuk, 
    { idPropertyName: "name"}, 
    function(features) {
      loadCarbonIndex(CarbonApiUrl);
    });
};


//* Loads carbon intensity from carbon intensity API

function loadCarbonIndex(variable) {
  fetch(variable)
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data && data.data) {
        const regions = data.data[0].regions; // Assuming there's only one region in the response
        //console.log(regions);
        if (regions) {
          const regionData = [];
  
          regions.forEach(region => {
            //const regionid = region.regionid;
            const name = region.shortname;
            const forecast = region.intensity.forecast;
            const translatedName = translateRegionName(name);
            console.log(name);
            console.log(translatedName); 
  
            //regionData.push(regionInfo);
  
            if (forecast < carbonMin) {
              carbonMin = forecast;
            }
            if (forecast > carbonMax) {
              carbonMax = forecast;
            }
            console.log(carbonMin);
            console.log(carbonMax);
  
            state = map.data.getFeatureById(translatedName);
            console.log(state);
  
            if (state !== undefined) {
              state.setProperty("carbonIndex", forecast);
              state.setProperty("name", translatedName);
              console.log(state.getProperty("name"));
              console.log(state.getProperty("carbonIndex"));
  
            }
  
          });
  
          //console.log("Region Data (regionid and shortname):", regionData);
        } else {
          console.log("Regions data not found.");
        }
      } else {
        console.log("Data not found in the response.");
      }
    })
    .catch(error => console.error("Error:", error));
    
  }
  
// Apply style for gradient color
function setFeatureStyle(feature) {
  // Define the low and high colors
  const lowColor = [216, 255, 211]; // RGB for low value
  const highColor = [255, 100, 32];   // RGB for high value

  // Access the carbonIndex from the feature properties
  const carbonIndex = feature.getProperty("carbonIndex");

  // Calculate the interpolation factor based on the carbonIndex
  const factor = (carbonIndex - carbonMin) / (carbonMax - carbonMin);

  // Interpolate the color
  const interpolate = interpolateColor(lowColor, highColor, factor);

  return {
    strokeWeight: 0.5,
    strokeColor: "#2a2a2a",
    fillColor: `rgb(${interpolate[0]}, ${interpolate[1]}, ${interpolate[2]})`,
    fillOpacity: 1,
  };
}

// Function to interpolate color based on a factor
function interpolateColor(color1, color2, factor) {
  const result = [];
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(color1[i] + (color2[i] - color1[i]) * factor);
  }
  return result;
}



function hoverIn(e) {
  if (hoverFlag === false){
    // set the hover state
    e.feature.setProperty("state", "hover");
    console.log(e.feature.getProperty("state") + " at region " + e.feature.getProperty("name") + " with carbon index " + e.feature.getProperty("carbonIndex"));

    //display tooltip
    var locationName = e.feature.getProperty('name');
    
    infoElement.innerHTML = locationName;
    infoElement.style.display = 'block';
    map.data.revertStyle();
    map.data.overrideStyle(e.feature, {
      strokeColor: "#ffffff", // white border
      strokeWeight: 2.5,
      zIndex: 2,
    });
    if(locationName != nameFrom){
      nameFrom = locationName;
      // update the styling of the feature
      
    }
    hoverFlag = true;
  }
}

function hoverOut(e) {
  if (hoverFlag === true){
    hoverFlag = false;
    //reset the hover state
    e.feature.setProperty("state", "normal");
    map.data.revertStyle();
    //hide tooltip
    infoElement.style.display = 'none';
  }
}

var infoElement = document.getElementById('info');

document.addEventListener('mousemove', function(e) {
  var mouseX = e.clientX;
  var mouseY = e.clientY;
  
  infoElement.style.left = mouseX + 5 + 'px';
  infoElement.style.top = mouseY + 5 + 'px';
});


function clickFeature(e) {
    // get region name
  var locationName = e.feature.getProperty('name');

  // check there is not same content
  var existingInfoBoxes = document.querySelectorAll('.custom-info-box');
  for (var i = 0; i < existingInfoBoxes.length; i++) {
    var existingLocationName = existingInfoBoxes[i].querySelector('.selected-region-name').textContent;
    if (existingLocationName === locationName) {
      return; 
    }
  }

  // add box to place region name
  var newInfoBox = document.createElement('div');
  newInfoBox.className = 'custom-info-box'; 
  newInfoBox.style.display = 'inline-block'; 
  newInfoBox.style.margin = '5px'; 
  newInfoBox.style.backgroundcolor='#111111'; 

  newInfoBox.innerHTML = '<span class="selected-region-name"></span><button class="close-button">x</button>';

  // set region name 
  newInfoBox.querySelector('.selected-region-name').textContent = locationName;

  // link to div which id is custom-container
  var customContainer = document.getElementById('custom-container');
  if (customContainer) {
    
  // add to custom-container div
  customContainer.appendChild(newInfoBox);

  // add close button
  var closeButton = newInfoBox.querySelector('.close-button');

  //close button style
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.outline = 'none';

  closeButton.addEventListener('click', function() {
    newInfoBox.remove(); 
  });
  }
  

  console.log(locationName);
}


function translateRegionName(geojsonName) {
  const translations = {
    "North West England": "North West",
    "North East England": "North East",
    "Yorkshire": "Yorkshire and The Humber",
    "South West England": "South West",
    "South East England": "South East",
    "East England" : "East of England",

  };

  return translations[geojsonName] || geojsonName;
}