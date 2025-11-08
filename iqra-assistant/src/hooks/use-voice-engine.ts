'use client';

import { useCallback, useEffect, useRef, useState } from "react";

type VoicePreference = {
  lang: "en-US" | "en-GB" | "ur-PK";
  nameMatches: string[];
};

const PREFERRED_VOICES: VoicePreference[] = [
  { lang: "ur-PK", nameMatches: ["Google اردو"] },
  { lang: "en-GB", nameMatches: ["Female", "Microsoft Sonia", "Google UK English Female"] },
  { lang: "en-US", nameMatches: ["Female", "Samantha", "Joanna", "Google US English"] },
];

const FALLBACK_URDU = "ur-PK";
const FALLBACK_ENGLISH = "en-GB";

export function useVoiceEngine() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthesis =
    typeof window !== "undefined" ? window.speechSynthesis : undefined;
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (!synthesis) return;

    const populate = () => {
      const available = synthesis.getVoices();
      if (available.length) {
        setVoices(available);
      }
    };

    populate();
    synthesis.onvoiceschanged = populate;

    return () => {
      if (synthesis) {
        synthesis.onvoiceschanged = null;
      }
    };
  }, [synthesis]);

  const findVoice = useCallback(
    (langHint: "en" | "ur" | "mixed") => {
      if (!voices.length) return undefined;
      if (langHint === "ur") {
        const preferred = voices.find((voice) => voice.lang.startsWith("ur"));
        if (preferred) return preferred;
        return voices.find((voice) => voice.lang.startsWith("en-GB"));
      }

      const priorities = PREFERRED_VOICES.filter((config) => {
        if (langHint === "en") {
          return config.lang.startsWith("en");
        }
        return true;
      });

      for (const config of priorities) {
        const match = voices.find(
          (voice) =>
            voice.lang === config.lang ||
            config.nameMatches.some((needle) =>
              voice.name.toLowerCase().includes(needle.toLowerCase()),
            ),
        );
        if (match) return match;
      }

      if (langHint === "en") {
        return voices.find((voice) => voice.lang.startsWith("en"));
      }
      return voices[0];
    },
    [voices],
  );

  const speak = useCallback(
    (text: string, langHint: "en" | "ur" | "mixed" = "en") => {
      if (!synthesis || !text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = findVoice(langHint);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = langHint === "ur" ? FALLBACK_URDU : FALLBACK_ENGLISH;
      }

      utterance.pitch = langHint === "ur" ? 1.05 : 0.98;
      utterance.rate = 0.92;
      utterance.volume = 0.95;

      synthesis.cancel();
      synthesis.speak(utterance);
      isReadyRef.current = true;
    },
    [findVoice, synthesis],
  );

  const cancel = useCallback(() => {
    if (!synthesis || !isReadyRef.current) return;
    synthesis.cancel();
  }, [synthesis]);

  return {
    speak,
    cancel,
    supported: Boolean(synthesis),
  };
}
