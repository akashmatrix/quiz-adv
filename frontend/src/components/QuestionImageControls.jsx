import React, { useRef, useState } from "react";
import api from "../api/axios.js";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export default function QuestionImageControls({ question, onChange, context = "" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const upload = async (file) => {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setError("Use JPG, PNG or WEBP only.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError("Image must be 5 MB or smaller.");
    }

    setBusy(true);
    try {
      const fileData = await readFileAsDataUrl(file);
      const { data } = await api.post("/images/upload", {
        fileName: file.name,
        fileData,
      });
      onChange({ imageUrl: data.imageUrl, imageSource: "upload" });
      setMode("");
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const buildBestPrompt = async () => {
    setError("");
    if (!question.questionText?.trim()) {
      setError("Enter the question first.");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post("/images/prompt", {
        questionText: question.questionText,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        context,
      });
      setAiPrompt(data.prompt || "");
      setShowPrompt(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the AI image prompt.");
    } finally {
      setBusy(false);
    }
  };

  const generate = async (promptToUse = "") => {
    setError("");
    if (!question.questionText?.trim() && !promptToUse.trim()) {
      setError("Enter the question first.");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post("/images/generate", {
        questionText: question.questionText,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        context,
        prompt: promptToUse.trim() || undefined,
      });
      onChange({
        imageUrl: data.imageUrl,
        imageSource: "ai",
        imagePrompt: promptToUse.trim() || aiPrompt,
      });
      setMode("");
    } catch (err) {
      setError(err.response?.data?.message || "AI image generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const chooseBest = async () => {
    setMode("best");
    await buildBestPrompt();
  };

  const chooseCustom = () => {
    setMode("custom");
    setShowPrompt(true);
    if (!aiPrompt) {
      setAiPrompt("");
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-4">
      <div>
        <p className="font-semibold text-gray-200">
          Question Image <span className="font-normal text-gray-500">(optional)</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Upload your own image, generate the best visual for this question, or write your own AI prompt.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 disabled:opacity-50"
        >
          <div className="font-semibold">🖼️ Upload Image</div>
          <div className="mt-1 text-xs text-gray-500">JPG, PNG or WEBP</div>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={chooseBest}
          className={`rounded-xl border px-4 py-3 text-left hover:bg-cyan-500/10 disabled:opacity-50 ${mode === "best" ? "border-cyan-400/50 bg-cyan-500/10" : "border-cyan-400/20 bg-cyan-500/[0.05]"}`}
        >
          <div className="font-semibold text-cyan-200">🤖 AI Image — Best for Question</div>
          <div className="mt-1 text-xs text-gray-500">AI analyzes the question and creates a focused visual prompt.</div>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={chooseCustom}
          className={`rounded-xl border px-4 py-3 text-left hover:bg-purple-500/10 disabled:opacity-50 ${mode === "custom" ? "border-purple-400/50 bg-purple-500/10" : "border-purple-400/20 bg-purple-500/[0.05]"}`}
        >
          <div className="font-semibold text-purple-200">✍️ Custom AI Image</div>
          <div className="mt-1 text-xs text-gray-500">Write or edit the exact image prompt yourself.</div>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {(mode === "best" || mode === "custom") && showPrompt && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {mode === "best" ? "AI Image Prompt" : "Custom Image Prompt"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {mode === "best" ? "Review it before generating. You can edit it if needed." : "Describe exactly what you want the image model to create."}
              </p>
            </div>
            {mode === "best" && busy && <span className="text-xs text-cyan-300">Creating prompt...</span>}
          </div>

          <textarea
            rows={6}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={mode === "custom" ? "Example: A clean textbook illustration showing..." : "AI-generated visual prompt will appear here..."}
            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none focus:border-cyan-400"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "best" && !aiPrompt && (
              <button type="button" disabled className="rounded-lg border border-white/10 px-4 py-2 text-xs opacity-50">
                Generate Image
              </button>
            )}
            <button
              type="button"
              disabled={busy || !aiPrompt.trim()}
              onClick={() => generate(aiPrompt)}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              ✨ {busy ? "Generating..." : "Generate Image"}
            </button>
            {mode === "best" && aiPrompt && (
              <button
                type="button"
                disabled={busy}
                onClick={buildBestPrompt}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                ↻ Regenerate Prompt
              </button>
            )}
          </div>
        </div>
      )}

      {question.imageUrl && (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <img src={question.imageUrl} alt="Question visual" className="max-h-72 w-full object-contain" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-xs">
            <span className="text-gray-500">
              {question.imageSource === "ai" ? "AI generated" : "Uploaded image"}
            </span>
            <div className="flex gap-3">
              {question.imageSource === "ai" && question.imagePrompt && (
                <button type="button" onClick={() => { setAiPrompt(question.imagePrompt); setMode("custom"); setShowPrompt(true); }} className="text-cyan-300 hover:text-cyan-200">
                  View / Edit Prompt
                </button>
              )}
              <button type="button" onClick={() => onChange({ imageUrl: "", imageSource: "", imagePrompt: "" })} className="text-red-300 hover:text-red-200">
                Remove image
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300">⚠️ {error}</p>}
    </div>
  );
}
