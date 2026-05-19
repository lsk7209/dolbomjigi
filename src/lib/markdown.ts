/** Simple markdown-to-HTML converter for guide body content */

function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 rounded px-1 text-xs font-mono">$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    )
}

function buildTable(tableLines: string[]): string {
  const dataLines = tableLines.filter((l) => !/^\|[\s|:-]+\|$/.test(l.trim()))
  if (dataLines.length === 0) return ''

  const [header, ...body] = dataLines
  const headerCells = header
    .split('|')
    .filter((c) => c.trim())
    .map(
      (c) =>
        `<th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50 whitespace-nowrap">${inlineMd(c.trim())}</th>`
    )
    .join('')

  const bodyRows = body
    .map((l) => {
      const cells = l
        .split('|')
        .filter((c) => c.trim())
        .map((c) => `<td class="px-3 py-2 text-xs text-gray-700 border-t border-gray-100">${inlineMd(c.trim())}</td>`)
        .join('')
      return `<tr class="hover:bg-gray-50">${cells}</tr>`
    })
    .join('')

  return `<div class="overflow-x-auto my-4 rounded-lg border border-gray-200">
    <table class="w-full text-sm">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>`
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      out.push('<hr class="my-6 border-gray-200" />')
      i++
      continue
    }

    // Headings
    if (line.startsWith('#### ')) {
      out.push(`<h5 class="text-sm font-bold text-gray-900 mt-5 mb-1">${inlineMd(line.slice(5))}</h5>`)
      i++
      continue
    }
    if (line.startsWith('### ')) {
      out.push(`<h4 class="text-base font-bold text-gray-900 mt-6 mb-2">${inlineMd(line.slice(4))}</h4>`)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      out.push(`<h3 class="text-lg font-bold text-gray-900 mt-8 mb-3 pb-1 border-b border-gray-100">${inlineMd(line.slice(3))}</h3>`)
      i++
      continue
    }
    if (line.startsWith('# ')) {
      out.push(`<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">${inlineMd(line.slice(2))}</h2>`)
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const contentParts = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++
        contentParts.push(lines[i].slice(2))
      }
      out.push(
        `<blockquote class="border-l-4 border-blue-300 bg-blue-50 pl-4 pr-3 py-2 my-4 rounded-r-lg text-sm text-gray-700">${inlineMd(contentParts.join(' '))}</blockquote>`
      )
      i++
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines = [line]
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) {
        i++
        tableLines.push(lines[i])
      }
      out.push(buildTable(tableLines))
      i++
      continue
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items = [line.replace(/^[-*] /, '')]
      while (i + 1 < lines.length && /^[-*] /.test(lines[i + 1])) {
        i++
        items.push(lines[i].replace(/^[-*] /, ''))
      }
      const lis = items.map((it) => `<li class="text-sm text-gray-700">${inlineMd(it)}</li>`).join('')
      out.push(`<ul class="list-disc pl-5 my-3 space-y-1">${lis}</ul>`)
      i++
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items = [line.replace(/^\d+\. /, '')]
      while (i + 1 < lines.length && /^\d+\. /.test(lines[i + 1])) {
        i++
        items.push(lines[i].replace(/^\d+\. /, ''))
      }
      const lis = items.map((it) => `<li class="text-sm text-gray-700">${inlineMd(it)}</li>`).join('')
      out.push(`<ol class="list-decimal pl-5 my-3 space-y-1">${lis}</ol>`)
      i++
      continue
    }

    // Empty line
    if (trimmed === '') {
      i++
      continue
    }

    // Paragraph — collect consecutive non-special lines
    let content = line
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() !== '' &&
      !lines[i + 1].startsWith('#') &&
      !lines[i + 1].startsWith('> ') &&
      !lines[i + 1].startsWith('|') &&
      !/^[-*] /.test(lines[i + 1]) &&
      !/^\d+\. /.test(lines[i + 1]) &&
      !/^---+$/.test(lines[i + 1].trim())
    ) {
      i++
      content += ' ' + lines[i]
    }
    out.push(`<p class="text-sm text-gray-700 leading-relaxed my-2">${inlineMd(content)}</p>`)
    i++
  }

  return out.join('\n')
}
