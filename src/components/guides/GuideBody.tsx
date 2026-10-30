import { Fragment, type ReactNode } from 'react';

/** Render **bold** spans inside a line of text. */
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

type Block =
  | { type: 'h2' | 'h3' | 'p' | 'note'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

/** Parse the guide markdown subset into blocks (see content/guides/types.ts). */
export function parseGuide(body: string): Block[] {
  const blocks: Block[] = [];
  const paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph.length = 0;
  };

  for (const raw of body.trim().split('\n')) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    if (!line) {
      flush();
    } else if (line.startsWith('### ')) {
      flush();
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('> ')) {
      flush();
      blocks.push({ type: 'note', text: line.slice(2) });
    } else if (line.startsWith('- ')) {
      flush();
      if (last?.type === 'ul') last.items.push(line.slice(2));
      else blocks.push({ type: 'ul', items: [line.slice(2)] });
    } else if (/^\d+\. /.test(line)) {
      flush();
      const item = line.replace(/^\d+\. /, '');
      if (last?.type === 'ol') last.items.push(item);
      else blocks.push({ type: 'ol', items: [item] });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export function guideHeadings(body: string) {
  return parseGuide(body)
    .filter((b): b is { type: 'h2'; text: string } => b.type === 'h2')
    .map(b => ({ id: slugifyHeading(b.text), text: b.text }));
}

export function GuideBody({ body, lang = 'en' }: { body: string; lang?: 'en' | 'ur' }) {
  return (
    <div
      className={`space-y-5 text-slate-700 dark:text-slate-300 ${
        lang === 'ur' ? 'text-lg leading-[2.4]' : 'text-[17px] leading-8'
      }`}
    >
      {parseGuide(body).map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={i}
                id={slugifyHeading(block.text)}
                className='scroll-mt-24 pt-4 text-2xl font-bold text-slate-900 dark:text-white'
              >
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className='pt-2 text-xl font-semibold text-slate-900 dark:text-white'>
                {block.text}
              </h3>
            );
          case 'note':
            return (
              <aside
                key={i}
                className='rounded-xl border-s-4 border-emerald-500 bg-emerald-50 p-4 text-base dark:bg-emerald-950/40'
              >
                {inline(block.text)}
              </aside>
            );
          case 'ul':
            return (
              <ul key={i} className='list-disc space-y-2 ps-6'>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className='list-decimal space-y-2 ps-6'>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ol>
            );
          default:
            return <p key={i}>{inline(block.text)}</p>;
        }
      })}
    </div>
  );
}
