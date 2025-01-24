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
`        

let filesContainer = document.querySelector("#files");
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
  const savedFiles = getFiles(markdownsPath);
  savedFiles.then((files) => {
    files.forEach((file) => {
      newButton(file.replace(".md", ""));
    });
  });

  initFiles();
  initCss();
  updateStyles();

  // Options
  const newFileButton = document.querySelector("#new-file");
  
  codeButton.addEventListener("click", () => { changeMode("code") });
  mdButton.addEventListener("click", () => { changeMode("md") });

  searchInput.addEventListener("input", () => { search() });

  newFileButton.addEventListener("click", async () => { 
    const fileName = prompt("Enter the file name (the md extension is added after the file is created):");
    newFile(markdownsPath, fileName, "---\n\n---\n\n"); 
  });

  filesContainer.addEventListener("click", async (event) => {
    if (event.target.id === "files") { return; }

    const fileName = event.target.textContent;
    const content = await getFileContent(`${markdownsPath}/${fileName}.md`);
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
  });

  downloadButton.addEventListener("click", async () => {
    await downloadFile(markdownsPath + `/${fileActive}.md`, fileActive);
  });

  cssCode.addEventListener("keydown", async (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = cssCode.selectionStart; // Obtener el contenido actual del textarea
      const end = cssCode.selectionEnd;
      cssCode.value = cssCode.value.substring(0, start) + '    ' + cssCode.value.substring(end); // Insertar 4 espacios en la posición del cursor
      cssCode.selectionStart = cssCode.selectionEnd = start + 4; // Mover el cursor después de los 4 espacios insertados
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
