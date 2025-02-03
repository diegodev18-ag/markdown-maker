const { platform } = window.__TAURI__.os;
const { invoke } = window.__TAURI__.core; // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

const cssTemplate = `\
#preview {
  & * {
    margin: 0;
    padding: 0;
  }
  
  & h1 {
    
  }

  & h2 {
    
  }

  & h3 {
    
  }

  & p {
    
  }

  & ul {
    
    & li {
      
    }
  }

  & ol {
    
    & li {
      
    }
  }

  & a {
    
  }

  & blockquote {
    
    & p {
      
    }
  }

  & code {
    
  }

  & pre {
    
    & code {
      
    }
  }

  & details {
    
    & summary {
      
    }
  }
}
`

let filesContainer = document.querySelector("#files-and-folders");
let fileActive;
let exButton;

let mode = "code";

const markdownCode = document.querySelector("#markdown-code");
const cssCode = document.querySelector("#styles-code");
const preview = document.querySelector("#preview");

// Functions
const currentPlatform = platform();

// Paths
let basePath = `/tmp`;
if (currentPlatform === "windows") {
  basePath = `C:/Windows/Temp`;
}
let fatherPath = `${basePath}/markdownMaker`;
let sourcePath = `${fatherPath}/src`;
let newStylesPath = `${sourcePath}/dinamicStyles.css`;
let markdownsPath = `${fatherPath}/markdowns`;


// Style
const style = document.createElement("style");

// Modes buttons
const codeButton = document.querySelector("#code-button");
const mdButton = document.querySelector("#md-button");

// Options
const downloadButton = document.querySelector("#download-button");
const searchInput = document.querySelector("#search-input");

// Timers
let delay = 500;

// Preview delay
let lastToExecute = 0;
let lastExecuted = 0;

// Styles delay
let lastToExecuteStyles = 0;
let lastExecutedStyles = 0;

async function saveFile(path, content) { // file_name: &str, file_path: &str, file_content: &str
  try {
    await invoke("save_file", { filePath: path, fileContent: content });
  } catch (error) {
    console.error(error);
  }
}

async function updatePreview(markdown) {
  let finalMarkdown = markdown;

  if (markdown.match(/---/g).length == 2) {
    finalMarkdown = markdown.replace("---", "");
  }

  const content = await invoke("process_markdown", { markdown: finalMarkdown });
  // console.log(content);
  preview.innerHTML = content[0];
}

async function createDir(name) {
  try {
    await invoke("create_dir", { dirPath: name });
  } catch (error) {
    console.error(error);
  }
}

async function updateStyles() {
  const content = await getFileContent(newStylesPath);
  style.innerHTML = content;
  // document.head.removeChild(style);
  document.head.removeChild(document.head.lastChild);
  document.head.appendChild(style);
}

async function downloadFile(filePath, fileName) {
  const downloadAlert = document.querySelector("#saved-alert");
  try {
    await invoke("download_file", { path: filePath, fileName: fileName });

    if (exButton) {
      downloadAlert.style.opacity = "1";

      setTimeout(() => {
        downloadAlert.style.opacity = "0";
      }, 3500);
    }
  } catch (error) {
    console.error(error);
  }
}

function initFiles() {
  const savedFolders = getFolders(markdownsPath);
  savedFolders.then((folders) => {
    folders.forEach((folder) => {
      newButton(folder, "", "folder-name");
      const savedFiles = getFiles(markdownsPath + `/${folder}`);
      savedFiles.then((files) => {
        files.forEach((file) => {
          const fullPath = markdownsPath + `/${folder}/${file}`;
          newButton(file.replace(".md", ""), fullPath, "file-name");
        });
      });
    });
  });

  const savedFiles = getFiles(markdownsPath);
  savedFiles.then((files) => {
    files.forEach((file) => {
      const fullPath = markdownsPath + `/${file}`;
      newButton(file.replace(".md", ""), fullPath, "file-name");
    });
  });

  createDir(fatherPath);
  createDir(markdownsPath);
  createDir(sourcePath);
}

function changeMode(newMode) {
  if (!fileActive) { return; }

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

async function getFolders(dirPath) {
  try {
    const folders = await invoke('get_folders', { dirPath: dirPath });
    return folders;
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

function newButton(fileName, id, className = "file-name") {
  const filesContainer = document.querySelector("#files-and-folders");
  const file = document.createElement("button");  
  if (className === "folder-name") {
    fileName += currentPlatform === "windows" ? "\\" : "/";
  }
  file.id = id;
  file.classList.add(className);
  file.textContent = fileName;
  filesContainer.appendChild(file);
}

function newFile(filePath, fileName, content) {
  if (fileName && filePath) {
    const fullPath = filePath + "/" + fileName + ".md";
    newButton(fileName, fullPath, "file-name");
    saveFile(fullPath, content);
    fileActive = fileName;
  }
}

async function changeActive(event, className) {
  if (className === "file-name") {  
    const fileName = event.target.textContent;
    const content = await getFileContent(event.target.id);
    fileActive = fileName;
    markdownCode.value = content;
    updatePreview(content);
  
    if (exButton) {
      exButton.classList.remove("active");
    } else {
      document.querySelector("#watermark").style.display = "none";
      changeMode("code");
      mdButton.style.cursor = "pointer";
      codeButton.style.cursor = "pointer";
      downloadButton.style.cursor = "pointer";
    }
    exButton = event.target;
    exButton.classList.add("active");
  }
}

async function initCss() {
  const getContent = await getFileContent(newStylesPath);
  if (getContent === "None" || getContent === "") {
    saveFile(newStylesPath, cssTemplate);
    cssCode.value = cssTemplate;
  } else {
    cssCode.value = getContent;
  }
} 

window.addEventListener("DOMContentLoaded", () => {
  initFiles();
  initCss();
  updateStyles();

  // Options
  const newFileButton = document.querySelector("#new-file");
  const newFolderButton = document.querySelector("#new-folder");
  
  codeButton.addEventListener("click", () => { changeMode("code") });
  mdButton.addEventListener("click", () => { changeMode("md") });

  searchInput.addEventListener("input", () => { search() });

  newFolderButton.addEventListener("click", async () => {
    const folderName = prompt("Enter the folder name:");
    createDir(`${markdownsPath}/${folderName}`);
  })

  newFileButton.addEventListener("click", async () => { 
    const fileName = prompt("Enter the file name (the md extension is added after the file is created):");
    let found = false;
    Array.from(filesContainer.children).forEach((file) => {
      if (file.textContent === fileName) {
        alert("This file already exists");
        found = true;
        return;
      }
    })
    if (!found) {
      newFile(markdownsPath, fileName, "---\n\n---\n\n");
    }
  });

  filesContainer.addEventListener("contextmenu", (event) => {
    if (event.target.id === "files-and-folders" || event.target.classList[0] === "folder-name") { return; }

    event.preventDefault();
    const response = confirm("Do you want to delete this file?");
    if (response) {
      const fileName = event.target.textContent;
      const filePath = `${markdownsPath}/${fileName}.md`;
      invoke("delete_file", { filePath: filePath });
      event.target.remove();
    }
  })

  filesContainer.addEventListener("click", async (event) => {
    // console.log(event.target.classList[0]);
    if (event.target.id === "files-and-folders") { return; }

    changeActive(event, event.target.classList[0]);
  });

  downloadButton.addEventListener("click", async () => {
    await downloadFile(markdownsPath + `/${fileActive}.md`, fileActive);
  });

  cssCode.addEventListener("keydown", async (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const space = 2;
      const start = cssCode.selectionStart; // Obtener el contenido actual del textarea
      const end = cssCode.selectionEnd;
      cssCode.value = cssCode.value.substring(0, start) + ' '.repeat(space) + cssCode.value.substring(end); // Insertar 4 espacios en la posición del cursor
      cssCode.selectionStart = cssCode.selectionEnd = start + space; // Mover el cursor después de los 4 espacios insertados
    }
    lastToExecuteStyles += 1;

    setTimeout(() => {
      lastExecutedStyles += 1;
      if (lastToExecuteStyles === lastExecutedStyles) {
        saveFile(newStylesPath, cssCode.value);
        updatePreview(markdownCode.value);
        updateStyles();
        lastExecutedStyles = 0;
        lastToExecuteStyles = 0;
      }
    }, delay);
  });

  markdownCode.addEventListener("input", () => {
    lastToExecute += 1;

    setTimeout(() => {
      lastExecuted += 1;
      if (lastToExecute === lastExecuted) {
        saveFile(markdownsPath + `/${fileActive}.md`, markdownCode.value);
        updatePreview(markdownCode.value);
        lastExecuted = 0;
        lastToExecute = 0;
      }
    }, delay);
  });

  updateStyles();
});
