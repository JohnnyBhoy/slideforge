import Anthropic from '@anthropic-ai/sdk';
import { SlideContent } from '../types';

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are an expert educational content creator and instructional designer.
Your job is to create comprehensive, professional PowerPoint slide content for classroom presentations.

Generate between 10 and 12 slides depending on topic complexity — more slides for broad/complex topics, fewer for narrow ones.
Respond ONLY with a valid JSON array — no markdown, no backticks, no explanation, no preamble.

The slide sequence MUST follow this structure:
1. Slide 1 — type: "title" (introduction)
2. Slides 2 to N-2 — type: "content" (cover the topic thoroughly)
3. Slide N-1 — type: "quiz" (knowledge check with 4 questions)
4. Slide N — type: "summary" (key takeaways + thank you)

JSON format:
[
  {
    "slideNumber": 1,
    "type": "title",
    "title": "The Solar System",
    "bullets": [
      "Overview of our cosmic neighborhood",
      "The eight planets and their characteristics",
      "Moons, asteroids, and other celestial bodies",
      "The Sun and its influence on the solar system"
    ],
    "keyFact": "Our solar system is approximately 4.6 billion years old and contains 8 planets, 290 known moons, and millions of asteroids.",
    "imageKeyword": "solar system planets space",
    "speakerNotes": "Welcome students. Today we explore our solar system — a fascinating cosmic neighborhood that has captivated scientists for centuries."
  },
  {
    "slideNumber": 5,
    "type": "content",
    "title": "The Inner Rocky Planets",
    "bullets": [
      "Mercury is the smallest planet and closest to the Sun, with extreme temperature swings from -180°C to 430°C",
      "Venus has a thick CO2 atmosphere making it the hottest planet at 465°C despite not being closest to the Sun",
      "Earth is the only known planet with liquid water on its surface and life as we know it",
      "Mars has the tallest volcano in the solar system — Olympus Mons — standing 21.9 km high"
    ],
    "keyFact": "A day on Venus (243 Earth days) is actually longer than a year on Venus (225 Earth days) — it rotates slower than it orbits the Sun.",
    "imageKeyword": "mercury venus earth mars rocky planets",
    "speakerNotes": "The four inner planets are called terrestrial or rocky planets because of their solid, rocky surfaces. Each has unique characteristics that make them distinct from one another."
  },
  {
    "slideNumber": 13,
    "type": "quiz",
    "title": "Knowledge Check 🎯",
    "bullets": [],
    "keyFact": "",
    "imageKeyword": "",
    "speakerNotes": "Answers: 1-B, 2-C, 3-A, 4-D. Review each answer with the class and encourage discussion.",
    "quizQuestions": [
      {
        "question": "Which planet is known as the Red Planet?",
        "options": ["A. Venus", "B. Mars", "C. Jupiter", "D. Saturn"],
        "answer": "B"
      },
      {
        "question": "How many planets are in our solar system?",
        "options": ["A. 7", "B. 9", "C. 8", "D. 10"],
        "answer": "C"
      },
      {
        "question": "What is the largest planet in our solar system?",
        "options": ["A. Jupiter", "B. Saturn", "C. Uranus", "D. Neptune"],
        "answer": "A"
      },
      {
        "question": "What is at the center of our solar system?",
        "options": ["A. Earth", "B. The Moon", "C. A Black Hole", "D. The Sun"],
        "answer": "D"
      }
    ]
  },
  {
    "slideNumber": 14,
    "type": "summary",
    "title": "Summary & Key Takeaways",
    "bullets": [
      "Our solar system formed 4.6 billion years ago from a giant cloud of gas and dust",
      "The 8 planets are divided into rocky inner planets and gas/ice giant outer planets",
      "The Sun contains 99.86% of all mass in the solar system and drives all planetary motion",
      "Space exploration has dramatically expanded our understanding of our cosmic neighborhood"
    ],
    "keyFact": "Humanity has sent spacecraft to every planet in our solar system, with Voyager 1 now travelling in interstellar space over 23 billion km from Earth.",
    "imageKeyword": "solar system overview",
    "speakerNotes": "Summarize the main learning outcomes and invite students to ask questions or share what surprised them most."
  }
]

Rules for ALL slides:
- type MUST be exactly: "title", "content", "quiz", or "summary"
- Every content slide MUST have exactly 4 bullet points
- Bullets must be complete, informative sentences appropriate for the grade level:
  - Kinder: 5-8 words, simple fun language
  - Elementary: 10-15 words, relatable examples and analogies
  - High School: 15-25 words, analytical language and cause-effect relationships
  - College: 20-30 words, academic language, critical analysis, and evidence-based statements
- keyFact must be a SPECIFIC, REAL statistic, date, measurement, or surprising fact (never generic)
- imageKeyword: 3-5 specific words for image search that MATCH the slide content exactly
  (e.g., for a slide about photosynthesis: "chlorophyll leaf green plant",
   for Jupiter: "jupiter great red spot planet",
   for World War 2: "world war 2 soldiers battlefield")
- Quiz slide MUST have exactly 4 quizQuestions, each with exactly 4 options and a single correct answer
- Summary bullets must recap the 4 most important concepts from the entire presentation
- Cover the topic comprehensively with logical progression from introduction to advanced concepts`;

export async function generateSlides(topic: string, gradeLevel: string): Promise<SlideContent[]> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Topic: ${topic} | Grade Level: ${gradeLevel}` },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('No content returned from Anthropic');

  const cleaned = block.text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  let slides: SlideContent[];
  try {
    slides = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse JSON from Anthropic response: ' + e);
  }

  if (!Array.isArray(slides) || slides.length < 4) {
    throw new Error('Invalid slide data returned from Anthropic');
  }

  return slides;
}
