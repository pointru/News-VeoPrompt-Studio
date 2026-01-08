
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { OutputMode, PromptRequest } from "../types";

// API Key diambil dari process.env yang diinjeksi oleh Vite saat build
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
Anda adalah "Director AI" khusus untuk workflow Frame-to-Video (Image-to-Video). 
Tugas Anda adalah mengubah materi berita menjadi Naskah JSON presisi untuk menghidupkan gambar diam (still image).

## 1. PRINSIP UTAMA (FRAME-TO-VIDEO / I2V)
* **JANGAN MENDESKRIPSIKAN FISIK:** Karena visual berbasis gambar yang diupload pengguna, jangan pernah menulis deskripsi fisik (warna baju, bentuk wajah, warna rambut, dll) di dalam prompt.
* **FOKUS PADA AKSI:** Fokuskan instruksi pada ekspresi wajah, gerakan tangan, dan nada bicara.
* **SUBJEK:** Selalu rujuk karakter sebagai "The subject" atau "The anchor".

## 2. STRUKTUR SEGMENTASI (MINIMAL 6 KLIP)
Pecah naskah menjadi minimal 6 segmen adaptif:
1. Klip 1: Intro & Headline.
2. Klip 2-5: Detail berita, ulasan, atau data (Minimal 4 klip isi).
3. Klip Terakhir: Penutup & Outro.

## 3. ATURAN KAMERA: "SYMMETRY LOOP" (WAJIB)
Agar video bisa disambung (looping) tanpa patah, tambahkan instruksi ini di akhir 'veo3_prompt' untuk semua klip (kecuali klip terakhir):
"The shot begins in a medium frame, subtly zooms out in the middle to create negative space on the right, and perfectly returns to the original medium frame at the last second to ensure a seamless loop."

## 4. FORMAT OUTPUT (JSON)
{
  "program_name": "BEDAH BERITA",
  "project_title": "[Judul Topik Berdasarkan Sumber]",
  "summary_points": ["[Poin Berita 1]", "[Poin Berita 2]", "[Poin Berita 3]"],
  "total_clips": [Jumlah Klip, Minimal 6],
  "clips": [
    {
      "clip_id": 1,
      "duration": "8 seconds",
      "tone_of_voice": "[Contoh: Serius & Tegas / Ramah / Satir]",
      "dialogue": "[Naskah dubbing Bahasa Indonesia, max 20 kata]",
      "visual_action": "[Instruksi Gerakan: Misal 'The subject nods subtly while speaking']",
      "camera_logic": "0s: Medium shot. 4s: Subtle zoom out. 8s: Back to original frame.",
      "insert_point": {
        "time": "Detik 3-7",
        "position": "Sisi Kanan (Negative Space)",
        "content": "[Deskripsi Visual Pendukung untuk editor]"
      },
      "veo3_prompt": "[Prompt teknis lengkap: Bring this image to life. The subject is speaking with a [Tone] expression. [Visual Action]. + Kamera Symmetry Loop]"
    }
  ]
}
`;

export const generateNewsPrompts = async (request: PromptRequest): Promise<string> => {
  const { text, image, video, mode } = request;

  const parts: any[] = [
    { text: `MODE OUTPUT: ${mode}\nNARASI/KONTEKS: ${text || 'Analisa dari media sumber'}\nHarap buat MINIMAL 6 klip (Intro, 4+ Isi, 1 Outro).` }
  ];

  if (image) {
    parts.push({
      inlineData: { mimeType: image.mimeType, data: image.data.split(',')[1] }
    });
  }

  if (video) {
    parts.push({
      inlineData: { mimeType: video.mimeType, data: video.data.split(',')[1] }
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    return response.text || "Gagal memproses data.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gagal menghubungkan ke Engine AI.");
  }
};
