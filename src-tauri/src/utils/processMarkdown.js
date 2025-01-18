import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Procesa un archivo Markdown.
 * Extrae la cabecera (frontmatter) y convierte el contenido a HTML.
 */
const markdown = process.argv[2]; // Obtener el Markdown del argumento

const { content, data } = matter(markdown); // Parsear el Markdown con gray-matter

const html = await Promise.resolve(marked(content)); // Convertir el contenido Markdown a HTML

// console.log(JSON.stringify({ html, frontmatter: data }));
console.log(html);
