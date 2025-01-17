// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_file(file_name: &str, file_content: &str) {
    use std::fs::File;
    use std::io::Write;

    let mut file = File::create(format!("../content/{}", file_name)).expect("Unable to create file");
    file.write_all(file_content.as_bytes())
        .expect("Unable to write data");

    println!("File saved successfully");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
