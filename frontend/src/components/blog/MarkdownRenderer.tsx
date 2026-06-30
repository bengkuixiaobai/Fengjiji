// Markdown 渲染器 — 包装 react-markdown,启用 GFM + 代码高亮
// 主题颜色通过 CSS 变量跟随 useThemeStore 切换
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { useThemeStore } from '../../stores/themeStore'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // 当前主题(深浅)用于 light 模式下的代码块配色微调
  useThemeStore(s => s.isDarkMode)

  // react-markdown v10: 组件 props 是函数式 children
  const components = useMemo(
    () => ({
      h1: ({ children, ...rest }: any) => (
        <h1
          {...rest}
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginTop: '8px',
            marginBottom: '16px',
            color: 'var(--text-color)',
            borderBottom: 'var(--divider-color)',
            paddingBottom: '10px',
          }}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...rest }: any) => (
        <h2
          {...rest}
          style={{
            fontSize: '22px',
            fontWeight: 700,
            marginTop: '32px',
            marginBottom: '14px',
            color: 'var(--text-color)',
            borderBottom: 'var(--divider-color)',
            paddingBottom: '8px',
          }}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...rest }: any) => (
        <h3
          {...rest}
          style={{
            fontSize: '18px',
            fontWeight: 600,
            marginTop: '24px',
            marginBottom: '10px',
            color: 'var(--text-color)',
          }}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...rest }: any) => (
        <h4
          {...rest}
          style={{ fontSize: '16px', fontWeight: 600, marginTop: '20px', marginBottom: '8px', color: 'var(--text-color)' }}
        >
          {children}
        </h4>
      ),
      p: ({ children, ...rest }: any) => (
        <p {...rest} style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--text-color)', marginBottom: '14px' }}>
          {children}
        </p>
      ),
      ul: ({ children, ...rest }: any) => (
        <ul {...rest} style={{ paddingLeft: '24px', marginBottom: '14px', color: 'var(--text-color)' }}>
          {children}
        </ul>
      ),
      ol: ({ children, ...rest }: any) => (
        <ol {...rest} style={{ paddingLeft: '24px', marginBottom: '14px', color: 'var(--text-color)' }}>
          {children}
        </ol>
      ),
      li: ({ children, ...rest }: any) => (
        <li {...rest} style={{ fontSize: '15px', lineHeight: 1.8, marginBottom: '4px' }}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...rest }: any) => (
        <blockquote
          {...rest}
          style={{
            borderLeft: '4px solid var(--accent-start)',
            background: 'rgba(102, 126, 234, 0.08)',
            padding: '10px 16px',
            margin: '14px 0',
            borderRadius: '0 8px 8px 0',
            color: 'var(--secondary-text)',
            fontStyle: 'italic',
          }}
        >
          {children}
        </blockquote>
      ),
      code: ({ inline, className, children, ...rest }: any) => {
        // inline code: 单行包裹代码
        if (inline) {
          return (
            <code
              className={className}
              {...rest}
              style={{
                background: 'rgba(102, 126, 234, 0.15)',
                color: '#a78bfa',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: '"JetBrains Mono", Consolas, Monaco, monospace',
              }}
            >
              {children}
            </code>
          )
        }
        // 块级代码 — 由 rehype-highlight 处理语言识别,className 会带 "language-xxx"
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        )
      },
      pre: ({ children, ...rest }: any) => (
        <pre
          {...rest}
          style={{
            background: '#0d1117',
            padding: '16px 18px',
            borderRadius: '8px',
            overflow: 'auto',
            margin: '14px 0',
            fontSize: '13px',
            lineHeight: 1.7,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {children}
        </pre>
      ),
      table: ({ children, ...rest }: any) => (
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table
            {...rest}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              color: 'var(--text-color)',
            }}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...rest }: any) => (
        <thead {...rest} style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
          {children}
        </thead>
      ),
      th: ({ children, ...rest }: any) => (
        <th
          {...rest}
          style={{
            padding: '10px 12px',
            textAlign: 'left',
            fontWeight: 600,
            borderBottom: '1px solid rgba(128, 128, 128, 0.3)',
            color: 'var(--text-color)',
          }}
        >
          {children}
        </th>
      ),
      td: ({ children, ...rest }: any) => (
        <td
          {...rest}
          style={{
            padding: '10px 12px',
            borderBottom: 'var(--divider-color)',
            color: 'var(--secondary-text)',
          }}
        >
          {children}
        </td>
      ),
      a: ({ children, ...rest }: any) => (
        <a
          {...rest}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-start)', textDecoration: 'none', borderBottom: '1px dashed rgba(102,126,234,0.4)' }}
        >
          {children}
        </a>
      ),
      img: ({ ...rest }: any) => (
        <img {...rest} style={{ maxWidth: '100%', borderRadius: '8px', margin: '8px 0' }} />
      ),
      hr: () => <hr style={{ border: 'none', borderTop: 'var(--divider-color)', margin: '24px 0' }} />,
      input: ({ type, checked, disabled, ...rest }: any) =>
        type === 'checkbox' ? (
          <input type="checkbox" checked={checked} readOnly disabled {...rest} style={{ marginRight: '6px' }} />
        ) : (
          <input type={type} {...rest} />
        ),
    }),
    [],
  )

  return (
    <div
      className={className}
      style={{ wordBreak: 'break-word', color: 'var(--text-color)' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}