/**
 * Readability Analysis Manager
 *
 * Analyzes text readability using multiple formulas and provides
 * audience-appropriate recommendations.
 */

import { App, TFile, Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import {
  ReadabilityMetrics,
  AudienceProfile,
  AudienceType,
  SectionReadability,
  ReadabilityReport,
  ComplexityLevel,
} from './QualityInterfaces';

export class ReadabilityAnalyzer {
  private app: App;
  private plugin: ManuscriptProPlugin;

  // Audience profiles
  private readonly AUDIENCES: Record<AudienceType, AudienceProfile> = {
    'general-public': {
      type: 'general-public',
      targetGradeLevel: 8,
      targetFleschScore: 60,
      description: 'Popular science, blog posts, general audience',
    },
    'undergraduate': {
      type: 'undergraduate',
      targetGradeLevel: 13,
      targetFleschScore: 50,
      description: 'Textbooks, educational materials',
    },
    'graduate': {
      type: 'graduate',
      targetGradeLevel: 16,
      targetFleschScore: 40,
      description: 'Academic papers, theses, graduate-level',
    },
    'expert': {
      type: 'expert',
      targetGradeLevel: 18,
      targetFleschScore: 30,
      description: 'Journal articles, technical reports, expert-level',
    },
    'journal': {
      type: 'journal',
      targetGradeLevel: 18,
      targetFleschScore: 30,
      description: 'Academic journal publications',
    },
  };

  constructor(plugin: ManuscriptProPlugin) {
    this.plugin = plugin;
    this.app = plugin.app;
  }

  // ============================================
  // MAIN ANALYSIS
  // ============================================

  async analyzeDocument(file?: TFile): Promise<ReadabilityReport> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile) {
      throw new Error('No file to analyze');
    }

    const content = await this.app.vault.read(targetFile);
    const cleanContent = this.stripMarkdown(content);

    // Overall metrics
    const overall = this.calculateMetrics(cleanContent);

    // Section-by-section analysis
    const sections = await this.analyzeSections(content);

    // Get target audience
    const targetAudience = this.getTargetAudience();

    // Compare to target
    const comparison = {
      gradeLevel: overall.gradeLevel - targetAudience.targetGradeLevel,
      fleschScore: overall.fleschReadingEase - targetAudience.targetFleschScore,
      status: this.determineStatus(overall, targetAudience),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(overall, targetAudience);

    return {
      overall,
      sections,
      targetAudience,
      comparisonToTarget: comparison,
      recommendations,
      generatedAt: new Date(),
    };
  }

  async analyzeSections(content: string): Promise<SectionReadability[]> {
    const sections: SectionReadability[] = [];
    const lines = content.split('\n');

    let currentSection: { heading: string; level: number; content: string; startLine: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          sections.push(this.analyzeSection(currentSection, i - 1));
        }

        // Start new section
        currentSection = {
          heading: headingMatch[2],
          level: headingMatch[1].length,
          content: '',
          startLine: i + 1,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    // Add last section
    if (currentSection) {
      sections.push(this.analyzeSection(currentSection, lines.length));
    }

    return sections;
  }

  private analyzeSection(
    section: { heading: string; level: number; content: string; startLine: number },
    endLine: number
  ): SectionReadability {
    const cleanContent = this.stripMarkdown(section.content);
    const metrics = this.calculateMetrics(cleanContent);
    const wordCount = this.countWords(cleanContent);

    return {
      heading: section.heading,
      level: section.level,
      wordCount,
      metrics,
      complexity: this.determineComplexity(metrics),
      recommendations: this.generateSectionRecommendations(metrics),
      startLine: section.startLine,
      endLine,
    };
  }

  // ============================================
  // READABILITY FORMULAS
  // ============================================

  calculateMetrics(text: string): ReadabilityMetrics {
    const words = this.getWords(text);
    const sentences = this.getSentences(text);
    const syllables = this.countTotalSyllables(words);
    const complexWords = this.countComplexWords(words);
    const paragraphs = this.getParagraphs(text);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = syllables;

    // Component metrics
    const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgSentencesPerParagraph = paragraphs.length > 0 ? sentenceCount / paragraphs.length : 0;
    const complexWordPercentage = wordCount > 0 ? (complexWords / wordCount) * 100 : 0;

    // Flesch Reading Ease (0-100, higher = easier)
    const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    // Gunning Fog Index
    const gunningFogIndex = 0.4 * (avgWordsPerSentence + complexWordPercentage);

    // SMOG Index
    const smogIndex = sentenceCount > 0
      ? 1.0430 * Math.sqrt(complexWords * (30 / sentenceCount)) + 3.1291
      : 0;

    // Coleman-Liau Index
    const avgLettersPerWord = this.avgLettersPer100Words(text, wordCount);
    const avgSentencesPer100Words = sentenceCount > 0 ? (sentenceCount / wordCount) * 100 : 0;
    const colemanLiauIndex = 0.0588 * avgLettersPerWord - 0.296 * avgSentencesPer100Words - 15.8;

    // Automated Readability Index (ARI)
    const characters = text.replace(/\s/g, '').length;
    const automatedReadabilityIndex = wordCount > 0 && sentenceCount > 0
      ? 4.71 * (characters / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43
      : 0;

    // Passive voice detection (simple heuristic)
    const passiveVoicePercentage = this.detectPassiveVoice(text, sentenceCount);

    // Average grade level
    const gradeLevel = (
      fleschKincaidGrade +
      gunningFogIndex +
      smogIndex +
      colemanLiauIndex +
      automatedReadabilityIndex
    ) / 5;

    // Interpretation
    const interpretation = this.interpretFleschScore(fleschReadingEase);
    const targetAudience = this.determineTargetAudience(gradeLevel);
    const complexity = this.determineComplexity({ fleschReadingEase, gradeLevel } as ReadabilityMetrics);

    return {
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
      gunningFogIndex: Math.max(0, gunningFogIndex),
      smogIndex: Math.max(0, smogIndex),
      colemanLiauIndex: Math.max(0, colemanLiauIndex),
      automatedReadabilityIndex: Math.max(0, automatedReadabilityIndex),
      averageSyllablesPerWord: avgSyllablesPerWord,
      averageWordsPerSentence: avgWordsPerSentence,
      averageSentencesPerParagraph: avgSentencesPerParagraph,
      complexWords: complexWordPercentage,
      passiveVoicePercentage,
      interpretation,
      targetAudience,
      gradeLevel,
      complexity,
    };
  }

  // ============================================
  // TEXT PROCESSING
  // ============================================

  private stripMarkdown(text: string): string {
    let clean = text;

    // Remove YAML frontmatter
    clean = clean.replace(/^---[\s\S]*?---\n/m, '');

    // Remove LaTeX commands but keep content
    clean = clean.replace(/\\textbf\{([^}]+)\}/g, '$1');
    clean = clean.replace(/\\emph\{([^}]+)\}/g, '$1');
    clean = clean.replace(/\\cite\{[^}]+\}/g, '');
    clean = clean.replace(/\\ref\{[^}]+\}/g, '');
    clean = clean.replace(/\\label\{[^}]+\}/g, '');

    // Remove LaTeX math
    clean = clean.replace(/\$\$[\s\S]*?\$\$/g, '');
    clean = clean.replace(/\$[^$]+\$/g, '');

    // Remove citations
    clean = clean.replace(/\[@[^\]]+\]/g, '');
    clean = clean.replace(/@\w+/g, '');

    // Remove Markdown formatting
    clean = clean.replace(/[*_`~]/g, '');
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Images
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
    clean = clean.replace(/^#+\s+/gm, ''); // Headers

    // Remove code blocks
    clean = clean.replace(/```[\s\S]*?```/g, '');
    clean = clean.replace(/`[^`]+`/g, '');

    // Remove HTML
    clean = clean.replace(/<[^>]+>/g, '');

    return clean.trim();
  }

  private getWords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0 && /[a-z]/.test(word));
  }

  private getSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  private countWords(text: string): number {
    return this.getWords(text).length;
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Count vowel groups
    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 0;

    // Adjust for silent e
    if (word.endsWith('e')) count--;

    // Minimum 1 syllable
    return Math.max(1, count);
  }

  private countTotalSyllables(words: string[]): number {
    return words.reduce((sum, word) => sum + this.countSyllables(word), 0);
  }

  private countComplexWords(words: string[]): number {
    // Complex words = 3+ syllables
    return words.filter(word => this.countSyllables(word) >= 3).length;
  }

  private avgLettersPer100Words(text: string, wordCount: number): number {
    const letters = text.replace(/[^a-zA-Z]/g, '').length;
    return wordCount > 0 ? (letters / wordCount) * 100 : 0;
  }

  private detectPassiveVoice(text: string, sentenceCount: number): number {
    // Simple passive voice detection
    const passiveIndicators = [
      /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
      /\b(is|are|was|were|be|been|being)\s+\w+en\b/gi,
    ];

    let passiveCount = 0;
    for (const pattern of passiveIndicators) {
      const matches = text.match(pattern);
      if (matches) passiveCount += matches.length;
    }

    return sentenceCount > 0 ? (passiveCount / sentenceCount) * 100 : 0;
  }

  // ============================================
  // INTERPRETATION
  // ============================================

  private interpretFleschScore(score: number): string {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (College graduate)';
  }

  private determineTargetAudience(gradeLevel: number): string {
    if (gradeLevel <= 8) return 'General public';
    if (gradeLevel <= 12) return 'High school';
    if (gradeLevel <= 16) return 'Undergraduate/Graduate';
    return 'Expert/Academic';
  }

  private determineComplexity(metrics: ReadabilityMetrics): ComplexityLevel {
    if (metrics.gradeLevel <= 8) return 'low';
    if (metrics.gradeLevel <= 12) return 'medium';
    if (metrics.gradeLevel <= 16) return 'high';
    return 'very-high';
  }

  private determineStatus(
    metrics: ReadabilityMetrics,
    target: AudienceProfile
  ): 'below-target' | 'on-target' | 'above-target' {
    const diff = metrics.gradeLevel - target.targetGradeLevel;

    if (diff < -2) return 'below-target';
    if (diff > 2) return 'above-target';
    return 'on-target';
  }

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  private generateRecommendations(
    metrics: ReadabilityMetrics,
    target: AudienceProfile
  ): string[] {
    const recommendations: string[] = [];

    // Sentence length
    if (metrics.averageWordsPerSentence > 25) {
      recommendations.push(
        `Average sentence length is ${metrics.averageWordsPerSentence.toFixed(1)} words (long). Consider breaking into shorter sentences.`
      );
    }

    // Complex words
    if (metrics.complexWords > 20) {
      recommendations.push(
        `Complex words: ${metrics.complexWords.toFixed(1)}% (high). Consider simplifying technical terms for broader audience.`
      );
    }

    // Passive voice
    if (metrics.passiveVoicePercentage > 15) {
      recommendations.push(
        `Passive voice: ${metrics.passiveVoicePercentage.toFixed(1)}% (consider reducing to improve clarity)`
      );
    }

    // Grade level vs target
    const diff = metrics.gradeLevel - target.targetGradeLevel;
    if (diff > 2) {
      recommendations.push(
        `Text is ${diff.toFixed(1)} grade levels above target. Simplify language for better audience match.`
      );
    } else if (diff < -2) {
      recommendations.push(
        `Text is ${Math.abs(diff).toFixed(1)} grade levels below target. Consider adding more technical depth.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✓ Readability is appropriate for target audience');
    }

    return recommendations;
  }

  private generateSectionRecommendations(metrics: ReadabilityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.averageWordsPerSentence > 30) {
      recommendations.push('Break up long sentences');
    }

    if (metrics.complexWords > 25) {
      recommendations.push('Simplify technical language');
    }

    if (metrics.passiveVoicePercentage > 20) {
      recommendations.push('Reduce passive voice');
    }

    return recommendations;
  }

  // ============================================
  // UTILITIES
  // ============================================

  private getTargetAudience(): AudienceProfile {
    const type = this.plugin.settings.quality?.readability?.targetAudience || 'graduate';
    return this.AUDIENCES[type];
  }

  getAudienceProfiles(): AudienceProfile[] {
    return Object.values(this.AUDIENCES);
  }

  async exportReport(report: ReadabilityReport, format: 'markdown' | 'html' = 'markdown'): Promise<string> {
    if (format === 'html') {
      return this.exportHTML(report);
    } else {
      return this.exportMarkdown(report);
    }
  }

  private exportMarkdown(report: ReadabilityReport): string {
    let md = '# Readability Analysis Report\n\n';
    md += `Generated: ${report.generatedAt.toLocaleString()}\n\n`;

    md += '## Overall Metrics\n\n';
    md += `- **Flesch Reading Ease**: ${report.overall.fleschReadingEase.toFixed(1)} / 100\n`;
    md += `  - ${report.overall.interpretation}\n`;
    md += `- **Grade Level**: ${report.overall.gradeLevel.toFixed(1)}\n`;
    md += `- **Flesch-Kincaid**: ${report.overall.fleschKincaidGrade.toFixed(1)}\n`;
    md += `- **Gunning Fog**: ${report.overall.gunningFogIndex.toFixed(1)}\n`;
    md += `- **SMOG Index**: ${report.overall.smogIndex.toFixed(1)}\n`;
    md += `- **Coleman-Liau**: ${report.overall.colemanLiauIndex.toFixed(1)}\n`;
    md += `- **ARI**: ${report.overall.automatedReadabilityIndex.toFixed(1)}\n\n`;

    md += '## Target Audience\n\n';
    md += `**${report.targetAudience.description}**\n\n`;
    md += `- Target Grade Level: ${report.targetAudience.targetGradeLevel}\n`;
    md += `- Your Text: ${report.overall.gradeLevel.toFixed(1)}\n`;
    md += `- Status: ${report.comparisonToTarget.status}\n\n`;

    md += '## Recommendations\n\n';
    for (const rec of report.recommendations) {
      md += `- ${rec}\n`;
    }
    md += '\n';

    if (report.sections.length > 0) {
      md += '## Section Analysis\n\n';
      for (const section of report.sections) {
        md += `### ${section.heading}\n`;
        md += `- Words: ${section.wordCount}\n`;
        md += `- Grade Level: ${section.metrics.gradeLevel.toFixed(1)}\n`;
        md += `- Complexity: ${section.complexity}\n`;
        if (section.recommendations.length > 0) {
          md += `- Recommendations: ${section.recommendations.join(', ')}\n`;
        }
        md += '\n';
      }
    }

    return md;
  }

  private exportHTML(report: ReadabilityReport): string {
    // HTML export implementation
    return `<html><body><h1>Readability Report</h1><p>Generated: ${report.generatedAt.toLocaleString()}</p></body></html>`;
  }
}
