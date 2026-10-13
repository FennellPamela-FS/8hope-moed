import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

/**
 * Renders pasted words (Markdown + math) as formatted text. Kept in its own
 * module so the Markdown/KaTeX libraries load only on pages that use it.
 *
 * Math written with \( … \) / \[ … \] — the delimiters ChatGPT, Gemini, and
 * NotebookLM copy out — is rewritten to the $ / $$ form remark-math reads.
 * Some exports double the backslash (\\( … \\)), so both are handled.
 *
 * Pasted text usually separates paragraphs with a single line break, which
 * Markdown would merge — so single breaks are kept (remark-breaks), and a
 * plain line right after a bullet starts a new paragraph instead of being
 * folded into that bullet.
 */
export default function RichText({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ?? 'axios-prose'}>
      <Markdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex]}>
        {separateListEnds(normalizeMath(children))}
      </Markdown>
    </div>
  )
}

function normalizeMath(text: string): string {
  return text
    .replace(/\\{1,2}\[([\s\S]+?)\\{1,2}\]/g, (_, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
    .replace(/\\{1,2}\(([\s\S]+?)\\{1,2}\)/g, (_, expr: string) => `$${expr.trim()}$`)
}

const LIST_ITEM = /^\s*([*+-]|\d+[.)])\s/

function separateListEnds(text: string): string {
  const lines = text.split('\n')
  return lines
    .map((line, i) => {
      const prev = lines[i - 1]
      const endsList = prev !== undefined && LIST_ITEM.test(prev) && line.trim() !== '' && !LIST_ITEM.test(line) && !/^\s{2,}/.test(line)
      return endsList ? `\n${line}` : line
    })
    .join('\n')
}
