/**
 * LaTeX Command Spec Library (Phase A seed)
 * Spec-driven definitions for common commands/environments/wrappers
 */

export type ArgKind = 'positional' | 'optional';

export interface CommandArg {
  name: string;
  label?: string;
  required?: boolean;
  kind: ArgKind;
  key?: string; // for optional arg key-value (e.g., width)
  defaultValue?: string;
  options?: string[]; // for select-like fields
}

export type SpecKind = 'command' | 'environment' | 'wrapper';

export interface CommandSpec {
  id: string;
  kind: SpecKind;
  name: string; // canonical name, e.g., \includegraphics
  label: string; // UI label
  aliases?: string[];
  tags?: string[];
  signature: string; // human-readable
  args: CommandArg[];
  // Render text to insert for this spec
  template: (args: Record<string, string>, selection?: string) => string;
  // Regexes to detect existing usage around cursor (simple, line-scoped for Phase A)
  detect?: RegExp[];
}

const wrap = (cmd: string, selection?: string) =>
  selection ? `${cmd}{${selection}}` : `${cmd}{}`;

export const COMMAND_SPECS: CommandSpec[] = [
  {
    id: 'textbf',
    kind: 'wrapper',
    name: '\\textbf',
    label: 'Bold (\\textbf{})',
    tags: ['format', 'bold'],
    signature: '\\textbf{content}',
    args: [{ name: 'content', label: 'Content', kind: 'positional', required: false }],
    template: (a, sel) => wrap('\\textbf', sel ?? a.content),
    detect: [/\\textbf\{[^}]*\}/],
  },
  {
    id: 'underline',
    kind: 'wrapper',
    name: '\\underline',
    label: 'Underline (\\underline{})',
    tags: ['format'],
    signature: '\\underline{content}',
    args: [{ name: 'content', label: 'Content', kind: 'positional', required: false }],
    template: (a, sel) => (sel ? `\\underline{${sel}}` : `\\underline{${a.content || ''}}`),
    detect: [/\\underline\{[^}]*\}/],
  },
  {
    id: 'overline',
    kind: 'wrapper',
    name: '\\overline',
    label: 'Overline (\\overline{})',
    tags: ['math'],
    signature: '\\overline{content}',
    args: [{ name: 'content', label: 'Content', kind: 'positional', required: false }],
    template: (a, sel) => (sel ? `\\overline{${sel}}` : `\\overline{${a.content || ''}}`),
    detect: [/\\overline\{[^}]*\}/],
  },
  {
    id: 'mathbb',
    kind: 'wrapper',
    name: '\\mathbb',
    label: 'Blackboard Bold (\\mathbb{})',
    tags: ['math'],
    signature: '\\mathbb{A}',
    args: [{ name: 'content', label: 'Symbol', kind: 'positional', required: true }],
    template: (a, sel) => `\\mathbb{${sel || a.content || 'R'}}`,
    detect: [/\\mathbb\{[^}]*\}/],
  },
  {
    id: 'autoref',
    kind: 'command',
    name: '\\autoref',
    label: 'Auto Reference (\\autoref{})',
    tags: ['ref', 'hyperref'],
    signature: '\\autoref{key}',
    args: [{ name: 'key', label: 'Key', kind: 'positional', required: true }],
    template: (a) => `\\autoref{${a.key || ''}}`,
    detect: [/\\autoref\{[^}]*\}/],
  },
  {
    id: 'textcite',
    kind: 'command',
    name: '\\textcite',
    label: 'Text Citation (\\textcite{})',
    tags: ['citation', 'biblatex'],
    signature: '\\textcite{key}',
    args: [{ name: 'key', label: 'Citation Key', kind: 'positional', required: true }],
    template: (a) => `\\textcite{${a.key || ''}}`,
    detect: [/\\textcite\{[^}]*\}/],
  },
  {
    id: 'parencite',
    kind: 'command',
    name: '\\parencite',
    label: 'Parenthetical Citation (\\parencite{})',
    tags: ['citation', 'biblatex'],
    signature: '\\parencite{key}',
    args: [{ name: 'key', label: 'Citation Key', kind: 'positional', required: true }],
    template: (a) => `\\parencite{${a.key || ''}}`,
    detect: [/\\parencite\{[^}]*\}/],
  },
  {
    id: 'emph',
    kind: 'wrapper',
    name: '\\emph',
    label: 'Emphasis (\\emph{})',
    tags: ['format', 'italic'],
    signature: '\\emph{content}',
    args: [{ name: 'content', label: 'Content', kind: 'positional', required: false }],
    template: (a, sel) => wrap('\\emph', sel ?? a.content),
    detect: [/\\emph\{[^}]*\}/],
  },
  {
    id: 'environment-subfigure',
    kind: 'environment',
    name: 'subfigure',
    label: 'Environment: subfigure',
    tags: ['figure', 'subfigure', 'environment'],
    signature: '\\begin{subfigure}[b]{0.45\\textwidth} ... \\end{subfigure}',
    args: [
      { name: 'placement', label: 'Placement', kind: 'optional', key: 'placement', defaultValue: 'b' },
      { name: 'width', label: 'Width (e.g., 0.45\\textwidth)', kind: 'positional', required: true },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.placement ? `[${a.placement}]` : '';
      const width = a.width ? `{${a.width}}` : '';
      return `\\begin{subfigure}${opt}${width}\n${sel ?? a.body ?? ''}\n\\end{subfigure}`;
    },
  },
  {
    id: 'environment-minted',
    kind: 'environment',
    name: 'minted',
    label: 'Environment: minted',
    tags: ['code', 'minted', 'environment'],
    signature: '\\begin{minted}[options]{language} ... \\end{minted}',
    args: [
      { name: 'options', label: 'Options (comma-separated)', kind: 'optional' },
      { name: 'language', label: 'Language', kind: 'positional', required: true },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.options ? `[${a.options}]` : '';
      const lang = a.language ? `{${a.language}}` : '{text}';
      return `\\begin{minted}${opt}${lang}\n${sel ?? a.body ?? ''}\n\\end{minted}`;
    },
  },
  {
    id: 'environment-lstlisting',
    kind: 'environment',
    name: 'lstlisting',
    label: 'Environment: lstlisting',
    tags: ['code', 'listings', 'environment'],
    signature: '\\begin{lstlisting}[language=Python, numbers=left] ... \\end{lstlisting}',
    args: [
      { name: 'language', label: 'Language', kind: 'optional', key: 'language' },
      { name: 'options', label: 'More options (comma-separated)', kind: 'optional' },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opts: string[] = [];
      if (a.language) opts.push(`language=${a.language}`);
      if (a.options) opts.push(a.options);
      const opt = opts.length ? `[${opts.join(', ')}]` : '';
      return `\\begin{lstlisting}${opt}\n${sel ?? a.body ?? ''}\n\\end{lstlisting}`;
    },
  },
  {
    id: 'environment-theorem',
    kind: 'environment',
    name: 'theorem',
    label: 'Environment: theorem',
    tags: ['math', 'theorem', 'environment'],
    signature: '\\begin{theorem}[Name] ... \\end{theorem}',
    args: [
      { name: 'name', label: 'Name (optional)', kind: 'optional' },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.name ? `[${a.name}]` : '';
      return `\\begin{theorem}${opt}\n${sel ?? a.body ?? ''}\n\\end{theorem}`;
    },
  },
  {
    id: 'environment-lemma',
    kind: 'environment',
    name: 'lemma',
    label: 'Environment: lemma',
    tags: ['math', 'theorem', 'environment'],
    signature: '\\begin{lemma}[Name] ... \\end{lemma}',
    args: [
      { name: 'name', label: 'Name (optional)', kind: 'optional' },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.name ? `[${a.name}]` : '';
      return `\\begin{lemma}${opt}\n${sel ?? a.body ?? ''}\n\\end{lemma}`;
    },
  },
  {
    id: 'environment-proof',
    kind: 'environment',
    name: 'proof',
    label: 'Environment: proof',
    tags: ['math', 'proof', 'environment'],
    signature: '\\begin{proof}[Name] ... \\end{proof}',
    args: [
      { name: 'name', label: 'Name (optional)', kind: 'optional' },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.name ? `[${a.name}]` : '';
      return `\\begin{proof}${opt}\n${sel ?? a.body ?? ''}\n\\end{proof}`;
    },
  },
  {
    id: 'texttt',
    kind: 'wrapper',
    name: '\\texttt',
    label: 'Monospace (\\texttt{})',
    tags: ['format', 'code'],
    signature: '\\texttt{content}',
    args: [{ name: 'content', label: 'Content', kind: 'positional', required: false }],
    template: (a, sel) => wrap('\\texttt', sel ?? a.content),
    detect: [/\\texttt\{[^}]*\}/],
  },
  {
    id: 'section',
    kind: 'command',
    name: '\\section',
    label: 'Section (\\section{})',
    tags: ['structure'],
    signature: '\\section{title}',
    args: [{ name: 'title', label: 'Title', kind: 'positional', required: true }],
    template: (a) => `\\section{${a.title || ''}}`,
    detect: [/\\section\{[^}]*\}/],
  },
  {
    id: 'subsection',
    kind: 'command',
    name: '\\subsection',
    label: 'Subsection (\\subsection{})',
    tags: ['structure'],
    signature: '\\subsection{title}',
    args: [{ name: 'title', label: 'Title', kind: 'positional', required: true }],
    template: (a) => `\\subsection{${a.title || ''}}`,
    detect: [/\\subsection\{[^}]*\}/],
  },
  {
    id: 'label',
    kind: 'command',
    name: '\\label',
    label: 'Label (\\label{})',
    tags: ['ref'],
    signature: '\\label{key}',
    args: [{ name: 'key', label: 'Key', kind: 'positional', required: true }],
    template: (a) => `\\label{${a.key || ''}}`,
    detect: [/\\label\{[^}]*\}/],
  },
  {
    id: 'ref',
    kind: 'command',
    name: '\\ref',
    label: 'Reference (\\ref{})',
    tags: ['ref'],
    signature: '\\ref{key}',
    args: [{ name: 'key', label: 'Key', kind: 'positional', required: true }],
    template: (a) => `\\ref{${a.key || ''}}`,
    detect: [/\\ref\{[^}]*\}/],
  },
  {
    id: 'eqref',
    kind: 'command',
    name: '\\eqref',
    label: 'Equation Ref (\\eqref{})',
    tags: ['ref'],
    signature: '\\eqref{key}',
    args: [{ name: 'key', label: 'Key', kind: 'positional', required: true }],
    template: (a) => `\\eqref{${a.key || ''}}`,
    detect: [/\\eqref\{[^}]*\}/],
  },
  {
    id: 'frac',
    kind: 'command',
    name: '\\frac',
    label: 'Fraction (\\frac{}{})',
    tags: ['math'],
    signature: '\\frac{numerator}{denominator}',
    args: [
      { name: 'numerator', label: 'Numerator', kind: 'positional', required: true },
      { name: 'denominator', label: 'Denominator', kind: 'positional', required: true },
    ],
    template: (a) => `\\frac{${a.numerator || ''}}{${a.denominator || ''}}`,
    detect: [/\\frac\{[^}]*\}\{[^}]*\}/],
  },
  {
    id: 'sqrt',
    kind: 'command',
    name: '\\sqrt',
    label: 'Square Root (\\sqrt{})',
    tags: ['math'],
    signature: '\\sqrt{value}',
    args: [{ name: 'value', label: 'Value', kind: 'positional', required: true }],
    template: (a) => `\\sqrt{${a.value || ''}}`,
    detect: [/\\sqrt\{[^}]*\}/],
  },
  {
    id: 'sum-limits',
    kind: 'command',
    name: '\\sum',
    label: 'Sum with limits (\\sum_{i=1}^{n})',
    tags: ['math'],
    signature: '\\sum_{i=1}^{n}',
    args: [
      { name: 'index', label: 'Index variable', kind: 'positional', required: true, defaultValue: 'i' },
      { name: 'from', label: 'From', kind: 'positional', required: true, defaultValue: '1' },
      { name: 'to', label: 'To', kind: 'positional', required: true, defaultValue: 'n' },
    ],
    template: (a) => `\\sum_{${a.index || 'i'}=${a.from || '1'}}^{${a.to || 'n'}}`,
  },
  {
    id: 'integral-limits',
    kind: 'command',
    name: '\\int',
    label: 'Integral with limits (\\int_{a}^{b})',
    tags: ['math'],
    signature: '\\int_{a}^{b}',
    args: [
      { name: 'from', label: 'From (lower)', kind: 'positional', required: true, defaultValue: 'a' },
      { name: 'to', label: 'To (upper)', kind: 'positional', required: true, defaultValue: 'b' },
    ],
    template: (a) => `\\int_{${a.from || 'a'}}^{${a.to || 'b'}}`,
  },
  {
    id: 'prod-limits',
    kind: 'command',
    name: '\\prod',
    label: 'Product with limits (\\prod_{i=1}^{n})',
    tags: ['math'],
    signature: '\\prod_{i=1}^{n}',
    args: [
      { name: 'index', label: 'Index variable', kind: 'positional', required: true, defaultValue: 'i' },
      { name: 'from', label: 'From', kind: 'positional', required: true, defaultValue: '1' },
      { name: 'to', label: 'To', kind: 'positional', required: true, defaultValue: 'n' },
    ],
    template: (a) => `\\prod_{${a.index || 'i'}=${a.from || '1'}}^{${a.to || 'n'}}`,
  },
  {
    id: 'lim-to',
    kind: 'command',
    name: '\\lim',
    label: 'Limit (\\lim_{x \\to a})',
    tags: ['math'],
    signature: '\\lim_{x \\to a}',
    args: [
      { name: 'var', label: 'Variable', kind: 'positional', required: true, defaultValue: 'x' },
      { name: 'to', label: 'Approaches', kind: 'positional', required: true, defaultValue: 'a' },
    ],
    template: (a) => `\\lim_{${a.var || 'x'} \\to ${a.to || 'a'}}`,
  },
  {
    id: 'subcaption',
    kind: 'command',
    name: '\\subcaption',
    label: 'Subcaption (\\subcaption{})',
    tags: ['caption', 'subfigure'],
    signature: '\\subcaption{text}',
    args: [{ name: 'text', label: 'Text', kind: 'positional', required: true }],
    template: (a) => `\\subcaption{${a.text || ''}}`,
    detect: [/\\subcaption\{[^}]*\}/],
  },
  {
    id: 'subcaptionbox',
    kind: 'command',
    name: '\\subcaptionbox',
    label: 'Subcaption Box (\\subcaptionbox{...}[w]{...})',
    tags: ['caption', 'subfigure'],
    signature: '\\subcaptionbox{caption}[width]{content}',
    args: [
      { name: 'text', label: 'Caption', kind: 'positional', required: true },
      { name: 'width', label: 'Width (e.g., 0.45\\textwidth)', kind: 'optional' },
      { name: 'body', label: 'Content', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.width ? `[${a.width}]` : '';
      const content = sel ?? a.body ?? '';
      return `\\subcaptionbox{${a.text || ''}}${opt}{${content}}`;
    },
    detect: [/\\subcaptionbox\{[^}]*\}(\[[^\]]*\])?\{[^}]*\}/],
  },
  {
    id: 'figure-block',
    kind: 'command',
    name: 'figure-block',
    label: 'Figure Block (env + includegraphics + caption/label)',
    tags: ['figure', 'graphics'],
    signature: '\\begin{figure}[htbp] ... \\end{figure}',
    args: [
      { name: 'placement', label: 'Placement', kind: 'optional', key: 'placement' },
      { name: 'width', label: 'Width (e.g., 0.8\\textwidth)', kind: 'optional', key: 'width' },
      { name: 'path', label: 'Image Path', kind: 'positional', required: true },
      { name: 'caption', label: 'Caption', kind: 'positional', required: false },
      { name: 'label', label: 'Label (without fig:)', kind: 'positional', required: false },
    ],
    template: (a) => {
      const placement = a.placement ? `[${a.placement}]` : '';
      const wopt = a.width ? `[width=${a.width}]` : '';
      const cap = a.caption ? `\n\\caption{${a.caption}}` : '';
      const lab = a.label ? `\n\\label{fig:${a.label}}` : '';
      return `\\begin{figure}${placement}\n\\centering\n\\includegraphics${wopt}{${a.path || ''}}${cap}${lab}\n\\end{figure}`;
    },
  },
  {
    id: 'includegraphics',
    kind: 'command',
    name: '\\includegraphics',
    label: 'Include Graphics',
    tags: ['figure', 'graphics'],
    signature: '\\includegraphics[width=0.8\\textwidth]{path}',
    args: [
      { name: 'width', label: 'Width (e.g., 0.8\\textwidth)', kind: 'optional', key: 'width' },
      { name: 'height', label: 'Height (e.g., 5cm)', kind: 'optional', key: 'height' },
      { name: 'scale', label: 'Scale (e.g., 0.5)', kind: 'optional', key: 'scale' },
      { name: 'path', label: 'Image Path', kind: 'positional', required: true },
    ],
    template: (a) => {
      const optsArr: string[] = [];
      if (a.width) optsArr.push(`width=${a.width}`);
      if (a.height) optsArr.push(`height=${a.height}`);
      if (a.scale) optsArr.push(`scale=${a.scale}`);
      const opts = optsArr.length ? `[${optsArr.join(', ')}]` : '';
      return `\\includegraphics${opts}{${a.path || ''}}`;
    },
    detect: [/\\includegraphics(\[[^\]]*\])?\{[^}]*\}/],
  },
  {
    id: 'captionof',
    kind: 'command',
    name: '\\captionof',
    label: 'Caption Of (\\captionof{type}{text})',
    tags: ['caption', 'figure', 'table'],
    signature: '\\captionof{figure}{Caption text}',
    args: [
      { name: 'type', label: 'Type (figure/table)', kind: 'positional', required: true, defaultValue: 'figure' },
      { name: 'text', label: 'Text', kind: 'positional', required: true },
    ],
    template: (a) => `\\captionof{${a.type || 'figure'}}{${a.text || ''}}`,
    detect: [/\\captionof\{[^}]*\}\{[^}]*\}/],
  },
  {
    id: 'input',
    kind: 'command',
    name: '\\input',
    label: 'Input (\\input{file})',
    tags: ['include'],
    signature: '\\input{file}',
    args: [{ name: 'file', label: 'File Path', kind: 'positional', required: true }],
    template: (a) => `\\input{${a.file || ''}}`,
    detect: [/\\input\{[^}]*\}/],
  },
  {
    id: 'include',
    kind: 'command',
    name: '\\include',
    label: 'Include (\\include{file})',
    tags: ['include'],
    signature: '\\include{file}',
    args: [{ name: 'file', label: 'File Path', kind: 'positional', required: true }],
    template: (a) => `\\include{${a.file || ''}}`,
    detect: [/\\include\{[^}]*\}/],
  },
  {
    id: 'caption',
    kind: 'command',
    name: '\\caption',
    label: 'Caption (\\caption{})',
    tags: ['figure', 'table'],
    signature: '\\caption{text}',
    args: [{ name: 'text', label: 'Text', kind: 'positional', required: true }],
    template: (a) => `\\caption{${a.text || ''}}`,
    detect: [/\\caption\{[^}]*\}/],
  },
  {
    id: 'centering',
    kind: 'command',
    name: '\\centering',
    label: 'Centering (\\centering)',
    tags: ['figure', 'table'],
    signature: '\\centering',
    args: [],
    template: () => `\\centering`,
    detect: [/\\centering/],
  },
  {
    id: 'environment-equation',
    kind: 'environment',
    name: 'equation',
    label: 'Environment: equation',
    tags: ['math', 'environment'],
    signature: '\\begin{equation} ... \\end{equation}',
    args: [{ name: 'body', label: 'Body', kind: 'positional', required: false }],
    template: (a, sel) => `\\begin{equation}\n${sel ?? a.body ?? ''}\n\\end{equation}`,
  },
  {
    id: 'environment-align',
    kind: 'environment',
    name: 'align',
    label: 'Environment: align',
    tags: ['math', 'environment'],
    signature: '\\begin{align} ... \\end{align}',
    args: [{ name: 'body', label: 'Body', kind: 'positional', required: false }],
    template: (a, sel) => `\\begin{align}\n${sel ?? a.body ?? ''}\n\\end{align}`,
  },
  {
    id: 'environment-itemize',
    kind: 'environment',
    name: 'itemize',
    label: 'Environment: itemize',
    tags: ['list', 'environment'],
    signature: '\\begin{itemize} ... \\end{itemize}',
    args: [{ name: 'body', label: 'Body', kind: 'positional', required: false }],
    template: (a, sel) => `\\begin{itemize}\n${sel ?? a.body ?? '\\item '}\n\\end{itemize}`,
  },
  {
    id: 'environment-enumerate',
    kind: 'environment',
    name: 'enumerate',
    label: 'Environment: enumerate',
    tags: ['list', 'environment'],
    signature: '\\begin{enumerate} ... \\end{enumerate}',
    args: [{ name: 'body', label: 'Body', kind: 'positional', required: false }],
    template: (a, sel) => `\\begin{enumerate}\n${sel ?? a.body ?? '\\item '}\n\\end{enumerate}`,
  },
  {
    id: 'environment-figure',
    kind: 'environment',
    name: 'figure',
    label: 'Environment: figure',
    tags: ['figure', 'environment'],
    signature: '\\begin{figure}[htbp] ... \\end{figure}',
    args: [
      { name: 'placement', label: 'Placement', kind: 'optional', key: 'placement', defaultValue: 'htbp' },
      { name: 'body', label: 'Body', kind: 'positional', required: false },
    ],
    template: (a, sel) => {
      const opt = a.placement ? `[${a.placement}]` : '';
      return `\\begin{figure}${opt}\n${sel ?? a.body ?? ''}\n\\end{figure}`;
    },
  },
];
