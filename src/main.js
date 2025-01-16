const { invoke } = window.__TAURI__.core;

let files = document.querySelectorAll(".file-name");

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
}

window.addEventListener("DOMContentLoaded", () => {
  // Toggle between code and markdown
  const codeButton = document.querySelector("#code-button");
  const mdButton = document.querySelector("#md-button");
  // Search
  const searchInput = document.querySelector("#search-input");
  const searchButton = document.querySelector("#search-button");
  
  codeButton.addEventListener("click", () => {
    codeButton.classList.add("active");
    mdButton.classList.remove("active");
  });

  mdButton.addEventListener("click", () => {
    mdButton.classList.add("active");
    codeButton.classList.remove("active");
  });

  searchButton.addEventListener("click", () => {
    const query = searchInput.value;
    if (query) {
      files.forEach((file) => {
        const fileName = file.textContent;
        if (fileName.includes(query)) {
          file.style.display = "block";
        } else {
          file.style.display = "none";
        }
      });
    } else {
      files.forEach((file) => {
        file.style.display = "block";
      });
    }
  });
});
