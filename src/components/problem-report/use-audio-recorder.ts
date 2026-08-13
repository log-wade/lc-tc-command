"use client";

import { useEffect, useRef, useState } from "react";

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const acquisitionGenerationRef = useRef(0);
  const acquiringRef = useRef(false);

  useEffect(() => {
    return () => {
      acquisitionGenerationRef.current += 1;
      acquiringRef.current = false;
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording(): Promise<void> {
    setRecorderError(null);
    if (acquiringRef.current || recorderRef.current?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecorderError("Audio recording is not supported in this browser.");
      return;
    }

    const generation = acquisitionGenerationRef.current + 1;
    acquisitionGenerationRef.current = generation;
    acquiringRef.current = true;
    setAcquiring(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== acquisitionGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const activeStream = stream;
      const supportedType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = supportedType
        ? new MediaRecorder(activeStream, { mimeType: supportedType })
        : new MediaRecorder(activeStream);

      chunksRef.current = [];
      streamRef.current = activeStream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setRecorderError("The recording stopped unexpectedly. Please try again.");
        setRecording(false);
        activeStream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        streamRef.current = null;
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (generation === acquisitionGenerationRef.current) {
        setRecorderError(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Microphone permission was denied. You can still type your report."
            : "Could not start the microphone. Please try again."
        );
      }
    } finally {
      if (generation === acquisitionGenerationRef.current) {
        acquiringRef.current = false;
        setAcquiring(false);
      }
    }
  }

  async function stopRecording(): Promise<Blob> {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      throw new Error("No recording is in progress.");
    }

    return new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        recorder.stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
        setRecording(false);

        if (blob.size === 0) {
          reject(new Error("The recording was empty. Please try again."));
          return;
        }
        resolve(blob);
      };
      recorder.stop();
    });
  }

  function cancelRecording(): void {
    acquisitionGenerationRef.current += 1;
    acquiringRef.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    setAcquiring(false);
    setRecording(false);
  }

  return {
    recording,
    acquiring,
    recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export type AudioRecorderController = ReturnType<typeof useAudioRecorder>;
