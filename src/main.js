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
let fileActive = { name: "", path: "" };
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

async function downloadFile() {
  const downloadAlert = document.querySelector("#saved-alert");
  try {
    await invoke("download_file", { path: fileActive.path, fileName: fileActive.name });

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

async function initFiles() {
  const savedFolders = await getFolders(markdownsPath);
  for (const folder of savedFolders) {
    const fullPathFolder = markdownsPath + `/${folder}`;
    newButton(folder, fullPathFolder, "folder-name");
    const savedFiles = await getFiles(markdownsPath + `/${folder}`);
    for (const file of savedFiles) {
      const fullPathFile = markdownsPath + `/${folder}/${file}`;
      newButton(file.replace(".md", ""), fullPathFile, "file-name", null, "child-file-name");
    }
  }

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
  if (!fileActive.name || !fileActive.path) { return; }

  const codeEditor = document.querySelector("#code-editor");

  if (newMode === "none") {
    codeButton.classList.remove("active");
    codeEditor.style.display = "none";
    mdButton.classList.remove("active");
    mode = "none";
  } else if (newMode === "code") {
    codeButton.classList.add("active");
    codeEditor.style.display = "grid";
    mdButton.classList.remove("active");
    mode = "code";
  } else if (newMode === "md") {
    mdButton.classList.add("active");
    codeButton.classList.remove("active");
    codeEditor.style.display = "none";
    mode = "md";
  }
}

function search() {
  const query = searchInput.value;
  if (query) {
    const found = [];
    filesContainer.childNodes.forEach((file) => {
      const fileName = file.textContent;
      if (fileName.includes(query)) {
        file.style.display = "block";
        found.push(file);
      } else {
        file.style.display = "none";
      }
    });
    return found ?? [];
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

function newButton(fileName, id, className = "file-name", reference, ...classes) {
  const filesContainer = document.querySelector("#files-and-folders");
  const file = document.createElement("button");
  if (className === "folder-name") {
    fileName += currentPlatform === "windows" ? "\\" : "/";
  }
  file.id = id;
  file.classList.add(className);
  file.classList.add(...classes);
  file.textContent = fileName;
  if (reference) {
    filesContainer.insertBefore(file, reference);
  } else {
    filesContainer.appendChild(file);
  }
}

function newFile(filePath, fileName, content, reference, ...classes) {
  if (fileName && filePath) {
    const fullPath = filePath + "/" + fileName + ".md";
    newButton(fileName, fullPath, "file-name", reference, ...classes);
    saveFile(fullPath, content);
    // fileActive.name = fileName;
    // fileActive.path = fullPath;
  }
}

async function changeActive(event) {
  if (event === "none") {
    exButton.classList.remove("active");
    exButton = null;
    mdButton.style.cursor = "not-allowed";
    codeButton.style.cursor = "not-allowed";
    downloadButton.style.cursor = "not-allowed";
    changeMode("none");
    document.querySelector("#watermark").style.display = "flex";
    return;
  }

  if (event.classList[0] === "file-name") {  
    const content = await getFileContent(event.id);
    fileActive.name = event.textContent;
    fileActive.path = event.id;
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
    exButton = event;
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

function initPrompt(question, placeholder = "", add = "Press enter to continue...") {
  return new Promise((resolve) => {
    // Crear elementos
    const promptContainer = document.createElement("div");
    const promptQuestion = document.createElement("h5");
    const promptAdd = document.createElement("p");
    const promptInput = document.createElement("input");
    const promptQuit = document.createElement("button");

    // Añadir clases
    promptContainer.classList.add("prompt-container");
    promptQuit.classList.add("prompt-quit");
    promptQuestion.classList.add("prompt-question");
    promptAdd.classList.add("prompt-add");
    promptInput.classList.add("prompt-input");

    // Agregar contenido y estilos
    promptQuit.innerHTML = '<svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>';
    promptQuestion.textContent = question;
    promptAdd.textContent = add;
    promptInput.placeholder = placeholder;

    // Agregar elementos al contenedor
    promptContainer.appendChild(promptQuit);
    promptContainer.appendChild(promptQuestion);
    promptContainer.appendChild(promptAdd);
    promptContainer.appendChild(promptInput);
    document.body.appendChild(promptContainer);

    // Capturar la entrada del usuario
    promptInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        resolve(promptInput.value);
        document.body.removeChild(promptContainer);
      } else if (event.key === "Escape") {
        resolve(null);
        document.body.removeChild(promptContainer);
      }
    });

    // Cerrar el prompt
    promptQuit.addEventListener("click", function () {
      resolve(null);
      document.body.removeChild(promptContainer);
    });

    // Poner foco en el input
    promptInput.focus();
  });
}

function initConfirm(question) {
  return new Promise((resolve) => {
    // Crear elementos
    const confirmContainer = document.createElement("div");
    const confirmQuestion = document.createElement("p");
    const confirmButtonContainer = document.createElement("div");
    const confirmYesButton = document.createElement("button");
    const confirmNoButton = document.createElement("button");

    // Añadir clases
    confirmContainer.classList.add("confirm-container");
    confirmQuestion.classList.add("confirm-question");
    confirmButtonContainer.classList.add("confirm-button-container");
    confirmYesButton.classList.add("confirm-button");
    confirmNoButton.classList.add("confirm-button");

    // Agregar contenido y estilos
    confirmQuestion.textContent = question;
    confirmYesButton.textContent = "Yes";
    confirmNoButton.textContent = "No";

    // Agregar elementos al contenedor
    confirmContainer.appendChild(confirmQuestion);
    confirmContainer.appendChild(confirmButtonContainer);
    confirmButtonContainer.appendChild(confirmYesButton);
    confirmButtonContainer.appendChild(confirmNoButton);
    document.body.appendChild(confirmContainer);

    // Capturar la entrada del usuario
    confirmYesButton.addEventListener("click", function () {
      resolve(true);
      document.body.removeChild(confirmContainer);
    });

    confirmNoButton.addEventListener("click", function () {
      resolve(false);
      document.body.removeChild(confirmContainer);
    });
  });
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
    // const folderName = prompt("Enter the folder name:");
    const folderName = await initPrompt("Enter the folder name:");
    if (folderName) {
      const fullPath = markdownsPath + `/${folderName}`;
      createDir(fullPath);
      newButton(folderName, fullPath, "folder-name");
    }
  })

  newFileButton.addEventListener("click", async () => { 
    const fileName = await initPrompt("Enter the file name (the md extension is added after the file is created):");
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

  filesContainer.addEventListener("contextmenu", async (event) => {
    if (event.target.id === "files-and-folders") { return; }

    event.preventDefault();
    if (event.target.classList[0] === "file-name") { // File
      const response = await initConfirm("Do you want to delete this file?");
      if (response) {
        const filePath = event.target.id;
        changeActive("none");
        invoke("delete_file", { filePath: filePath });
        event.target.remove();
      }
    } else { // Folder
      const response = await initPrompt(`Enter the file name to create in \"${event.target.textContent}\" (the md extension is added after the file is created):`)
      if (response) {
        const fullPath = markdownsPath + `/${event.target.textContent.replace(currentPlatform === 'windows' ? '\\' : '/', '')}`;
        const reference = event.target.nextSibling;
        newFile(fullPath, response, "---\n\n---\n\n", reference, "child-file-name");
      }
    }
  })

  filesContainer.addEventListener("click", async (event) => {
    // console.log(event.target.classList[0]);
    if (event.target.id === "files-and-folders" || event.target.classList[0] === "folder-name") { return; }
    changeActive(event.target);
  });

  downloadButton.addEventListener("click", async () => {
    await downloadFile();
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
        saveFile(fileActive.path, markdownCode.value);
        updatePreview(markdownCode.value);
        lastExecuted = 0;
        lastToExecute = 0;
      }
    }, delay);
  });

  updateStyles();
});
