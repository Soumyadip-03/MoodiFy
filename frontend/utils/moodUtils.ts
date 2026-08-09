export type Emotion = "happy" | "surprise" | "neutral" | "sad" | "fear" | "disgust" | "angry";
export type Mood = "happy" | "upbeat" | "chill" | "melancholy" | "relaxing" | "romantic" | "intense";

export const emotionToMood: Record<Emotion, Mood> = {
  happy: "happy",
  surprise: "upbeat",
  neutral: "chill",
  sad: "melancholy",
  fear: "relaxing",
  disgust: "romantic",
  angry: "intense",
};

export const moodLabels: Record<Mood, string> = {
  happy: "Happy",
  upbeat: "Upbeat",
  chill: "Chill",
  melancholy: "Melancholy",
  relaxing: "Relaxing",
  romantic: "Romantic",
  intense: "Intense",
};

export function getMoodFromEmotion(emotion: string): Mood | null {
  return emotionToMood[emotion as Emotion] ?? null;
}
