const { invoke } = window.__TAURI__.core; // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

let filesContainer = document.querySelector("#files");
let fileActive;

let mode = "code";

const markdownCode = document.querySelector("#mardown-code");
const cssCode = document.querySelector("#styles-code");
const preview = document.querySelector("#preview");

async function saveFile(path, content) { // file_name: &str, file_path: &str, file_content: &str
  try {
    await invoke("save_file", { filePath: path, fileContent: content });
  } catch (error) {
    console.error(error);
  }
}

async function createDir(name) {
  try {
    await invoke("create_dir", { dirPath: name });
  } catch (error) {
    console.error(error);
  }
}

function changeMode(newMode, codeButton, mdButton) {
  const codeEditor = document.querySelector("#code-editor");
  const mdEditor = document.querySelector("#markdown-editor");

  if (newMode === "code") {
    codeButton.classList.add("active");
    codeEditor.style.display = "grid";
    mdButton.classList.remove("active");
    mdEditor.style.display = "none";
    mode = "code";
  } else if (newMode === "md") {
    mdButton.classList.add("active");
    mdEditor.style.display = "grid";
    codeButton.classList.remove("active");
    codeEditor.style.display = "none";
    mode = "md";
  }
}

function search() {
  const searchInput = document.querySelector("#search-input");
  const query = searchInput.value;
  if (query) {
    filesContainer.childNodes.forEach((file) => {
      const fileName = file.textContent;
      if (fileName.includes(query)) {
        file.style.display = "block";
      } else {
        file.style.display = "none";
      }
    });
  } else {
    filesContainer.childNodes.forEach((file) => {
      file.style.display = "block";
    });
  }
}

async function getFiles(dirPath) {
  try {
    const files = await invoke('get_files', { dirPath: dirPath });
    return files;
  } catch (error) {
    console.error(error);
    return []; // O algo que se maneje en caso de error
  }
}

async function getFileContent(filePath) {
  try {
    const content = await invoke('get_file_content', { filePath: filePath });
    return content;
  } catch (error) {
    console.error(error);
    return ""; // O algo que se maneje en caso de error
  }
}

function newButton(fileName) {
  const filesContainer = document.querySelector("#files");
  const file = document.createElement("button");
  file.classList.add("file-name");
  file.textContent = fileName;
  filesContainer.appendChild(file);
}

function newFile(filePath, fileName, content) {
  if (fileName && filePath) {
    newButton(fileName);
    const fullPath = filePath + "/" + fileName + ".md";
    saveFile(fullPath, content);
    fileActive = fileName;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const savedFiles = getFiles("../content/markdowns");
  savedFiles.then((files) => {
    files.forEach((file) => {
      newButton(file.replace(".md", ""));
    });
  });

  createDir("../content");
  createDir("../content/markdowns");
  createDir("../content/src");

  // Toggle between code and markdown
  const codeButton = document.querySelector("#code-button");
  const mdButton = document.querySelector("#md-button");
  
  // Search
  const searchButton = document.querySelector("#search-button");

  // Options
  const newFileButton = document.querySelector("#new-file");
  
  codeButton.addEventListener("click", () => { changeMode("code", codeButton, mdButton) });
  mdButton.addEventListener("click", () => { changeMode("md", codeButton, mdButton) });

  searchButton.addEventListener("click", () => { search() });

  newFileButton.addEventListener("click", async () => { 
    const fileName = prompt("Enter the file name (the md extension is added after the file is created):");
    newFile("../content/markdowns", fileName, "") 
  });

  filesContainer.addEventListener("click", async (event) => {
    const fileName = event.target.textContent;
    const filePath = "../content/markdowns";
    const content = await getFileContent(`${filePath}/${fileName}.md`);
    fileActive = fileName;
    markdownCode.value = content;
  });
});
