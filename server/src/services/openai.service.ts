import OpenAI from 'openai';
import { SlideContent } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert educational content creator and teacher's assistant.
Your job is to create well-structured, engaging PowerPoint slide content for classroom presentations.

When given a topic and grade level, generate exactly 10 slides.
Respond ONLY with a valid JSON array — no markdown, no backticks, no explanation, no preamble.

Format:
[
  {
    "slideNumber": 1,
    "title": "Slide title here",
    "bullets": [
      "Key point one",
      "Key point two",
      "Key point three"
    ],
    "speakerNotes": "Notes for the teacher to elaborate on this slide"
  }
]

Rules:
- Slide 1 is always a Title slide with the topic as title and subtitle 'A Classroom Presentation'
- Slide 10 is always a Summary or Q&A slide
- Bullet points should be concise and appropriate for the grade level
- Kinder: very simple, 3-5 words per bullet, fun language
- Elementary: simple sentences, relatable examples
- High School: deeper concepts, analytical thinking prompts
- College: academic language, critical analysis encouraged
- Cover the topic comprehensively across all 10 slides`;

export async function generateSlides(topic: string, gradeLevel: string): Promise<SlideContent[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Topic: ${topic} | Grade Level: ${gradeLevel}` },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from OpenAI');

  const cleaned = content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const slides: SlideContent[] = JSON.parse(cleaned);

  if (!Array.isArray(slides) || slides.length !== 10) {
    throw new Error('Invalid slide data returned from OpenAI');
  }

  return slides;
}
