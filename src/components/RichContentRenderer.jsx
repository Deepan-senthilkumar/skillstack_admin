import { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '16px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #1E293B',
      background: '#0F172A',
      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: '#1E293B',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Terminal size={14} color="#38BDF8" />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#94A3B8',
            letterSpacing: '0.05em'
          }}>
            {lang || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            border: copied ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
            color: copied ? '#4ADE80' : '#E2E8F0',
            fontSize: '11.5px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          title="Copy code snippet"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '14px 16px',
        fontFamily: "'IBM Plex Mono', Menlo, Consolas, Monaco, monospace",
        fontSize: '13px',
        lineHeight: 1.6,
        color: '#F8FAFC',
        overflowX: 'auto',
        background: '#0F172A'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ImageBlock({ src, alt, caption }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{
      margin: '22px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%'
    }}>
      <div
        onClick={() => setModalOpen(true)}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1.5px solid rgba(123, 28, 110, 0.16)',
          background: '#F8FAFC',
          boxShadow: '0 8px 30px rgba(123, 28, 110, 0.08)',
          cursor: 'pointer',
          maxWidth: '100%',
          textAlign: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.01)';
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(123, 28, 110, 0.14)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(123, 28, 110, 0.08)';
        }}
        title="Click to zoom image"
      >
        {!imgError ? (
          <img
            src={src}
            alt={alt || caption || 'Topic diagram'}
            onError={() => setImgError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '520px',
              display: 'block',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />
        ) : (
          <div style={{ padding: '30px 20px', color: '#94A3B8', fontSize: '13px' }}>
            📷 Image: {alt || 'Illustration'} ({src})
          </div>
        )}
      </div>

      {(caption || alt) && (
        <span style={{
          marginTop: '8px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#64748B',
          textAlign: 'center'
        }}>
          📌 {caption || alt}
        </span>
      )}

      {/* Lightbox zoom modal */}
      {modalOpen && !imgError && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={src}
            alt={alt || caption}
            style={{
              maxWidth: '92vw',
              maxHeight: '86vh',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          />
          {(caption || alt) && (
            <div style={{
              marginTop: '14px',
              color: '#F8FAFC',
              fontSize: '13.5px',
              fontWeight: 600,
              background: 'rgba(0,0,0,0.6)',
              padding: '6px 16px',
              borderRadius: '999px'
            }}>
              {caption || alt}
            </div>
          )}
          <span style={{ color: '#94A3B8', fontSize: '11px', marginTop: '8px' }}>Click anywhere to close</span>
        </div>
      )}
    </div>
  );
}

function renderInlineText(text) {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inlineCode = part.slice(1, -1);
      return (
        <code
          key={i}
          style={{
            background: 'rgba(123, 28, 110, 0.08)',
            color: '#7B1C6E',
            border: '1px solid rgba(123, 28, 110, 0.18)',
            padding: '2px 6px',
            borderRadius: '5px',
            fontFamily: "'IBM Plex Mono', Menlo, Consolas, monospace",
            fontSize: '12.5px',
            fontWeight: 600,
            margin: '0 2px'
          }}
        >
          {inlineCode}
        </code>
      );
    }

    // Bold formatting: **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
        return <strong key={j} style={{ color: '#0F172A', fontWeight: 700 }}>{bPart.slice(2, -2)}</strong>;
      }

      // Italic formatting: *italic* or _italic_
      const italicParts = bPart.split(/(\*[^*]+\*|_[^_]+_)/g);
      return italicParts.map((itPart, m) => {
        if ((itPart.startsWith('*') && itPart.endsWith('*') && itPart.length >= 3) ||
            (itPart.startsWith('_') && itPart.endsWith('_') && itPart.length >= 3)) {
          return <em key={m} style={{ color: '#475569', fontStyle: 'italic' }}>{itPart.slice(1, -1)}</em>;
        }

        // Image formatting: ![alt](url)
        const imageParts = itPart.split(/(!\[[^\]]*\]\([^)]+\))/g);
        return imageParts.map((imgPart, n) => {
          const imgMatch = imgPart.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imgMatch) {
            return <ImageBlock key={n} alt={imgMatch[1]} src={imgMatch[2]} caption={imgMatch[1]} />;
          }

          // Link formatting: [label](url)
          const linkParts = imgPart.split(/(\[[^\]]+\]\([^)]+\))/g);
          return linkParts.map((lPart, k) => {
            const linkMatch = lPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
              return (
                <a
                  key={k}
                  href={linkMatch[2]}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#7B1C6E', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {linkMatch[1]}
                </a>
              );
            }

            // Raw URLs: http(s)://...
            const urlParts = lPart.split(/(https?:\/\/[^\s]+)/g);
            return urlParts.map((uPart, l) => {
              if (/^https?:\/\//.test(uPart)) {
                return (
                  <a
                    key={l}
                    href={uPart}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#7B1C6E', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {uPart}
                  </a>
                );
              }
              return uPart;
            });
          });
        });
      });
    });
  });
}

// Universal table helper: detects border lines (Unicode box-drawing ┌─┬─┐, ASCII +---+---+, and markdown |--|--|)
function isBoxBorderLine(line) {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Unicode Box border characters: ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ─ ═ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬
  if (/^[┌╔├╠└╚\+][─═\-\+\┬╦┼╬┴╩│║\| \t]*[┐╗┤╣┘╝\+]?$/.test(trimmed)) return true;
  // Markdown / ASCII table delimiters: |---|---| or +---+---+
  if (/^[\|\+][\-\:\s\+\|]+[\|\+]?$/.test(trimmed) && trimmed.includes('-')) return true;
  if (/^[─═]{3,}$/.test(trimmed)) return true;
  return false;
}

// Detects genuine content rows with vertical dividers: │, ║, or outside-code |
function isBoxContentRow(line) {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Never treat bullets (*, -, +), numbered items (1.), headings (#), or quotes (>) as table rows!
  if (/^#{1,6}\s|^[\*\-\+]\s|^\d+\.\s|^>/.test(trimmed)) {
    return false;
  }

  // Pure border line is not a content row
  if (isBoxBorderLine(trimmed)) return false;

  // Unicode box vertical lines
  if (trimmed.includes('│') || trimmed.includes('║')) return true;

  // For ASCII pipe '|', count pipes outside backticks and braces
  let inCode = false;
  let braceDepth = 0;
  let outsidePipeCount = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '`') {
      inCode = !inCode;
    } else if (!inCode && (char === '{' || char === '[' || char === '(')) {
      braceDepth++;
    } else if (!inCode && (char === '}' || char === ']' || char === ')')) {
      if (braceDepth > 0) braceDepth--;
    } else if (char === '|' && !inCode && braceDepth === 0) {
      outsidePipeCount++;
    }
  }

  // Must have at least 1 genuine structural cell separator pipe
  return outsidePipeCount >= 1;
}

// Split cells intelligently while respecting braces {}, backticks ``, and brackets []
function splitUniversalTableLine(line) {
  let trimmed = line.trim();
  // Strip outer vertical borders: │, ║, |
  if (/^[│║\|]/.test(trimmed)) trimmed = trimmed.slice(1);
  if (/[│║\|]$/.test(trimmed)) trimmed = trimmed.slice(0, -1);

  const cells = [];
  let current = '';
  let inCode = false;
  let braceDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '`') {
      inCode = !inCode;
    } else if (!inCode && (char === '{' || char === '[' || char === '(')) {
      braceDepth++;
      current += char;
    } else if (!inCode && (char === '}' || char === ']' || char === ')')) {
      if (braceDepth > 0) braceDepth--;
      current += char;
    } else if ((char === '│' || char === '║' || char === '|') && !inCode && braceDepth === 0) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function TableBlock({ headers = [], alignments = [], rows = [] }) {
  return (
    <div style={{
      margin: '20px 0',
      overflowX: 'auto',
      borderRadius: '14px',
      border: '1.5px solid rgba(123, 28, 110, 0.16)',
      boxShadow: '0 6px 24px rgba(123, 28, 110, 0.06)',
      background: '#FFFFFF'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '13.5px',
        lineHeight: 1.6
      }}>
        {headers && headers.length > 0 && (
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, #FDF5FD 0%, #F8FAFC 100%)',
              borderBottom: '2px solid rgba(123, 28, 110, 0.18)'
            }}>
              {headers.map((head, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '13px 18px',
                    fontWeight: 800,
                    color: '#7B1C6E',
                    textAlign: alignments[idx] || 'left',
                    whiteSpace: 'nowrap',
                    fontSize: '12.5px',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    borderRight: idx < headers.length - 1 ? '1px solid rgba(123, 28, 110, 0.1)' : 'none'
                  }}
                >
                  {renderInlineText(head)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                borderBottom: rIdx < rows.length - 1 ? '1px solid #F1F5F9' : 'none',
                background: rIdx % 2 === 0 ? '#FFFFFF' : '#FAFCFF',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FDF5FD'}
              onMouseLeave={(e) => e.currentTarget.style.background = rIdx % 2 === 0 ? '#FFFFFF' : '#FAFCFF'}
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    padding: '12px 18px',
                    color: '#334155',
                    textAlign: alignments[cIdx] || 'left',
                    verticalAlign: 'middle',
                    fontWeight: 500,
                    borderRight: cIdx < row.length - 1 ? '1px solid #F8FAFC' : 'none'
                  }}
                >
                  {renderInlineText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RichContentRenderer({ content, className = '' }) {
  if (!content || !content.trim()) {
    return null;
  }

  const lines = content.split('\n');
  const blocks = [];
  let currentCode = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code block fence ```lang
    if (/^```/.test(line.trim())) {
      if (currentCode === null) {
        // Start of code block
        const lang = line.trim().replace(/^```/, '').trim() || 'code';
        currentCode = { type: 'code', lang, lines: [] };
      } else {
        // End of code block
        blocks.push({
          type: 'code',
          lang: currentCode.lang,
          code: currentCode.lines.join('\n')
        });
        currentCode = null;
      }
      continue;
    }

    // Accumulating code lines
    if (currentCode !== null) {
      currentCode.lines.push(line);
      continue;
    }

    // Check for Standalone Image: ![alt](url) or ![alt](url "title")
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
    if (imgMatch) {
      blocks.push({
        type: 'image',
        alt: imgMatch[1],
        src: imgMatch[2],
        caption: imgMatch[3] || imgMatch[1]
      });
      continue;
    }

    // Check for Table structure:
    // Case 1: Unicode Box start: ┌...┐, ╔...╗, +---+
    // Case 2: Unicode Box content row: │...│
    // Case 3: Markdown table: header row with outside pipes followed immediately by delimiter line |---|---|
    const isBoxStart = isBoxBorderLine(line);
    const isUnicodeRow = !isBoxStart && (line.includes('│') || line.includes('║')) && isBoxContentRow(line);
    const isMarkdownTableCandidate = !isBoxStart && isBoxContentRow(line) && i + 1 < lines.length && isBoxBorderLine(lines[i + 1]);

    if (isBoxStart || isUnicodeRow || isMarkdownTableCandidate) {
      let testIdx = isBoxStart ? i + 1 : i;

      if (testIdx < lines.length && isBoxContentRow(lines[testIdx])) {
        let headers = [];
        let alignments = [];
        const rows = [];

        // Parse header row
        headers = splitUniversalTableLine(lines[testIdx]);
        testIdx++;

        // Check if there is an alignment / separator border line
        if (testIdx < lines.length && isBoxBorderLine(lines[testIdx])) {
          const delimCells = splitUniversalTableLine(lines[testIdx]);
          alignments = delimCells.map(d => {
            const clean = d.trim();
            if (clean.startsWith(':') && clean.endsWith(':')) return 'center';
            if (clean.endsWith(':')) return 'right';
            return 'left';
          });
          testIdx++;
        }

        // Collect body rows
        while (testIdx < lines.length) {
          const curLine = lines[testIdx];
          if (isBoxBorderLine(curLine)) {
            testIdx++;
            // If the next line is not a content row, this was the bottom border
            if (testIdx >= lines.length || !isBoxContentRow(lines[testIdx])) {
              break;
            }
            continue;
          }

          if (isBoxContentRow(curLine)) {
            const rowCells = splitUniversalTableLine(curLine);
            rows.push(rowCells);
            testIdx++;
          } else {
            break;
          }
        }

        i = testIdx - 1; // Update loop index to the end of the table
        blocks.push({
          type: 'table',
          headers,
          alignments,
          rows
        });
        continue;
      }
    }

    // Headings
    if (/^# /.test(line)) {
      blocks.push({ type: 'h1', text: line.replace(/^# /, '') });
      continue;
    }
    if (/^## /.test(line)) {
      blocks.push({ type: 'h2', text: line.replace(/^## /, '') });
      continue;
    }
    if (/^### /.test(line)) {
      blocks.push({ type: 'h3', text: line.replace(/^### /, '') });
      continue;
    }
    if (/^#### /.test(line)) {
      blocks.push({ type: 'h4', text: line.replace(/^#### /, '') });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      blocks.push({ type: 'quote', text: line.replace(/^>\s?/, '') });
      continue;
    }

    // Horizontal Rule (exact dashes or stars)
    if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      continue;
    }

    // Bullet item (* item, - item, + item)
    if (/^[\*\-\+]\s/.test(line.trim())) {
      blocks.push({ type: 'bullet', text: line.trim().replace(/^[\*\-\+]\s+/, '') });
      continue;
    }

    // Numbered step: 1. Step name
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Empty line
    if (!line.trim()) {
      blocks.push({ type: 'spacer' });
      continue;
    }

    // Regular paragraph line
    blocks.push({ type: 'p', text: line });
  }

  // If code block wasn't closed properly
  if (currentCode !== null) {
    blocks.push({
      type: 'code',
      lang: currentCode.lang,
      code: currentCode.lines.join('\n')
    });
  }

  return (
    <div className={`rich-content-flow ${className}`} style={{ fontSize: '14.5px', lineHeight: 1.75, color: '#334155' }}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'image':
            return (
              <ImageBlock
                key={idx}
                src={block.src}
                alt={block.alt}
                caption={block.caption}
              />
            );

          case 'table':
            return (
              <TableBlock
                key={idx}
                headers={block.headers}
                alignments={block.alignments}
                rows={block.rows}
              />
            );

          case 'code':
            return <CodeBlock key={idx} code={block.code} lang={block.lang} />;

          case 'quote':
            return (
              <blockquote
                key={idx}
                style={{
                  margin: '14px 0',
                  padding: '12px 18px',
                  background: 'rgba(123, 28, 110, 0.05)',
                  borderLeft: '4px solid #7B1C6E',
                  borderRadius: '0 10px 10px 0',
                  color: '#475569',
                  fontStyle: 'italic',
                  lineHeight: 1.65
                }}
              >
                {renderInlineText(block.text)}
              </blockquote>
            );

          case 'h1':
            return (
              <h2
                key={idx}
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '22px 0 10px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid rgba(123, 28, 110, 0.15)'
                }}
              >
                {renderInlineText(block.text)}
              </h2>
            );

          case 'h2':
            return (
              <h3
                key={idx}
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: '18px 0 8px'
                }}
              >
                {renderInlineText(block.text)}
              </h3>
            );

          case 'h3':
            return (
              <h4
                key={idx}
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#7B1C6E',
                  margin: '16px 0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#7B1C6E'
                }} />
                {renderInlineText(block.text)}
              </h4>
            );

          case 'h4':
            return (
              <h5
                key={idx}
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#334155',
                  margin: '12px 0 4px'
                }}
              >
                {renderInlineText(block.text)}
              </h5>
            );

          case 'hr':
            return (
              <hr
                key={idx}
                style={{
                  border: 'none',
                  borderTop: '1.5px solid rgba(123, 28, 110, 0.12)',
                  margin: '18px 0'
                }}
              />
            );

          case 'bullet':
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  margin: '6px 0'
                }}
              >
                <span style={{ color: '#7B1C6E', fontWeight: 800, marginTop: '2px', flexShrink: 0 }}>•</span>
                <span style={{ flex: 1 }}>{renderInlineText(block.text)}</span>
              </div>
            );

          case 'numbered':
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  margin: '6px 0'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'rgba(123, 28, 110, 0.08)',
                    color: '#7B1C6E',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {block.num}
                </span>
                <span style={{ flex: 1, paddingTop: '1px' }}>{renderInlineText(block.text)}</span>
              </div>
            );

          case 'spacer':
            return <div key={idx} style={{ height: '8px' }} />;

          case 'p':
          default:
            return (
              <p
                key={idx}
                style={{
                  margin: '6px 0',
                  lineHeight: 1.7,
                  color: '#334155'
                }}
              >
                {renderInlineText(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
