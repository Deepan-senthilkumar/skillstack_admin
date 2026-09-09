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
      margin: '14px 0',
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

      // Link formatting: [label](url)
      const linkParts = bPart.split(/(\[[^\]]+\]\([^)]+\))/g);
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
}

export default function RichContentRenderer({ content, className = '' }) {
  if (!content || !content.trim()) {
    return null;
  }

  // Parse markdown into blocks
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

    // Horizontal Rule
    if (/^---/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      continue;
    }

    // Bullet item
    if (/^[-*] /.test(line)) {
      blocks.push({ type: 'bullet', text: line.replace(/^[-*] /, '') });
      continue;
    }

    // Numbered step: 1. Step name
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
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
    <div className={`rich-content-flow ${className}`} style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'code':
            return <CodeBlock key={idx} code={block.code} lang={block.lang} />;

          case 'h1':
            return (
              <h2
                key={idx}
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '18px 0 8px',
                  paddingBottom: '5px',
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
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#1E293B',
                  margin: '16px 0 6px'
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
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#7B1C6E',
                  margin: '14px 0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
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
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#334155',
                  margin: '10px 0 4px'
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
                  margin: '14px 0'
                }}
              />
            );

          case 'bullet':
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  margin: '3px 0'
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
                  gap: '8px',
                  alignItems: 'flex-start',
                  margin: '5px 0'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '5px',
                    background: 'rgba(123, 28, 110, 0.08)',
                    color: '#7B1C6E',
                    fontSize: '11px',
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
            return <div key={idx} style={{ height: '6px' }} />;

          case 'p':
          default:
            return (
              <p
                key={idx}
                style={{
                  margin: '5px 0',
                  lineHeight: 1.65,
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
