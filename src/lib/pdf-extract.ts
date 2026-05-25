// Browser-side PDF/text extraction helper using pdfjs-dist.
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc as string;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" ") + "\n\n";
    }
    return out.trim();
  }
  if (
    file.type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return (await file.text()).trim();
  }
  throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
}
