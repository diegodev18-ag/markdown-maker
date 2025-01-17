// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_file(file_path: &str, file_content: &str) {
    use std::fs::File;
    use std::io::Write;

    let mut file = File::create(file_path).expect("Unable to create file");
    file.write_all(file_content.as_bytes())
        .expect("Unable to write data");

    println!("File saved successfully");
}

#[tauri::command]
fn create_dir(dir_path: &str) {
    use std::path::Path;
    use std::fs;
    let path = Path::new(&dir_path);

    if !path.exists() {
        fs::create_dir_all(path).expect("Unable to create directory");
        println!("Directory created successfully -> {}", dir_path);
    } else {
        println!("Directory already exists -> {}", dir_path);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_file, create_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
