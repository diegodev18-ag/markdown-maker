// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use comrak::{markdown_to_html, ComrakOptions};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct Frontmatter {
    title: Option<String>,
    date: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn get_home_directory() -> Result<String, String> {
    use dirs;

    match dirs::home_dir() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("No se pudo obtener el directorio Home del usuario".to_string()),
    }
}

#[tauri::command]
fn download_file(path: &str, file_name: &str) {
    use std::fs;

    let home_dir = match get_home_directory() {
        Ok(dir) => dir,
        Err(err) => {
            eprintln!("Error: {}", err);
            return;
        }
    };

    // println!("File copied successfully");
    fs::copy(
        path,
        format!("{}/{}/{}.md", home_dir, "/Downloads", file_name),
    )
    .expect("Unable to copy file");
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
    use std::fs;
    use std::path::Path;
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
fn process_markdown(markdown: String) -> Result<(String, Frontmatter), String> {
    // Divide el frontmatter y el contenido
    let parts: Vec<&str> = markdown.splitn(2, "---").collect();
    if parts.len() < 2 {
        return Err("Invalid Markdown: Missing frontmatter".to_string());
    }

    let frontmatter: Frontmatter = serde_yaml::from_str(parts[0])
        .map_err(|e| format!("Failed to parse frontmatter: {}", e))?;
    let html = markdown_to_html(parts[1], &ComrakOptions::default());

    Ok((html, frontmatter))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_file,
            create_dir,
            get_files,
            get_file_content,
            process_markdown,
            download_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
