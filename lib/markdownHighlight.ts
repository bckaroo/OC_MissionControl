interface HighlightedSegment {
  text: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

export function highlightMarkdown(content: string): HighlightedSegment[] {
  const segments: HighlightedSegment[] = [];
  let i = 0;

  while (i < content.length) {
    // Headers
    if (content[i] === "#") {
      const headerMatch = content.slice(i).match(/^(#{1,6})\s+(.+?)(\n|$)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        segments.push({
          text: headerMatch[0],
          color: level === 1 ? "#f97316" : level === 2 ? "#f59e0b" : "#eab308",
          bold: true,
        });
        i += headerMatch[0].length;
        continue;
      }
    }

    // Code blocks
    if (content[i] === "`" && content.slice(i, i + 3) === "```") {
      const codeMatch = content.slice(i).match(/```[\s\S]*?```/);
      if (codeMatch) {
        segments.push({
          text: codeMatch[0],
          color: "#6b7280",
        });
        i += codeMatch[0].length;
        continue;
      }
    }

    // Inline code
    if (content[i] === "`") {
      const codeMatch = content.slice(i).match(/`[^`]+`/);
      if (codeMatch) {
        segments.push({
          text: codeMatch[0],
          color: "#10b981",
        });
        i += codeMatch[0].length;
        continue;
      }
    }

    // Bold
    if (content.slice(i, i + 2) === "**") {
      const boldMatch = content.slice(i + 2).match(/.*?\*\*/);
      if (boldMatch) {
        segments.push({
          text: "**" + boldMatch[0],
          color: "#f97316",
          bold: true,
        });
        i += 2 + boldMatch[0].length;
        continue;
      }
    }

    // Italic
    if (content[i] === "*" && content[i + 1] !== "*") {
      const italicMatch = content.slice(i + 1).match(/.*?\*/);
      if (italicMatch) {
        segments.push({
          text: "*" + italicMatch[0],
          color: "#a78bfa",
          italic: true,
        });
        i += 1 + italicMatch[0].length;
        continue;
      }
    }

    // Links
    if (content[i] === "[") {
      const linkMatch = content.slice(i).match(/\[.+?\]\(.+?\)/);
      if (linkMatch) {
        segments.push({
          text: linkMatch[0],
          color: "#3b82f6",
        });
        i += linkMatch[0].length;
        continue;
      }
    }

    // Lists
    if ((content[i] === "-" || content[i] === "*" || content[i] === "+") && (i === 0 || content[i - 1] === "\n")) {
      const listMatch = content.slice(i).match(/^[-*+]\s+.+/);
      if (listMatch) {
        segments.push({
          text: listMatch[0],
          color: "#22c55e",
        });
        i += listMatch[0].length;
        continue;
      }
    }

    // Blockquotes
    if (content[i] === ">" && (i === 0 || content[i - 1] === "\n")) {
      const quoteMatch = content.slice(i).match(/^>\s+.+/);
      if (quoteMatch) {
        segments.push({
          text: quoteMatch[0],
          color: "#6b7280",
          italic: true,
        });
        i += quoteMatch[0].length;
        continue;
      }
    }

    // Regular text
    let j = i + 1;
    while (j < content.length && content[j] !== "#" && content[j] !== "`" && content[j] !== "[" && content[j] !== "*" && content[j] !== ">") {
      j++;
    }
    segments.push({
      text: content.slice(i, j),
      color: "var(--text-secondary)",
    });
    i = j;
  }

  return segments;
}
