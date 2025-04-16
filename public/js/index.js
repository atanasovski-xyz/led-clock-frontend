import {
  hexToRgb,
  rgbToHex,
  led_server_url,
  saveMatrixLocal,
} from "./utils.js";

let selectedColourBox = null;
let handling_send = false;

let current_colour = [255, 255, 255];
let off_colour = [0, 0, 0];

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", (event) => {
  // Create the grid
  createGrid(32, 64);

  // Get selected html element and cache it
  selectedColourBox = document.getElementById("selected-colour-box");

  // Add event listener for reset button
  const resetButton = document.getElementById("reset");
  resetButton.addEventListener("click", onResetClick);

  // Add event listener for send button
  const sendButton = document.getElementById("send");
  sendButton.addEventListener("click", onSendClick);

  // Add event listener for save button
  const saveButton = document.getElementById("save");
  saveButton.addEventListener("click", onSaveClick);

  // add event listener for load button
  const loadButton = document.getElementById("load");
  loadButton.addEventListener("click", onLoadClick);

  // Add event listener for file input
  const fileInput = document.getElementById("file-input");
  fileInput.addEventListener("change", onLoadFile);

  // Add a listener to each colour button
  const colourButtons = document.querySelectorAll(".color-button");
  colourButtons.forEach((button) => {
    const color = button.getAttribute("data-color");
    button.style.backgroundColor = color;
    button.addEventListener("click", onColourClick);
  });

  // Add a listener for the custom colour picker
  const colourPicker = document.getElementById("colorpicker");
  colourPicker.addEventListener("input", (event) => {
    const colour = event.target.value;
    const button = event.target.parentElement;

    current_colour = hexToRgb(colour);
    selectedColourBox.style.backgroundColor = colour;
    button.style.backgroundColor = colour;
  });

  // Add event listener for mouse move on grid
  const grid = document.getElementById("grid");
  grid.addEventListener("pointermove", onGridMouseMove);

  // Load the matrix from local storage if it exists
  loadMatrixLocal();
});

// Handle send button click
function onSendClick() {
  if (handling_send) return;
  handling_send = true;

  // Loop through cells and create pixel data
  const cells = document.querySelectorAll(".cell");
  const pixelData = [];
  cells.forEach((cell) => {
    const position = [cell.getAttribute("data-y"), cell.getAttribute("data-x")];
    const colour = hexToRgb(cell.getAttribute("data-colour"));

    pixelData.push({
      rgb: colour,
      position: position,
    });
  });

  console.log("Sending pixel data to server...");

  // Send pixels to server
  fetch(`${led_server_url}/matrix`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Removed access-control-allow-origin header
    },
    body: JSON.stringify(pixelData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      handling_send = false;
    })
    .catch((error) => {
      console.error("Error:", error);
      handling_send = false;
    });
}

// Handle save button click
function onSaveClick() {
  // Loop through cells and create pixel data
  const cells = document.querySelectorAll(".cell");
  const pixelData = [];
  cells.forEach((cell) => {
    const position = [cell.getAttribute("data-y"), cell.getAttribute("data-x")];
    const colour = hexToRgb(cell.getAttribute("data-colour"));

    pixelData.push({
      rgb: colour,
      position: position,
    });
  });

  console.log("Saving pixel data to server...");

  // Send pixels to server
  fetch(`${led_server_url}/save-matrix`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Removed access-control-allow-origin header
    },
    body: JSON.stringify(pixelData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Saved as:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Handle colour button click
function onColourClick(event) {
  const colour = event.target.getAttribute("data-color");

  // if it doesn't have a colour attribute, return
  if (!colour) return;

  // Change the selected colour box
  selectedColourBox.style.backgroundColor = colour;

  // convert hexcode colour to rgb list
  const rgb = hexToRgb(colour);
  current_colour = rgb;
}

// Create the grid
function createGrid(rows, columns) {
  const gridElement = document.getElementById("grid");

  // Clear any existing grid
  gridElement.innerHTML = "";

  // Create rows and columns
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      // Add data attributes for x and y coordinates
      cell.setAttribute("data-x", i);
      cell.setAttribute("data-y", j);

      // Set current colour
      setCellColour(cell, off_colour);

      // Add event listener for mouse click
      cell.addEventListener("click", onCellClick.bind(null, i, j));

      // row.appendChild(cell);
      gridElement.appendChild(cell);
    }
  }
}

// Handle mouse move over grid
function onGridMouseMove(event) {
  // check if mouse is held down, if not, return
  if (!event.buttons) return;

  // Get cell from mouse position
  const cell = document.elementFromPoint(event.clientX, event.clientY);

  // check if the target is a cell
  if (!cell.classList.contains("cell")) return;

  setCellColour(cell, current_colour, true);
}

// Set the colour of a cell
function setCellColour(cell, colour, save = false) {
  cell.setAttribute("data-colour", rgbToHex(colour));
  cell.style.backgroundColor = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;

  if (save) saveMatrixLocal(document);
}

// Handle individual cell click
function onCellClick(x, y) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  setCellColour(cell, current_colour, true);
}

// Handle reset button click
function onResetClick() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    setCellColour(cell, off_colour);
  });
}

// Handle load button click
function onLoadClick() {
  // Open a file dialog
  document.getElementById("file-input").click();
}

// Handle file input change
function onLoadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    // Load a png or jpg image
    const img = new Image();
    img.src = e.target.result;

    // When the image has loaded, loop through the pixels and set the cell colours
    // don't create a canvas element
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const cells = document.querySelectorAll(".cell");
      cells.forEach((cell) => {
        const x = cell.getAttribute("data-x");
        const y = cell.getAttribute("data-y");

        const pixel = ctx.getImageData(y, x, 1, 1).data;
        const colour = [pixel[0], pixel[1], pixel[2]];

        setCellColour(cell, colour);
      });

      saveMatrixLocal(document);
    };
  };

  reader.readAsDataURL(file);
}

// Load the current matrix from local storage
function loadMatrixLocal() {
  const pixelData = JSON.parse(localStorage.getItem("matrix"));
  if (!pixelData) return;

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    const colour = pixelData[index];

    if (!colour) return;

    setCellColour(cell, colour);
  });
}
