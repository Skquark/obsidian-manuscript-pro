# Documentation Organization

This directory contains development documentation, design decisions, and historical records for Obsidian Manuscript Pro.

## Directory Structure

### 📁 `completed-phases/`
**Completed development phases and implementation reports**
- Phase 1-6 completion reports
- ESLint cleanup report
- Bug fixes and improvements log

Contains historical records of major development milestones, useful for understanding the evolution of the plugin.

### 📁 `planning/`
**Architecture and design documentation**
- Panel UX design specifications
- UI architecture plans
- Template system analysis
- Implementation reviews

Reference documentation for understanding architectural decisions and system design.

### 📁 `future/`
**Planned features and enhancements**
- Future feature roadmap
- Next enhancement priorities
- Unimplemented features
- Export system improvements
- Codex integration plans

Ideas and plans for future development. May contain outdated or superseded proposals.

### 📁 `release-notes/`
**Project milestones and release documentation**
- Project separation analysis (from Fountain Pro)
- Freemium licensing plan
- Release notes archive
- Agent communication logs

Historical context for major project decisions and releases.

### 📁 `user-guides/`
**End-user documentation**
- Keyboard shortcuts reference
- Export testing guide

User-facing documentation that may be promoted to the main README or wiki.

## For Contributors

When working on the project:

1. **Start with:** `/README.md` - Main project documentation
2. **Developer setup:** `/CLAUDE.md` - Comprehensive developer guide
3. **Version history:** `/CHANGELOG.md` - Track changes across versions
4. **Current state:** Check `future/` for planned work
5. **Understanding decisions:** Review `planning/` and `completed-phases/`

## For Users

Most users should refer to:
- `/README.md` - Plugin overview and installation
- `user-guides/` - Usage instructions
- `/CHANGELOG.md` - What's new in each version

## Maintenance

- **Active docs:** Root directory only (README, CLAUDE, CHANGELOG)
- **Archive:** Everything in `docs/` is historical or planning
- **Updates:** Historical docs are rarely updated; they preserve development history
