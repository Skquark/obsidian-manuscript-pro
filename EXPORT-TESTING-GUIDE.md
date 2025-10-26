# Export Testing Guide

This guide walks through comprehensive testing of Manuscript Pro's export functionality.

## Prerequisites

1. **Pandoc Installed**: Download from https://pandoc.org
   - Verify installation: Open terminal/command prompt and run `pandoc --version`
   - Should show version 2.19 or higher

2. **Sample Files Ready**:
   - `test-vault/sample-manuscript.md` - Test document
   - `test-vault/references.bib` - Bibliography
   - Both files are included in the test-vault

## Test Suite

### Test 1: PDF Academic Export

**Purpose**: Test LaTeX/PDF export with full academic formatting

**Steps**:
1. Open Obsidian with test-vault
2. Open `sample-manuscript.md`
3. Click ribbon menu → 📤 Export → Quick Export to PDF
4. Wait for export to complete
5. Check output file

**Expected Results**:
- ✅ PDF file created in default output directory
- ✅ Citations formatted correctly (APA style)
- ✅ Equations rendered properly
- ✅ Cross-references working (Figure 1, Table 1, Equation 1)
- ✅ Table formatted correctly
- ✅ Bibliography generated at end

**Common Issues**:
- If "Pandoc not found": Check Pandoc installation and PATH
- If equations don't render: Ensure LaTeX distribution installed (MiKTeX/TeXLive)
- If citations missing: Check bibliography file path in frontmatter

---

### Test 2: DOCX Standard Export

**Purpose**: Test Microsoft Word export for journal submissions

**Steps**:
1. Open `sample-manuscript.md`
2. Click ribbon menu → 📤 Export → Quick Export to DOCX
3. Wait for export
4. Open .docx file in Microsoft Word or LibreOffice

**Expected Results**:
- ✅ DOCX file created
- ✅ Formatting preserved (headings, lists, emphasis)
- ✅ Equations as Word equations (editable)
- ✅ Table formatted
- ✅ Citations and bibliography included
- ✅ Cross-references as hyperlinks

**Common Issues**:
- Equations may be images instead of editable (depends on Pandoc version)
- Complex formatting may differ slightly from PDF

---

### Test 3: HTML Web Export

**Purpose**: Test web-friendly HTML export

**Steps**:
1. Open `sample-manuscript.md`
2. Click ribbon menu → 📤 Export → Quick Export to HTML
3. Wait for export
4. Open .html file in web browser

**Expected Results**:
- ✅ HTML file created
- ✅ Readable styling
- ✅ Equations rendered (MathML or MathJax)
- ✅ Table with proper HTML structure
- ✅ Citations as links (if DOI available)
- ✅ Bibliography section at end

**Common Issues**:
- Math rendering may vary by browser
- External stylesheet may be needed for better styling

---

### Test 4: EPUB eBook Export

**Purpose**: Test eBook format for publishing

**Steps**:
1. Open `sample-manuscript.md`
2. Click ribbon menu → 📤 Export → Quick Export to EPUB
3. Wait for export
4. Open .epub file in Calibre or eBook reader

**Expected Results**:
- ✅ EPUB file created and valid
- ✅ Table of contents from headings
- ✅ Images embedded
- ✅ Equations rendered
- ✅ Bibliography included

**Common Issues**:
- Some eBook readers have limited math support
- Check with EPUBCheck tool for validation

---

### Test 5: Export Dialog (Custom Settings)

**Purpose**: Test full export dialog with profile selection

**Steps**:
1. Open `sample-manuscript.md`
2. Click ribbon menu → 📤 Export → Export Current File...
3. Select different profiles:
   - PDF - Academic
   - DOCX - Standard
   - HTML - Web
   - EPUB - eBook
4. Try customizing:
   - Output location
   - CSL style (if available)
   - Metadata overrides

**Expected Results**:
- ✅ Dialog opens successfully
- ✅ All profiles listed
- ✅ File browser for output works
- ✅ Export completes with selected profile
- ✅ Notice shows success/failure

---

### Test 6: Error Handling

**Purpose**: Verify graceful error messages

**Test Cases**:

1. **Pandoc Missing**:
   - Rename/move Pandoc executable temporarily
   - Try to export
   - Expected: Clear error message "Pandoc not found. Please install..."

2. **Invalid Bibliography**:
   - Change frontmatter to non-existent .bib file
   - Try to export
   - Expected: Warning about missing bibliography (export may still work)

3. **Invalid Output Path**:
   - Set output to non-existent directory
   - Expected: Error or auto-create directory

4. **Missing Images**:
   - Reference non-existent image
   - Expected: Warning but export continues

---

## Export Profiles

### Default Profiles

| Profile ID | Format | Use Case |
|-----------|--------|----------|
| `pdf-academic` | PDF | Journal submissions, dissertations |
| `docx-standard` | DOCX | Collaboration, Word editing |
| `html-web` | HTML | Online publishing, blogs |
| `epub-ebook` | EPUB | eBook distribution |

### Testing Checklist

For each export format, verify:

- [ ] File is created successfully
- [ ] Citations render correctly
- [ ] Cross-references work
- [ ] Math equations display properly
- [ ] Tables are formatted
- [ ] Images are included (if applicable)
- [ ] Bibliography is generated
- [ ] Metadata (title, author, date) appears
- [ ] File can be opened in target application
- [ ] No corrupt data or broken formatting

---

## Debugging Export Issues

### Check Pandoc Installation

```bash
# Check if Pandoc is available
pandoc --version

# Check LaTeX (for PDF exports)
pdflatex --version  # or xelatex --version
```

### View Detailed Logs

1. Open Settings → Manuscript Pro → Export
2. Enable "Verbose Logging"
3. Try export again
4. Open Developer Console (Ctrl+Shift+I)
5. Check for Pandoc command and output

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Pandoc not found" | Pandoc not installed or not in PATH | Install Pandoc, restart Obsidian |
| "pdflatex not found" | LaTeX not installed | Install MiKTeX (Windows) or TeXLive |
| "Bibliography not found" | Invalid .bib path | Check frontmatter path |
| "Export timeout" | Large document, slow system | Increase timeout in settings |

---

## Performance Testing

For large manuscripts (100+ pages):

1. Test export time (should be < 30 seconds for most formats)
2. Check memory usage in Task Manager
3. Verify no Obsidian freezing during export
4. Test concurrent exports (if enabled)

---

## Report Results

After testing, document:

1. ✅ **Which formats worked** without issues
2. ⚠️ **Which formats had warnings** (non-critical issues)
3. ❌ **Which formats failed** (critical errors)
4. 📝 **Any unexpected behavior**

Copy results to GitHub issue or provide feedback to development team.

---

## Next Steps After Testing

If all tests pass:
- ✅ Export functionality is production-ready
- ✅ Can proceed with release preparation
- ✅ Document known limitations

If issues found:
- 🐛 Create bug reports with specific error messages
- 🔧 Prioritize fixes based on severity
- 📚 Update documentation with workarounds
