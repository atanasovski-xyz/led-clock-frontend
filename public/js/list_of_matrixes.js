import { led_server_url, rgbToHex, saveMatrixLocal } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  loadMatrixes();
});

let currentPage = 0;
let pageLimit = 10;

function loadMatrixes() {
  // Make a request to the server to get the list of matrixes
  // passing the page and limit parameters
  const matrixesElement = document.getElementById("matrix-list");

  fetch(`${led_server_url}/get-matrixes?page=${currentPage}&limit=${pageLimit}`)
    .then((response) => response.json())
    .then((data) => {
      const matrixes = data.matrixes;
      if (matrixes == undefined || matrixes.length === 0) {
        matrixesElement.innerHTML =
          '<div class="no-matrixes">No matrixes found</div>';
        return;
      }

      matrixesElement.innerHTML = "";
      matrixes.forEach((matrix) => {
        const matrixElement = document.createElement("div");
        // Remove .json from end of name
        const matrixName = matrix.replace(".json", "");

        // Create the matrix element
        matrixElement.classList.add("matrix");
        matrixElement.setAttribute("data-id", matrixName);

        // Add save and send button icons - using classes instead of IDs
        matrixElement.innerHTML = `
          <div class="matrix-name">${matrixName}</div>
          <div class="matrix-buttons">
            <button class="matrix-button send-button" title="Send matrix to device"><i class="fas fa-paper-plane"></i></button>
            <button class="matrix-button load-button" title="Open matrix for editing"><i class="fas fa-pencil"></i></button>
            <button class="matrix-button download-button" title="Download matrix"><i class="fas fa-download"></i></button>
            <button class="matrix-button matrix-button-negative delete-button" title="Delete matrix from device"><i class="fas fa-trash"></i></button>
          </div>
        `;

        // Query the server for the matrix
        fetch(`${led_server_url}/get-matrix?timestamp=${matrixName}`)
          .then((response) => response.json())
          .then((data) => {
            // Load data as JSON
            const matrixData = JSON.parse(data);
            const matrixElement = document.querySelector(
              `[data-id="${matrixName}"]`
            );
            const matrixGridElement = document.createElement("div");
            matrixGridElement.classList.add("matrix-grid");

            // Create the grid
            matrixData.forEach((pixel) => {
              const cell = document.createElement("div");
              cell.classList.add("cell");
              cell.setAttribute("data-x", pixel.position[0]);
              cell.setAttribute("data-y", pixel.position[1]);
              cell.setAttribute("data-colour", rgbToHex(pixel.rgb));
              cell.style.backgroundColor = rgbToHex(pixel.rgb);
              matrixGridElement.appendChild(cell);
            });

            matrixElement.appendChild(matrixGridElement);
          })
          .catch((error) => {
            console.error("Error:", error);
          });

        matrixesElement.appendChild(matrixElement);

        // Updated selectors to use classes instead of IDs
        const loadButton = matrixElement.querySelector(".load-button");
        loadButton.addEventListener("click", onLoadClick);
        const sendButton = matrixElement.querySelector(".send-button");
        sendButton.addEventListener("click", onSendClick);
        const deleteButton = matrixElement.querySelector(".delete-button");
        deleteButton.addEventListener("click", onDeleteClick);
        const downloadButton = matrixElement.querySelector(".download-button");
        downloadButton.addEventListener("click", onDownloadClick);
      });

      // Handle page numbers
      const pageElement = document.getElementById("page-numbers");
      pageElement.innerHTML = "";

      // For each page number add a number button
      for (let i = 0; i < data.pages; i++) {
        const pageNumber = document.createElement("button");
        pageNumber.classList.add("page-number");

        // If the page is the current page, add the selected class
        if (i === currentPage) {
          pageNumber.classList.add("page-selected");
        }

        // Add the page number to the button
        pageNumber.innerHTML = i + 1;
        pageNumber.addEventListener("click", () => {
          currentPage = i;
          loadMatrixes();
        });

        pageElement.appendChild(pageNumber);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      matrixesElement.innerHTML =
        '<div class="no-matrixes">Error getting matrixes...</div>';
      return;
    });
}

function onLoadClick() {
  // Update cookie with matrix data and go back to index page
  saveMatrixLocal(this.parentElement.parentElement);
  window.location.href = "/";
}

function onSendClick() {
  // Send request to server to send matrix to device
  const matrixName = this.parentElement.parentElement.getAttribute("data-id");
  fetch(`${led_server_url}/load-matrix?timestamp=${matrixName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Removed access-control-allow-origin header
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function onDeleteClick() {
  // show confirmation prompt to user
  if (!confirm("Are you sure you want to delete this matrix?")) {
    return;
  }

  // Send request to server to delete matrix
  const matrixName = this.parentElement.parentElement.getAttribute("data-id");
  fetch(`${led_server_url}/delete-matrix?timestamp=${matrixName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Removed access-control-allow-origin header
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);

      // Delete all matrixes from page
      const matrixesElement = document.getElementById("matrix-list");
      matrixesElement.innerHTML = "";

      // Reload matrixes
      loadMatrixes();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function onDownloadClick() {
  // Save the matrix to a png file
  const matrixName = this.parentElement.parentElement.getAttribute("data-id");
  const matrixElement =
    this.parentElement.parentElement.querySelector(".matrix-grid");

  // Create a canvas element
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = 64;
  canvas.height = 32;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the matrix to the canvas
  matrixElement.childNodes.forEach((cell) => {
    const x = cell.getAttribute("data-x");
    const y = cell.getAttribute("data-y");
    const colour = cell.getAttribute("data-colour");

    ctx.fillStyle = colour;
    ctx.fillRect(x, y, 1, 1);
  });

  // Create a download link
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = `${matrixName}.png`;

  // Click the link
  link.click();
}
