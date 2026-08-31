import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import XLSX from "xlsx";
import JSZip from "jszip";

const IMAGE = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const AUDIO = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"];
const VIDEO = ["video/mp4", "video/mpeg", "video/webm", "video/quicktime"];

export async function fileToGeminiParts(filePath, mimetype, originalname) {
  const buffer = fs.readFileSync(filePath);

  if (IMAGE.includes(mimetype) || AUDIO.includes(mimetype) || VIDEO.includes(mimetype) || mimetype === "application/pdf") {
    return [{ inline_data: { mime_type: mimetype, data: buffer.toString("base64") } }];
  }

  if (mimetype.includes("word") || originalname.match(/\.docx?$/i)) {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return [{ text: `Content extracted from Word document "${originalname}":\n\n${value.slice(0, 20000)}` }];
    } catch {
      return [{ text: `A Word document named "${originalname}" was uploaded but its text could not be extracted.` }];
    }
  }

  if (mimetype.includes("sheet") || mimetype.includes("excel") || originalname.match(/\.xlsx?$/i)) {
    try {
      const wb = XLSX.read(buffer, { type: "buffer" });
      let text = "";
      for (const sheetName of wb.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
        text += `\n--- Sheet: ${sheetName} ---\n${csv}`;
      }
      return [{ text: `Data extracted from spreadsheet "${originalname}":\n${text.slice(0, 20000)}` }];
    } catch {
      return [{ text: `A spreadsheet named "${originalname}" was uploaded but its data could not be parsed.` }];
    }
  }

  if (mimetype.includes("presentation") || originalname.match(/\.pptx?$/i)) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort();
      let text = "";
      for (const f of slideFiles) {
        const xml = await zip.files[f].async("text");
        const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map((m) => m[1]);
        text += `\n--- ${path.basename(f)} ---\n${matches.join(" ")}`;
      }
      return [{ text: `Text extracted from PowerPoint "${originalname}":\n${text.slice(0, 20000)}` }];
    } catch {
      return [{ text: `A PowerPoint file named "${originalname}" was uploaded but its slides could not be parsed.` }];
    }
  }

  try {
    const text = buffer.toString("utf8");
    return [{ text: `Content of "${originalname}":\n\n${text.slice(0, 20000)}` }];
  } catch {
    return [{ text: `A file named "${originalname}" (${mimetype}) was uploaded but couldn't be read.` }];
  }
}
