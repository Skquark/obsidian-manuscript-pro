---
title: LaTeX-Pandoc Concealer Test Document
author: Test Author
date: 2025-10-25
bibliography: references.bib
---

# Chapter 1: Testing Pattern Groups {#sec:intro}

This document tests all five pattern groups of the LaTeX-Pandoc Concealer plugin.

## Group 1: Math Delimiters

### Inline Math

The famous equation $E = mc^2$ shows the equivalence of mass and energy.

Einstein's field equations are given by $G_{\mu\nu} = 8\pi T_{\mu\nu}$.

Using LaTeX delimiters: \(a^2 + b^2 = c^2\) is the Pythagorean theorem.

### Display Math

Using double dollar signs:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

Using LaTeX delimiters:

\[
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
\]

### Math Environments

The Schrödinger equation:

\begin{equation}
i\hbar\frac{\partial}{\partial t}\Psi = \hat{H}\Psi
\end{equation}

System of equations:

\begin{align}
x + y &= 10 \\
2x - y &= 5
\end{align}

## Group 2: Citations

### Basic Citations

Recent studies [@smith2020] demonstrate this effect.

Multiple citations are common [@smith2020; @jones2021; @brown2019].

### Author-in-Text Citations

As @smith2020 points out, this is significant.

The work of @jones2021 builds on previous research.

### Citations with Locators

See detailed analysis [@smith2020, pp. 12-15] for more information.

Compare with [@jones2021, chapter 3].

### Suppressed Author Citations

The evidence is clear [-@smith2020].

## Group 3: LaTeX Commands

### Text Formatting

This is \textbf{bold text} and this is \emph{emphasized text}.

We can also use \textit{italic} and \textsc{small caps}.

Using \underline{underlined text} for emphasis.

### Sections and Labels

\section{Introduction}\label{sec:intro2}

This section introduces the topic.

\subsection{Background}\label{sec:background}

Background information goes here.

### References

As discussed in \ref{sec:intro}, we see that...

The equation \eqref{eq:schrodinger} is fundamental.

See \cref{sec:background} for details.

### Footnotes

This is important\footnote{This is a footnote with details.} information.

Another point\footnote{Additional clarification here.} to consider.

### Special Characters

The escape sequences: \& for ampersand, \% for percent, \$ for dollar, \{ for brace.

Line breaks are marked with \\ in LaTeX.

## Group 4: Pandoc Markup

### Custom Divs

:::warning
This is a warning block that should be clearly visible.
:::

:::{.callout}
This is a callout box with custom styling.
:::

:::{#important-note .note}
This is a note with an ID and class.
:::

### Attributes

This is [emphasized text]{.emphasis} with a class.

This heading has attributes {#custom-id .custom-class}

### Footnotes

This is a Pandoc footnote reference[^1] in the text.

Here's another one[^longnote] with a longer name.

[^1]: This is the footnote content.

[^longnote]: This is a longer footnote with multiple paragraphs.

    Second paragraph of the footnote.

### Line Blocks

| The first line
| The second line
| The third line

### Images with Attributes

![This is an image caption](image.png){width=50%}

![Another image](diagram.jpg){height=300px}

### Definition Lists

Term 1
:   Definition 1

Term 2
:   Definition 2a
:   Definition 2b

## Group 5: Indexing & Metadata

### Index Entries

This is an important term\index{important term} in the text.

The concept of relativity\index{relativity} is discussed here.

Hierarchical indexing\index{physics!relativity!general} is also supported.

### Glossary Terms

The \gls{api} is well-documented.

Multiple \glspl{api} are available.

### Custom IDs

This paragraph has a custom ID {#para:important} for referencing.

This heading has an anchor {#heading:special}

### Processing Directives

This heading is unnumbered {-}

Alternative syntax {.unnumbered}

### HTML Comments

<!-- This is a comment that should be hidden completely -->

<!-- 
Multi-line comment
that spans several lines
and should be hidden
-->

## Combined Testing

### All Groups Together

Recent research [@smith2020] shows that the equation $E = mc^2$ is fundamental\index{mass-energy equivalence}. As \textbf{Einstein} demonstrated\footnote{See @einstein1905 for the original paper.}, this relationship \ref{eq:mass-energy} has profound implications.

\begin{equation}\label{eq:mass-energy}
E = mc^2
\end{equation}

The concept\index{special relativity} is explained in \cref{sec:relativity}.

:::{.important}
This is a critical point about $c$ being the speed of light\index{speed of light}.
:::

### Edge Cases

#### Nested Elements

The expression \textbf{bold with $math = symbols$} inside.

Citation within emphasis: \emph{as shown in [@smith2020]}.

Math with reference: $x = y$ \label{eq:simple}

#### Multiple Patterns on Same Line

Study [@smith2020] finds $E = mc^2$ \index{energy} with \textbf{emphasis}.

#### Empty or Minimal Content

Empty bold: \textbf{} and empty emphasis: \emph{}.

Single character math: $x$ and $y$.

## Expected Results

When all groups are enabled, you should observe:

1. **Math delimiters**: Dollar signs and environment markers hidden
2. **Citations**: `@` symbols simplified or removed
3. **LaTeX commands**: Converted to markdown equivalents or hidden
4. **Pandoc markup**: Div markers and attributes hidden
5. **Indexing**: Index entries and metadata completely hidden

When you move your cursor to a line, the original syntax should be revealed for editing.

## Test Checklist

- [ ] Math delimiters are hidden in inline and display math
- [ ] Math environment markers are concealed
- [ ] Citation brackets and @ symbols are simplified
- [ ] LaTeX formatting commands are hidden or converted
- [ ] Section and label commands are hidden
- [ ] Reference commands show arrow symbols
- [ ] Pandoc div markers are hidden
- [ ] Attributes in curly braces are hidden
- [ ] Index entries are completely hidden
- [ ] HTML comments are hidden
- [ ] Cursor reveals syntax on current line
- [ ] Moving cursor away re-conceals syntax
- [ ] All pattern groups can be toggled individually
- [ ] Performance is smooth with all groups enabled

---

**Last updated**: 2025-10-25
