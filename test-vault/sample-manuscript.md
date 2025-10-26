---
title: "Sample Academic Manuscript"
author: "Jane Doe"
date: "2025-10-26"
abstract: |
  This is a sample manuscript demonstrating the capabilities of Manuscript Pro for Obsidian. It includes mathematical equations, citations, cross-references, figures, and tables to test export functionality across multiple formats.
keywords: [academic writing, LaTeX, Pandoc, citations]
bibliography: references.bib
csl: apa.csl
---

# Introduction

Academic writing requires precise formatting and referencing capabilities. Recent studies have shown the importance of reproducible research workflows [@smith2023; @jones2024]. The mass-energy equivalence equation $E = mc^2$ was first derived by Einstein in 1905.

As demonstrated by @johnson2024, proper citation management is crucial for scholarly work. This manuscript serves as a comprehensive test of export capabilities.

# Methods

## Mathematical Notation

The quadratic formula is given by:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ {#eq:quadratic}

We can reference \autoref{eq:quadratic} in the text. The integral form is:

$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$ {#eq:gaussian}

## Cross-References

Throughout this document, we reference various elements:

- See \autoref{eq:quadratic} for the quadratic formula
- Refer to \autoref{fig:results} for experimental results
- Consult \autoref{tbl:data} for numerical values

# Results

## Experimental Data

| Parameter | Value | Unit |
|-----------|-------|------|
| Temperature | 298.15 | K |
| Pressure | 101.325 | kPa |
| Volume | 22.4 | L |

: Experimental measurements under standard conditions {#tbl:data}

The data in \autoref{tbl:data} shows measurements taken under STP conditions.

## Visualization

![Experimental results showing the relationship between variables. The error bars represent standard deviation across three trials.](placeholder-figure.png){#fig:results width=80%}

As shown in \autoref{fig:results}, there is a clear correlation between the independent and dependent variables.

# Discussion

The findings presented here align with previous work by @smith2023 and extend the results of @jones2024. The mathematical framework described in \autoref{eq:quadratic} provides a robust foundation for analysis.

## Limitations

1. Sample size constraints
2. Equipment precision limits
3. Environmental variability

Future work should address these limitations as suggested by @johnson2024.

# Conclusion

This manuscript demonstrates:

- **Mathematical typesetting** with equations and symbols
- **Citation management** with multiple reference styles
- **Cross-referencing** for figures, tables, and equations
- **Structured formatting** suitable for academic publication

The export functionality should preserve all formatting across PDF, DOCX, HTML, and EPUB formats.

# Acknowledgments

Thanks to the Obsidian community and Manuscript Pro developers.

# References

::: {#refs}
:::
