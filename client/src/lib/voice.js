// Thin wrapper over Web Speech API SpeechRecognition. No audio storage
// — we only ever surface the transcript to the caller. Returns null
// from createRecognizer() if the browser doesn't support it.

export function isSpeechSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * createRecognizer({ onResult, onError, onEnd })
 * Returns { start, stop } or null if unsupported.
 *
 * onResult fires once per intermediate update with { transcript, isFinal }.
 * The transcript is the full running text since start().
 */
export function createRecognizer({ onResult, onError, onEnd, lang = "es-CO" } = {}) {
  if (!isSpeechSupported()) return null;

  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = false;       // single utterance per session
  rec.interimResults = true;    // surface partials so the UI feels live
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    let transcript = "";
    let isFinal = false;
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
      if (e.results[i].isFinal) isFinal = true;
    }
    onResult?.({ transcript: transcript.trim(), isFinal });
  };
  rec.onerror = (e) => onError?.(e.error || "speech-error");
  rec.onend = () => onEnd?.();

  return {
    start() { try { rec.start(); } catch {} },
    stop()  { try { rec.stop();  } catch {} },
  };
}
