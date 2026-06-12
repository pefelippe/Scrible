// Transcribes uploaded audio files to text using OpenAI Whisper.
import fs from 'node:fs';
import OpenAI from 'openai';
import { HttpError } from '../lib/http-error';

const openai = new OpenAI();

export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(filePath),
    });
    return transcription.text;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new HttpError(502, 'Audio transcription failed. Please try again.');
  }
}
