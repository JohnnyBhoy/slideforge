import PptxGenJS from 'pptxgenjs';
import https from 'https';
import http from 'http';
import { SlideContent } from '../types';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  darkNavy:    '0F1F3D',
  darkBlue:    '1E3A8A',
  primaryBlue: '1E40AF',
  midBlue:     '2563EB',
  accentBlue:  '3B82F6',
  lightBlue:   'BFDBFE',
  paleBlue:    'EFF6FF',
  white:       'FFFFFF',
  nearWhite:   'F8FAFC',
  darkText:    '0F172A',
  bodyText:    '1E293B',
  mutedText:   '475569',
  borderGray:  'E2E8F0',
  amber:       'D97706',
  amberBg:     'FEF3C7',
  amberDark:   '92400E',
  emerald:     '059669',
  emeraldBg:   'D1FAE5',
  rose:        'E11D48',
  roseBg:      'FFE4E6',
  violet:      '7C3AED',
  violetBg:    'EDE9FE',
  // Quiz option colors
  optA:        '1D4ED8',  // blue
  optB:        '065F46',  // green
  optC:        '92400E',  // amber
  optD:        '6B21A8',  // purple
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').substring(0, 50);
}

function fetchUrl(url: string, redirects = 4): Promise<{ data: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'SlideForge/2.0 (educational tool)' },
      timeout: 8000,
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location && redirects > 0) {
        fetchUrl(res.headers.location, redirects - 1).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ data: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function bufToBase64(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/**
 * Fetch a topic-relevant image using Wikipedia's REST API.
 * Wikipedia returns the main image associated with the article — highly relevant.
 */
async function fetchWikipediaImage(keyword: string): Promise<string | null> {
  // Try multi-word keyword, then first word only as fallback
  const attempts = [
    keyword.trim(),
    keyword.split(' ').slice(0, 2).join(' '),
    keyword.split(' ')[0],
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const kw of attempts) {
    const encoded = encodeURIComponent(kw);
    const result = await fetchUrl(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`);
    if (!result) continue;

    try {
      const json = JSON.parse(result.data.toString());
      const imgUrl: string | undefined = json.originalimage?.source || json.thumbnail?.source;
      if (!imgUrl) continue;

      const imgResult = await fetchUrl(imgUrl);
      if (imgResult) {
        const mime = imgResult.contentType.split(';')[0];
        // Skip SVG — PptxGenJS doesn't support SVG
        if (mime.includes('svg')) continue;
        return bufToBase64(imgResult.data, mime);
      }
    } catch { continue; }
  }
  return null;
}

/**
 * Fallback: fetch a seeded photo from Picsum (always works, not topic-specific).
 */
async function fetchPicsumImage(seed: number): Promise<string | null> {
  const url = `https://picsum.photos/seed/${seed}/640/400`;
  const result = await fetchUrl(url);
  if (!result) return null;
  return bufToBase64(result.data, result.contentType.split(';')[0]);
}

async function getSlideImage(keyword: string, slideIndex: number): Promise<string | null> {
  if (!keyword) return fetchPicsumImage(slideIndex * 17 + 3);
  const wiki = await fetchWikipediaImage(keyword);
  if (wiki) return wiki;
  return fetchPicsumImage(slideIndex * 17 + 3);
}

// ─── SLIDE BUILDERS ───────────────────────────────────────────────────────────

// ── Title Slide ───────────────────────────────────────────────────────────────
async function buildTitleSlide(pptx: PptxGenJS, slide: SlideContent, gradeLevel: string): Promise<void> {
  const s = pptx.addSlide();

  // Background gradient simulation (layered rects)
  s.background = { color: C.darkNavy };

  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 7.5,
    fill: { color: C.darkBlue, transparency: 45 },
    line: { color: C.darkBlue, transparency: 45 },
  });

  // Decorative large circle — top right
  s.addShape(pptx.ShapeType.ellipse, {
    x: 9.5, y: -2.0, w: 6.5, h: 6.5,
    fill: { color: C.midBlue, transparency: 78 },
    line: { color: C.midBlue, transparency: 80 },
  });

  // Decorative circle — bottom left
  s.addShape(pptx.ShapeType.ellipse, {
    x: -2.0, y: 4.5, w: 5.5, h: 5.5,
    fill: { color: C.accentBlue, transparency: 80 },
    line: { color: C.accentBlue, transparency: 82 },
  });

  // Small accent circle — mid right
  s.addShape(pptx.ShapeType.ellipse, {
    x: 12.2, y: 3.0, w: 1.5, h: 1.5,
    fill: { color: C.lightBlue, transparency: 65 },
    line: { color: C.lightBlue, transparency: 68 },
  });

  // Fetch title image and place on right
  const imgData = await getSlideImage(slide.imageKeyword || slide.title, 0);
  if (imgData) {
    // Right-side image panel
    s.addShape(pptx.ShapeType.rect, {
      x: 7.8, y: 0, w: 5.53, h: 7.5,
      fill: { color: C.darkNavy, transparency: 0 },
      line: { color: C.darkNavy },
    });
    s.addImage({
      data: imgData,
      x: 7.8, y: 0, w: 5.53, h: 7.5,
      sizing: { type: 'cover', w: 5.53, h: 7.5 },
    });
    // Overlay gradient on image
    s.addShape(pptx.ShapeType.rect, {
      x: 7.8, y: 0, w: 5.53, h: 7.5,
      fill: { color: C.darkNavy, transparency: 60 },
      line: { color: C.darkNavy, transparency: 60 },
    });
    // Vertical separator line
    s.addShape(pptx.ShapeType.rect, {
      x: 7.78, y: 0.5, w: 0.04, h: 6.5,
      fill: { color: C.accentBlue, transparency: 40 },
      line: { color: C.accentBlue, transparency: 40 },
    });
  }

  // Grade level badge (top left)
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.45, y: 0.4, w: 2.1, h: 0.45,
    fill: { color: C.accentBlue, transparency: 35 },
    line: { color: C.lightBlue, transparency: 50 },
    rectRadius: 0.06,
  });
  s.addText(gradeLevel.toUpperCase(), {
    x: 0.45, y: 0.4, w: 2.1, h: 0.45,
    fontSize: 10, bold: true, color: C.white,
    align: 'center', valign: 'middle', charSpacing: 1.5,
  });

  // Main title
  s.addText(slide.title, {
    x: 0.45, y: 1.1, w: 7.0, h: 2.6,
    fontSize: 40, bold: true, color: C.white,
    align: 'left', valign: 'bottom',
    charSpacing: 0.3,
    shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, color: '000000', opacity: 0.5 },
  });

  // Accent line below title
  s.addShape(pptx.ShapeType.rect, {
    x: 0.45, y: 3.85, w: 5.5, h: 0.07,
    fill: { color: C.accentBlue },
    line: { color: C.accentBlue },
  });

  // Subtitle
  s.addText('A Classroom Presentation', {
    x: 0.45, y: 4.0, w: 7.0, h: 0.65,
    fontSize: 19, color: C.lightBlue, align: 'left',
  });

  // Overview bullets
  s.addText('In this presentation:', {
    x: 0.45, y: 4.85, w: 7.0, h: 0.35,
    fontSize: 11, bold: true, color: C.accentBlue, align: 'left', charSpacing: 0.5,
  });
  slide.bullets.slice(0, 4).forEach((b, i) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: 0.45, y: 5.28 + i * 0.34, w: 0.1, h: 0.1,
      fill: { color: C.accentBlue }, line: { color: C.accentBlue },
    });
    s.addText(b, {
      x: 0.65, y: 5.2 + i * 0.34, w: 6.8, h: 0.3,
      fontSize: 11, color: C.lightBlue, align: 'left',
    });
  });

  // Branding
  s.addText('SlideForge  •  AI-Powered Presentations', {
    x: 0.45, y: 7.1, w: 7.0, h: 0.28,
    fontSize: 8.5, color: C.white, align: 'left', transparency: 55,
  });

  if (slide.speakerNotes) s.addNotes(slide.speakerNotes);
}

// ── Content Slide ─────────────────────────────────────────────────────────────
async function buildContentSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  slideIndex: number,
  totalSlides: number
): Promise<void> {
  const s = pptx.addSlide();
  s.background = { color: C.white };

  // ── Header ──
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.35,
    fill: { color: C.primaryBlue }, line: { color: C.primaryBlue },
  });
  // Darker right stripe
  s.addShape(pptx.ShapeType.rect, {
    x: 11.0, y: 0, w: 2.33, h: 1.35,
    fill: { color: C.darkBlue, transparency: 25 },
    line: { color: C.darkBlue, transparency: 25 },
  });

  // Slide title
  s.addText(slide.title, {
    x: 0.38, y: 0, w: 10.4, h: 1.35,
    fontSize: 25, bold: true, color: C.white,
    align: 'left', valign: 'middle',
  });

  // Slide counter
  s.addShape(pptx.ShapeType.roundRect, {
    x: 11.18, y: 0.4, w: 1.82, h: 0.55,
    fill: { color: C.accentBlue }, line: { color: C.accentBlue }, rectRadius: 0.07,
  });
  s.addText(`${slideIndex + 1} / ${totalSlides}`, {
    x: 11.18, y: 0.4, w: 1.82, h: 0.55,
    fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle',
  });

  // ── Right panel: Image ──
  const PANEL_X = 8.42;
  const PANEL_W = 4.58;
  const IMG_H   = 3.15;
  const FACT_Y  = 1.45 + IMG_H + 0.08;
  const FACT_H  = 2.42;

  const imgData = await getSlideImage(slide.imageKeyword, slideIndex);
  if (imgData) {
    // Image frame shadow
    s.addShape(pptx.ShapeType.rect, {
      x: PANEL_X + 0.06, y: 1.51, w: PANEL_W, h: IMG_H,
      fill: { color: '94A3B8', transparency: 60 },
      line: { color: '94A3B8', transparency: 60 },
    });
    s.addImage({
      data: imgData,
      x: PANEL_X, y: 1.45, w: PANEL_W, h: IMG_H,
      sizing: { type: 'cover', w: PANEL_W, h: IMG_H },
    });
    // Caption bar over image
    s.addShape(pptx.ShapeType.rect, {
      x: PANEL_X, y: 1.45 + IMG_H - 0.32, w: PANEL_W, h: 0.32,
      fill: { color: C.darkNavy, transparency: 25 },
      line: { color: C.darkNavy, transparency: 25 },
    });
    s.addText(slide.imageKeyword.toUpperCase(), {
      x: PANEL_X + 0.1, y: 1.45 + IMG_H - 0.32, w: PANEL_W - 0.2, h: 0.32,
      fontSize: 7, bold: true, color: C.white, align: 'left', valign: 'middle',
      charSpacing: 1.2, transparency: 8,
    });
  } else {
    // Placeholder
    s.addShape(pptx.ShapeType.rect, {
      x: PANEL_X, y: 1.45, w: PANEL_W, h: IMG_H,
      fill: { color: C.paleBlue }, line: { color: C.lightBlue, width: 1 },
    });
    s.addText('🖼️', {
      x: PANEL_X, y: 1.45, w: PANEL_W, h: IMG_H,
      fontSize: 48, align: 'center', valign: 'middle',
    });
  }

  // ── Key Fact Box ──
  s.addShape(pptx.ShapeType.roundRect, {
    x: PANEL_X, y: FACT_Y, w: PANEL_W, h: FACT_H,
    fill: { color: C.amberBg }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.1,
  });
  // Amber header stripe
  s.addShape(pptx.ShapeType.roundRect, {
    x: PANEL_X, y: FACT_Y, w: PANEL_W, h: 0.42,
    fill: { color: C.amber }, line: { color: C.amber }, rectRadius: 0.08,
  });
  s.addText('💡  KEY FACT', {
    x: PANEL_X + 0.15, y: FACT_Y, w: PANEL_W - 0.3, h: 0.42,
    fontSize: 10, bold: true, color: C.white,
    align: 'left', valign: 'middle', charSpacing: 1,
  });
  s.addText(slide.keyFact || '', {
    x: PANEL_X + 0.15, y: FACT_Y + 0.47, w: PANEL_W - 0.3, h: FACT_H - 0.57,
    fontSize: 12, color: C.amberDark,
    align: 'left', valign: 'top', italic: true,
  });

  // ── Left accent bar ──
  s.addShape(pptx.ShapeType.rect, {
    x: 0.28, y: 1.5, w: 0.09, h: 5.55,
    fill: { color: C.accentBlue }, line: { color: C.accentBlue },
  });

  // ── Bullet points ──
  const BULLET_COLORS = [C.primaryBlue, C.emerald, C.amber, C.violet];
  const BULLET_BG     = [C.paleBlue,    C.emeraldBg, C.amberBg, C.violetBg];

  slide.bullets.forEach((bullet, i) => {
    const BY = 1.58 + i * 1.22;

    // Colored number pill
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.50, y: BY + 0.02, w: 0.44, h: 0.44,
      fill: { color: BULLET_COLORS[i % BULLET_COLORS.length] },
      line: { color: BULLET_COLORS[i % BULLET_COLORS.length] },
      rectRadius: 0.06,
    });
    s.addText(`${i + 1}`, {
      x: 0.50, y: BY + 0.02, w: 0.44, h: 0.44,
      fontSize: 13, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });

    // Bullet background band
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.08, y: BY, w: 7.05, h: 1.05,
      fill: { color: BULLET_BG[i % BULLET_BG.length], transparency: 40 },
      line: { color: BULLET_COLORS[i % BULLET_COLORS.length], transparency: 65, width: 0.75 },
      rectRadius: 0.07,
    });

    // Bullet text
    s.addText(bullet, {
      x: 1.20, y: BY + 0.02, w: 6.82, h: 1.02,
      fontSize: 14, color: C.bodyText,
      align: 'left', valign: 'middle',
    });
  });

  // ── Progress bar ──
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.35, w: 13.33, h: 0.08,
    fill: { color: C.borderGray }, line: { color: C.borderGray },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.35, w: 13.33 * ((slideIndex + 1) / totalSlides), h: 0.08,
    fill: { color: C.accentBlue }, line: { color: C.accentBlue },
  });

  // Footer label
  s.addText('SlideForge', {
    x: 0.35, y: 7.17, w: 5.0, h: 0.2,
    fontSize: 7.5, color: C.mutedText, align: 'left',
  });

  if (slide.speakerNotes) s.addNotes(slide.speakerNotes);
}

// ── Quiz Slide ────────────────────────────────────────────────────────────────
function buildQuizSlide(pptx: PptxGenJS, slide: SlideContent, slideIndex: number, totalSlides: number): void {
  const s = pptx.addSlide();
  s.background = { color: C.nearWhite };

  // ── Header ──
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 1.35,
    fill: { color: C.violet }, line: { color: C.violet },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 11.0, y: 0, w: 2.33, h: 1.35,
    fill: { color: '6B21A8', transparency: 25 }, line: { color: '6B21A8', transparency: 25 },
  });
  s.addText('🎯  Knowledge Check', {
    x: 0.38, y: 0, w: 10.4, h: 1.35,
    fontSize: 26, bold: true, color: C.white,
    align: 'left', valign: 'middle',
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 11.18, y: 0.4, w: 1.82, h: 0.55,
    fill: { color: C.accentBlue }, line: { color: C.accentBlue }, rectRadius: 0.07,
  });
  s.addText(`${slideIndex + 1} / ${totalSlides}`, {
    x: 11.18, y: 0.4, w: 1.82, h: 0.55,
    fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle',
  });

  // Helper label
  s.addText('Test your knowledge! Can you answer all 4 questions?', {
    x: 0.38, y: 1.42, w: 12.57, h: 0.35,
    fontSize: 11, color: C.mutedText, align: 'left', italic: true,
  });

  const questions = slide.quizQuestions || [];
  const optionColors = [C.optA, C.optB, C.optC, C.optD];
  const optionBg     = ['EFF6FF', 'ECFDF5', 'FFFBEB', 'F5F3FF'];

  // 2×2 grid of question cards
  const CARD_W = 6.0;
  const CARD_H = 2.6;
  const COL_GAP = 0.38;
  const ROW_GAP = 0.2;
  const START_X = 0.38;
  const START_Y = 1.88;

  questions.slice(0, 4).forEach((q, qi) => {
    const col = qi % 2;
    const row = Math.floor(qi / 2);
    const cx = START_X + col * (CARD_W + COL_GAP);
    const cy = START_Y + row * (CARD_H + ROW_GAP);

    // Card shadow
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx + 0.05, y: cy + 0.05, w: CARD_W, h: CARD_H,
      fill: { color: 'CBD5E1', transparency: 60 },
      line: { color: 'CBD5E1', transparency: 60 },
      rectRadius: 0.12,
    });

    // Card body
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: CARD_W, h: CARD_H,
      fill: { color: C.white }, line: { color: C.borderGray, width: 1 }, rectRadius: 0.12,
    });

    // Q number badge
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx + 0.18, y: cy + 0.15, w: 0.5, h: 0.5,
      fill: { color: optionColors[qi % 4] }, line: { color: optionColors[qi % 4] }, rectRadius: 0.06,
    });
    s.addText(`Q${qi + 1}`, {
      x: cx + 0.18, y: cy + 0.15, w: 0.5, h: 0.5,
      fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle',
    });

    // Question text
    s.addText(q.question, {
      x: cx + 0.82, y: cy + 0.12, w: CARD_W - 1.0, h: 0.6,
      fontSize: 13, bold: true, color: C.bodyText,
      align: 'left', valign: 'middle',
    });

    // Options — 2 per row
    q.options.slice(0, 4).forEach((opt, oi) => {
      const ocol = oi % 2;
      const orow = Math.floor(oi / 2);
      const OPT_W = (CARD_W - 0.36) / 2 - 0.08;
      const ox = cx + 0.18 + ocol * (OPT_W + 0.16);
      const oy = cy + 0.85 + orow * 0.75;

      s.addShape(pptx.ShapeType.roundRect, {
        x: ox, y: oy, w: OPT_W, h: 0.6,
        fill: { color: optionBg[oi], transparency: 20 },
        line: { color: optionColors[oi], width: 1.2, transparency: 30 },
        rectRadius: 0.07,
      });
      s.addText(opt, {
        x: ox + 0.08, y: oy, w: OPT_W - 0.1, h: 0.6,
        fontSize: 11, color: C.bodyText,
        align: 'left', valign: 'middle',
      });
    });
  });

  // Progress bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.35, w: 13.33, h: 0.08,
    fill: { color: C.borderGray }, line: { color: C.borderGray },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.35, w: 13.33 * ((slideIndex + 1) / totalSlides), h: 0.08,
    fill: { color: C.violet }, line: { color: C.violet },
  });

  s.addText('SlideForge', {
    x: 0.35, y: 7.17, w: 5.0, h: 0.2,
    fontSize: 7.5, color: C.mutedText, align: 'left',
  });

  // Speaker notes contain answers
  const answers = questions.map((q, i) => `Q${i + 1}: ${q.answer}`).join('  |  ');
  s.addNotes(`ANSWERS: ${answers}\n\n${slide.speakerNotes || ''}`);
}

// ── Summary Slide ─────────────────────────────────────────────────────────────
function buildSummarySlide(pptx: PptxGenJS, slide: SlideContent): void {
  const s = pptx.addSlide();
  s.background = { color: C.darkNavy };

  // Background decorative circles
  s.addShape(pptx.ShapeType.ellipse, {
    x: 10.2, y: -1.5, w: 5.5, h: 5.5,
    fill: { color: C.primaryBlue, transparency: 72 },
    line: { color: C.primaryBlue, transparency: 75 },
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: -1.5, y: 4.5, w: 4.5, h: 4.5,
    fill: { color: C.accentBlue, transparency: 78 },
    line: { color: C.accentBlue, transparency: 80 },
  });

  // Top badge
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.45, y: 0.38, w: 3.8, h: 0.48,
    fill: { color: C.accentBlue, transparency: 40 },
    line: { color: C.lightBlue, transparency: 55 },
    rectRadius: 0.07,
  });
  s.addText('✅  SUMMARY & KEY TAKEAWAYS', {
    x: 0.45, y: 0.38, w: 3.8, h: 0.48,
    fontSize: 9, bold: true, color: C.white,
    align: 'center', valign: 'middle', charSpacing: 0.8,
  });

  // Title
  s.addText(slide.title, {
    x: 0.45, y: 1.02, w: 12.43, h: 1.05,
    fontSize: 34, bold: true, color: C.white,
    align: 'left',
    shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.4 },
  });

  // Divider
  s.addShape(pptx.ShapeType.rect, {
    x: 0.45, y: 2.18, w: 12.43, h: 0.05,
    fill: { color: C.accentBlue, transparency: 35 },
    line: { color: C.accentBlue, transparency: 35 },
  });

  // 2×2 Takeaway cards — DARK backgrounds so white text is visible
  const CARD_COLORS = [C.primaryBlue, C.emerald, C.amber, C.violet];
  const CARD_W = 5.8;
  const CARD_H = 1.65;
  const GAP_X  = 0.68;
  const GAP_Y  = 0.22;

  slide.bullets.slice(0, 4).forEach((bullet, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.45 + col * (CARD_W + GAP_X);
    const cy = 2.38 + row * (CARD_H + GAP_Y);

    // Card with solid color background — no transparency issues
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: CARD_W, h: CARD_H,
      fill: { color: CARD_COLORS[i] },
      line: { color: CARD_COLORS[i] },
      rectRadius: 0.12,
    });

    // Slightly lighter top bar
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: CARD_W, h: 0.38,
      fill: { color: C.white, transparency: 85 },
      line: { color: C.white, transparency: 85 },
      rectRadius: 0.1,
    });

    // Number
    s.addText(`${i + 1}`, {
      x: cx + 0.15, y: cy + 0.04, w: 0.38, h: 0.3,
      fontSize: 16, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });

    // Takeaway text — WHITE on solid colored card = clearly visible
    s.addText(bullet, {
      x: cx + 0.15, y: cy + 0.42, w: CARD_W - 0.3, h: CARD_H - 0.52,
      fontSize: 13, color: C.white,
      align: 'left', valign: 'top',
    });
  });

  // Thank you section
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 6.55, w: 13.33, h: 0.68,
    fill: { color: C.midBlue, transparency: 50 },
    line: { color: C.midBlue, transparency: 50 },
  });
  s.addText('🙏  Thank You!  Any Questions?', {
    x: 0.45, y: 6.55, w: 12.43, h: 0.68,
    fontSize: 20, bold: true, color: C.white,
    align: 'center', valign: 'middle',
    shadow: { type: 'outer', blur: 4, offset: 1, angle: 45, color: '000000', opacity: 0.3 },
  });

  // Branding
  s.addText('SlideForge  •  AI-Powered Presentations', {
    x: 0, y: 7.18, w: 13.33, h: 0.25,
    fontSize: 8.5, color: C.white, align: 'center', transparency: 55,
  });

  if (slide.speakerNotes) s.addNotes(slide.speakerNotes);
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generatePptx(
  slides: SlideContent[],
  topic: string,
  gradeLevel: string
): Promise<{ buffer: Buffer; fileName: string }> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'SlideForge';
  pptx.subject = topic;
  pptx.title = topic;

  const total = slides.length;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const t = slide.type;

    if (t === 'title') {
      await buildTitleSlide(pptx, slide, gradeLevel);
    } else if (t === 'quiz') {
      buildQuizSlide(pptx, slide, i, total);
    } else if (t === 'summary') {
      buildSummarySlide(pptx, slide);
    } else {
      await buildContentSlide(pptx, slide, i, total);
    }
  }

  const slug = slugify(topic);
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `${slug}-${timestamp}.pptx`;

  // Write to in-memory buffer — no disk I/O, works on ephemeral filesystems
  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return { buffer, fileName };
}
