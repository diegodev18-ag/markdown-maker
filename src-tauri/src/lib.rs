// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_file(file_path: &str, file_content: &str) {
    use std::fs::File;
    use std::io::Write;

    // println!("Saving file -> {}", file_path);

    let mut file = File::create(file_path).expect("Unable to create file");
    file.write_all(file_content.as_bytes())
        .expect("Unable to write data");

    // println!("File saved successfully");
}

#[tauri::command]
fn create_dir(dir_path: &str) {
    use std::path::Path;
    use std::fs;
    let path = Path::new(&dir_path);

    if !path.exists() {
        fs::create_dir_all(path).expect("Unable to create directory");
        println!("Directory created successfully -> {}", dir_path);
    }
    // else {
    //     println!("Directory already exists -> {}", dir_path);
    // }
}

#[tauri::command]
fn get_files(dir_path: &str) -> Vec<String> {
    use std::fs;
    use std::path::Path;
    let path = Path::new(&dir_path);
    let mut files = Vec::new();

    if path.is_dir() {
        for entry in fs::read_dir(path).expect("Unable to read directory") {
            let entry = entry.expect("Unable to get entry");
            let path = entry.path();
            if path.is_file() {
                let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
                files.push(file_name);
            }
        }
    }

    files
}

#[tauri::command]
fn get_file_content(file_path: &str) -> String {
    use std::fs::File;
    use std::io::Read;

    let mut content = String::new();
    match File::open(file_path) {
        Ok(mut file) => {
            if let Err(_) = file.read_to_string(&mut content) {
                content = String::from("Unable to read file content");
            }
        }
        Err(_) => {
            content = String::from("None");
        }
    }

    content
}

#[tauri::command]
fn process_markdown(markdown: String) -> Result<String, String> {
    // Ejecuta el script de Node.js con el contenido Markdown como argumento
    let output = Command::new("node")
        .arg("src/utils/processMarkdown.js")
        .arg(markdown)
        .output()
        .map_err(|e| e.to_string())?;

    // println!("status: {}", output.status);
    // println!("stderr: {}", String::from_utf8_lossy(&output.stderr));

    // Captura la salida estándar del script
    let result = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, save_file, create_dir, get_files, get_file_content, process_markdown
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
