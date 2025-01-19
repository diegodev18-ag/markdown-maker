const cssTemplate = `\
#preview {

    & h1 {
        
    }

    & h2 {
        
    }

    & h3 {
        
    }

    & p {
        
    }

    & ul {
        
    }

    & ol {
        
    }

    & li {
        
    }

    & a {
        
    }
    
    & blockquote {
        
        & p {
            
        }
    }
}
`

// Paths
const newStylesPath = "/tmp/markdownMaker/src/dinamicStyles.css";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await invoke("save_file", { filePath: newStylesPath, fileContent: cssTemplate });
    } catch (error) {
        console.error(error);
    }
});
