const { invoke } = window.__TAURI__.core;

let codeButton;
let mdButton;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
}

window.addEventListener("DOMContentLoaded", () => {
  codeButton = document.querySelector("#code-button");
  mdButton = document.querySelector("#md-button");
  
  codeButton.addEventListener("click", () => {
    codeButton.classList.add("active");
    mdButton.classList.remove("active");
  });

  mdButton.addEventListener("click", () => {
    mdButton.classList.add("active");
    codeButton.classList.remove("active");
  });
});
