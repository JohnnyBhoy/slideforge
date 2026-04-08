import PptxGenJS from 'pptxgenjs';
import path from 'path';
import { SlideContent } from '../types';

const COLORS = {
  primaryBlue: '1E40AF',
  lightBlue: 'DBEAFE',
  white: 'FFFFFF',
  darkSlate: '1E293B',
  gray: '64748B',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

export async function generatePptx(
  slides: SlideContent[],
  topic: string,
  gradeLevel: string
): Promise<{ filePath: string; fileName: string; fileUrl: string }> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  slides.forEach((slide, index) => {
    const slideObj = pptx.addSlide();
    const isTitle = index === 0;
    const isLast = index === slides.length - 1;

    if (isTitle || isLast) {
      // Full blue background slides
      slideObj.background = { color: COLORS.primaryBlue };

      slideObj.addText(slide.title, {
        x: 1,
        y: isTitle ? 2.5 : 2,
        w: 11.33,
        h: 1.5,
        fontSize: 40,
        bold: true,
        color: COLORS.white,
        align: 'center',
      });

      if (isTitle) {
        slideObj.addText('A Classroom Presentation', {
          x: 1,
          y: 4.2,
          w: 11.33,
          h: 0.8,
          fontSize: 20,
          color: COLORS.lightBlue,
          align: 'center',
        });

        slideObj.addText(gradeLevel, {
          x: 9.5,
          y: 6.8,
          w: 3,
          h: 0.4,
          fontSize: 12,
          color: COLORS.white,
          align: 'right',
        });

        slideObj.addText('Class Generator', {
          x: 0.3,
          y: 6.8,
          w: 3,
          h: 0.4,
          fontSize: 10,
          color: COLORS.white,
          align: 'left',
          transparency: 50,
        });
      } else {
        // Summary/closing slide
        const bulletText = slide.bullets.map((b) => ({ text: `• ${b}\n`, options: { fontSize: 18, color: COLORS.white } }));
        slideObj.addText(bulletText, {
          x: 1.5,
          y: 3.5,
          w: 10.33,
          h: 2.5,
          align: 'left',
        });

        slideObj.addText('Thank you!', {
          x: 1,
          y: 6.2,
          w: 11.33,
          h: 0.6,
          fontSize: 16,
          color: COLORS.lightBlue,
          align: 'center',
        });
      }
    } else {
      // Content slides (2-9)
      slideObj.background = { color: COLORS.white };

      // Blue header bar
      slideObj.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 1.2,
        fill: { color: COLORS.primaryBlue },
      });

      // Slide title in header
      slideObj.addText(slide.title, {
        x: 0.3,
        y: 0,
        w: 12.5,
        h: 1.2,
        fontSize: 28,
        bold: true,
        color: COLORS.white,
        align: 'left',
        valign: 'middle',
      });

      // Blue left-border accent
      slideObj.addShape(pptx.ShapeType.rect, {
        x: 0.3,
        y: 1.4,
        w: 0.08,
        h: 5.5,
        fill: { color: COLORS.primaryBlue },
      });

      // Bullet points
      const bulletItems = slide.bullets.map((bullet) => ({
        text: bullet,
        options: {
          bullet: { type: 'bullet' as const, color: COLORS.primaryBlue },
          fontSize: 18,
          color: COLORS.darkSlate,
          paraSpaceAfter: 8,
        },
      }));

      slideObj.addText(bulletItems, {
        x: 0.7,
        y: 1.5,
        w: 12,
        h: 5.3,
        align: 'left',
        valign: 'top',
      });

      // Slide number
      slideObj.addText(`${index + 1} / ${slides.length}`, {
        x: 12,
        y: 7,
        w: 1.2,
        h: 0.4,
        fontSize: 10,
        color: COLORS.gray,
        align: 'right',
      });
    }

    // Speaker notes
    if (slide.speakerNotes) {
      slideObj.addNotes(slide.speakerNotes);
    }
  });

  const slug = slugify(topic);
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `${slug}-${timestamp}.pptx`;
  const generatedDir = path.join(__dirname, '../../public/generated');
  const filePath = path.join(generatedDir, fileName);

  await pptx.writeFile({ fileName: filePath });

  return {
    filePath,
    fileName,
    fileUrl: `/files/${fileName}`,
  };
}
