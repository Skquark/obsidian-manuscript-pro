# Freemium Implementation Plan

## Product Naming Strategy

### Option A: "ManuScript" (Recommended)
- **Free Version**: ManuScript
- **Paid Version**: ManuScript Pro
- **Plugin ID**: `manuscript` (keep existing `manuscript-pro` for backward compatibility)
- **Display Name**: "ManuScript" with Pro badge when activated

### Option B: "Manu-script"
- **Free Version**: Manu-script
- **Paid Version**: Manu-script Pro
- More distinctive hyphenation, but potentially harder to remember

**Recommendation**: Go with "ManuScript" (camelCase) - cleaner, more professional, easier to search/remember.

## Feature Tier Breakdown

### 🆓 Free "ManuScript" Features

**Core Editing & Formatting:**
- ✅ LaTeX syntax concealment (core value prop)
- ✅ Markdown + LaTeX mixed editing
- ✅ Live preview formatting
- ✅ Custom concealment rules (basic set)

**Citations & References:**
- ✅ BibTeX import and parsing
- ✅ Basic citation formatting (3 styles: APA, MLA, Chicago)
- ✅ Citation insertion commands
- ✅ Cross-reference support (basic)

**Templates:**
- ✅ 3 basic templates (Article, Book Chapter, Essay)
- ✅ Template variable support
- ✅ Custom template creation (limited)

**Statistics:**
- ✅ Word count (total, selection)
- ✅ Character count
- ✅ Basic structure stats (chapters, sections)
- ✅ Reading time estimate

**Export:**
- ✅ Basic Pandoc export (PDF, DOCX, HTML)
- ✅ Basic LaTeX export

**Manuscript Management:**
- ✅ Basic manuscript metadata
- ✅ Edition tracking (view only)

### 💎 Pro "ManuScript Pro" Features

**Advanced UI Panels:**
- 🔒 Pre-Publication Checklist Panel (full interactive checklist)
- 🔒 Progress Statistics Panel (goals, streaks, sessions tracking)
- 🔒 Research Bible Panel (future enhancement)

**Research Bible:**
- 🔒 Research Fact Modal (structured fact entry)
- 🔒 Research Search Modal (advanced search & filtering)
- 🔒 Terminology management (bulk operations)
- 🔒 Entity relationship tracking
- Free version: Console-only access, no UI

**Advanced Citation Features:**
- 🔒 Citation validation (3 methods: bibliography check, unused entries, orphaned citations)
- 🔒 Publisher address in citations
- 🔒 Custom citation styles (unlimited)
- 🔒 Bibliography auto-formatting
- 🔒 Duplicate citation detection

**Advanced Statistics:**
- 🔒 Inline equation counting in totals
- 🔒 Progress tracking with goals
- 🔒 Writing session history
- 🔒 Streak tracking
- 🔒 Export statistics to CSV
- 🔒 Detailed readability metrics

**Templates:**
- 🔒 15+ publisher-specific templates
- 🔒 Custom template variables (advanced)
- 🔒 Template marketplace access (future)

**Export:**
- 🔒 Publisher-ready export presets (20+ formats)
- 🔒 Custom export pipelines
- 🔒 Batch export
- 🔒 Auto-formatting for specific publishers

**Manuscript Editor:**
- 🔒 Full manuscript editor modal with validation
- 🔒 Unsaved changes confirmation
- 🔒 Edition comparison
- Free version: Settings panel only

**Quality Assurance:**
- 🔒 Full publication checklist automation
- 🔒 Manuscript validation reports
- 🔒 Style consistency checking

**Support:**
- 🔒 Priority email support
- 🔒 Feature request priority
- 🔒 Early access to new features

## Technical Architecture

### 1. License Validation System

**Components:**
```
src/licensing/
├── LicenseManager.ts       // Core license logic
├── LicenseValidator.ts     // API validation with Aeionix
├── LicenseStorage.ts       // Secure local storage
├── FeatureGate.ts          // Feature flag system
└── types.ts                // License interfaces
```

**License Data Structure:**
```typescript
interface License {
  key: string;              // License key from Aeionix
  email: string;            // User email
  tier: 'free' | 'pro';     // License tier
  activatedAt: number;      // Timestamp
  expiresAt: number | null; // null for lifetime
  status: 'active' | 'expired' | 'invalid';
  instanceId: string;       // Unique to this Obsidian vault
  validated: boolean;       // Online validation status
  lastChecked: number;      // Last online check timestamp
}
```

**Validation Strategy:**
```typescript
// 1. Initial Activation (requires online)
// User enters license key → Validate with Aeionix → Store locally

// 2. Startup Check (grace period)
// Check local license → If >30 days since last validation, require online check
// If online check fails, show grace period warning (7 days)

// 3. Offline Grace Period
// Allow 7 days of offline use after last successful validation
// After grace period, revert to Free tier features
```

### 2. Feature Gating System

**Implementation:**
```typescript
export class FeatureGate {
  private licenseManager: LicenseManager;
  
  constructor(plugin: ManuscriptProPlugin) {
    this.licenseManager = plugin.licenseManager;
  }
  
  // Simple boolean check
  isProFeature(feature: ProFeature): boolean {
    return this.licenseManager.hasProLicense() && 
           this.licenseManager.isLicenseValid();
  }
  
  // Check with upgrade prompt
  checkFeatureAccess(feature: ProFeature, context: string): boolean {
    if (this.isProFeature(feature)) {
      return true;
    }
    
    // Show upgrade modal
    new UpgradeModal(this.plugin.app, feature, context).open();
    return false;
  }
  
  // Wrapper for command registration
  registerProCommand(command: Command, feature: ProFeature): void {
    const originalCallback = command.callback;
    command.callback = () => {
      if (this.checkFeatureAccess(feature, 'command')) {
        originalCallback();
      }
    };
    this.plugin.addCommand(command);
  }
}
```

**Pro Feature Enum:**
```typescript
enum ProFeature {
  // Panels
  CHECKLIST_PANEL = 'checklist_panel',
  PROGRESS_PANEL = 'progress_panel',
  
  // Research Bible
  RESEARCH_FACT_MODAL = 'research_fact_modal',
  RESEARCH_SEARCH_MODAL = 'research_search_modal',
  
  // Citations
  CITATION_VALIDATION = 'citation_validation',
  CUSTOM_CITATION_STYLES = 'custom_citation_styles',
  
  // Statistics
  ADVANCED_STATS = 'advanced_stats',
  PROGRESS_TRACKING = 'progress_tracking',
  
  // Manuscript
  MANUSCRIPT_EDITOR = 'manuscript_editor',
  
  // Export
  ADVANCED_EXPORT = 'advanced_export',
  PUBLISHER_PRESETS = 'publisher_presets',
}
```

### 3. Gating Implementation Points

**In main.ts:**
```typescript
async onload() {
  // Initialize license manager FIRST
  this.licenseManager = new LicenseManager(this);
  await this.licenseManager.load();
  
  this.featureGate = new FeatureGate(this);
  
  // Register commands with gating
  this.featureGate.registerProCommand({
    id: 'show-publication-checklist',
    name: 'Show Pre-Publication Checklist (Pro)',
    callback: async () => {
      await this.activateChecklistPanel();
    },
  }, ProFeature.CHECKLIST_PANEL);
  
  // Always show license status command
  this.addCommand({
    id: 'show-license-status',
    name: 'License & Activation',
    callback: () => {
      new LicenseModal(this.app, this).open();
    },
  });
}
```

**In view registration:**
```typescript
// Register views but gate activation
this.registerView(
  CHECKLIST_PANEL_VIEW_TYPE,
  (leaf) => new ChecklistPanelView(leaf, this)
);

async activateChecklistPanel() {
  // Gate before activation
  if (!this.featureGate.checkFeatureAccess(
    ProFeature.CHECKLIST_PANEL,
    'Checklist Panel'
  )) {
    return; // UpgradeModal shown by checkFeatureAccess
  }
  
  // Normal activation logic...
}
```

**In modals:**
```typescript
export class ResearchFactModal extends Modal {
  constructor(app: App, private plugin: ManuscriptProPlugin) {
    super(app);
  }
  
  async onOpen() {
    // Check license at modal open
    if (!this.plugin.featureGate.checkFeatureAccess(
      ProFeature.RESEARCH_FACT_MODAL,
      'Research Fact Entry'
    )) {
      this.close();
      return;
    }
    
    // Normal modal rendering...
  }
}
```

### 4. Piracy Protection Strategy

**Level 1: Reasonable Protection (Recommended)**
```typescript
// Store license data in plugin settings (obfuscated)
interface PluginSettings {
  // ... other settings
  _lic: string; // Base64-encoded + simple XOR cipher
}

// Generate instance ID from vault path + install timestamp
// Prevents same key on multiple vaults without server check
function generateInstanceId(vaultPath: string): string {
  const data = `${vaultPath}-${Date.now()}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// Online validation every 30 days
// Aeionix tracks: license key → allowed instances (e.g., 2 devices)
```

**Level 2: Honor System**
- Don't over-engineer DRM
- Trust paying customers
- Make it easy to be honest, hard to share accidentally
- Focus on providing value, not preventing piracy

**Anti-Piracy Measures NOT Recommended:**
- ❌ Code obfuscation (breaks debugging, alienates developers)
- ❌ Aggressive DRM (frustrates legitimate users)
- ❌ Phone-home on every action (privacy concerns)
- ❌ Disabling features suddenly (bad UX)

**Recommended Balance:**
1. **Instance limiting**: 2-3 devices per license (validated via Aeionix)
2. **Grace periods**: 7 days offline use before requiring validation
3. **Soft degradation**: Show warnings before disabling features
4. **Easy license transfer**: Allow users to deactivate old devices
5. **Clear messaging**: "Your license supports 2 devices. Activate on new device?"

### 5. Upgrade Modal UI

**UpgradeModal.ts:**
```typescript
export class UpgradeModal extends Modal {
  constructor(
    app: App,
    private feature: ProFeature,
    private context: string
  ) {
    super(app);
  }
  
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('manuscript-upgrade-modal');
    
    // Header
    contentEl.createEl('h2', { text: '🔒 Pro Feature' });
    
    // Feature description
    const desc = this.getFeatureDescription(this.feature);
    contentEl.createEl('p', { 
      text: desc,
      cls: 'manuscript-upgrade-description' 
    });
    
    // Benefits list
    const benefits = contentEl.createEl('ul', { 
      cls: 'manuscript-upgrade-benefits' 
    });
    this.getFeatureBenefits(this.feature).forEach(benefit => {
      benefits.createEl('li', { text: benefit });
    });
    
    // Pricing
    const pricing = contentEl.createDiv({ cls: 'manuscript-upgrade-pricing' });
    pricing.createEl('div', { 
      text: 'ManuScript Pro',
      cls: 'manuscript-upgrade-title' 
    });
    pricing.createEl('div', { 
      text: '$39',
      cls: 'manuscript-upgrade-price' 
    });
    pricing.createEl('div', { 
      text: 'One-time payment • Lifetime access',
      cls: 'manuscript-upgrade-subtitle' 
    });
    
    // Buttons
    const buttonContainer = contentEl.createDiv({ 
      cls: 'manuscript-upgrade-buttons' 
    });
    
    const upgradeBtn = buttonContainer.createEl('button', { 
      text: 'Upgrade to Pro',
      cls: 'mod-cta' 
    });
    upgradeBtn.onclick = () => {
      window.open('https://your-site.com/manuscript-pro?feature=' + this.feature);
      this.close();
    };
    
    const activateBtn = buttonContainer.createEl('button', { 
      text: 'I already have a license' 
    });
    activateBtn.onclick = () => {
      this.close();
      new LicenseModal(this.app, this.plugin).open();
    };
    
    const cancelBtn = buttonContainer.createEl('button', { 
      text: 'Maybe later' 
    });
    cancelBtn.onclick = () => this.close();
  }
  
  private getFeatureDescription(feature: ProFeature): string {
    const descriptions = {
      [ProFeature.CHECKLIST_PANEL]: 
        'The Pre-Publication Checklist helps you ensure your manuscript is ready for submission with automated validation and progress tracking.',
      [ProFeature.PROGRESS_PANEL]: 
        'Track your writing progress with goals, streaks, and detailed statistics across multiple time ranges.',
      [ProFeature.RESEARCH_FACT_MODAL]: 
        'Organize research facts, terminology, and entities in a structured database with powerful search capabilities.',
      // ... more descriptions
    };
    return descriptions[feature] || 'This is a Pro feature.';
  }
  
  private getFeatureBenefits(feature: ProFeature): string[] {
    // Feature-specific benefits
    const allBenefits = {
      [ProFeature.CHECKLIST_PANEL]: [
        '✓ Interactive checklist with 6 categories',
        '✓ Automatic citation validation',
        '✓ Progress tracking and notes',
        '✓ Export checklist reports',
      ],
      // ... more benefits per feature
    };
    
    return [
      ...(allBenefits[feature] || []),
      '✓ All future Pro updates included',
      '✓ Priority support',
    ];
  }
}
```

### 6. License Activation UI

**LicenseModal.ts:**
```typescript
export class LicenseModal extends Modal {
  private plugin: ManuscriptProPlugin;
  private licenseInput: HTMLInputElement;
  private emailInput: HTMLInputElement;
  
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    const license = await this.plugin.licenseManager.getLicense();
    
    if (license?.tier === 'pro' && license.status === 'active') {
      this.renderActivatedState(contentEl, license);
    } else {
      this.renderActivationForm(contentEl);
    }
  }
  
  private renderActivatedState(el: HTMLElement, license: License) {
    el.createEl('h2', { text: '✅ ManuScript Pro Activated' });
    
    const info = el.createDiv({ cls: 'manuscript-license-info' });
    info.createEl('div', { text: `Email: ${license.email}` });
    info.createEl('div', { 
      text: `Activated: ${new Date(license.activatedAt).toLocaleDateString()}` 
    });
    info.createEl('div', { 
      text: `Status: ${license.status}`,
      cls: `manuscript-status-${license.status}` 
    });
    
    if (license.lastChecked) {
      const daysSince = Math.floor(
        (Date.now() - license.lastChecked) / (1000 * 60 * 60 * 24)
      );
      info.createEl('div', { 
        text: `Last validated: ${daysSince} days ago` 
      });
    }
    
    const actions = el.createDiv({ cls: 'manuscript-license-actions' });
    
    const validateBtn = actions.createEl('button', { 
      text: 'Validate Now' 
    });
    validateBtn.onclick = async () => {
      await this.plugin.licenseManager.validateOnline();
      this.onOpen(); // Refresh
    };
    
    const deactivateBtn = actions.createEl('button', { 
      text: 'Deactivate License',
      cls: 'mod-warning' 
    });
    deactivateBtn.onclick = async () => {
      if (confirm('Are you sure you want to deactivate this license?')) {
        await this.plugin.licenseManager.deactivate();
        this.onOpen(); // Refresh to show activation form
      }
    };
  }
  
  private renderActivationForm(el: HTMLElement) {
    el.createEl('h2', { text: 'Activate ManuScript Pro' });
    
    el.createEl('p', { 
      text: 'Enter your license key to unlock Pro features.' 
    });
    
    const form = el.createDiv({ cls: 'manuscript-activation-form' });
    
    new Setting(form)
      .setName('Email')
      .setDesc('The email used for your purchase')
      .addText(text => {
        this.emailInput = text.inputEl;
        text.setPlaceholder('your@email.com');
      });
    
    new Setting(form)
      .setName('License Key')
      .setDesc('Your ManuScript Pro license key')
      .addText(text => {
        this.licenseInput = text.inputEl;
        text.setPlaceholder('XXXX-XXXX-XXXX-XXXX');
      });
    
    const buttons = el.createDiv({ cls: 'manuscript-activation-buttons' });
    
    const activateBtn = buttons.createEl('button', { 
      text: 'Activate',
      cls: 'mod-cta' 
    });
    activateBtn.onclick = async () => {
      await this.activateLicense();
    };
    
    const buyBtn = buttons.createEl('button', { 
      text: 'Purchase License' 
    });
    buyBtn.onclick = () => {
      window.open('https://your-site.com/manuscript-pro');
    };
  }
  
  private async activateLicense() {
    const email = this.emailInput.value.trim();
    const key = this.licenseInput.value.trim();
    
    if (!email || !key) {
      new Notice('⚠ Please enter both email and license key');
      return;
    }
    
    new Notice('Validating license...');
    
    const result = await this.plugin.licenseManager.activate(email, key);
    
    if (result.success) {
      new Notice('✅ License activated successfully!');
      this.close();
      
      // Refresh workspace to show new Pro features
      this.app.workspace.trigger('manuscript-pro:license-activated');
    } else {
      new Notice(`❌ Activation failed: ${result.error}`);
    }
  }
}
```

## Implementation Phases

### Phase 1: License Infrastructure (Week 1)
- [ ] Create `src/licensing/` directory structure
- [ ] Implement `LicenseManager.ts`
- [ ] Implement `LicenseValidator.ts` with Aeionix API
- [ ] Implement `LicenseStorage.ts` with encryption
- [ ] Create `FeatureGate.ts` system
- [ ] Add license types and interfaces

### Phase 2: UI Components (Week 1-2)
- [ ] Create `UpgradeModal.ts` with feature-specific messaging
- [ ] Create `LicenseModal.ts` for activation/management
- [ ] Create upgrade prompt styling in CSS
- [ ] Add Pro badges to command palette entries
- [ ] Create settings section for license management

### Phase 3: Feature Gating (Week 2)
- [ ] Gate checklist panel activation
- [ ] Gate progress panel activation
- [ ] Gate research modals
- [ ] Gate citation validation
- [ ] Gate manuscript editor modal
- [ ] Update command registrations with Pro badges
- [ ] Add upgrade prompts to gated features

### Phase 4: Testing & Polish (Week 3)
- [ ] Test activation flow
- [ ] Test offline grace period
- [ ] Test license validation
- [ ] Test feature gating (all Pro features)
- [ ] Test deactivation/reactivation
- [ ] Test multi-device scenarios
- [ ] Handle edge cases (expired, invalid, etc.)

### Phase 5: Documentation (Week 3)
- [ ] Update README with Free vs Pro comparison
- [ ] Create LICENSING.md with activation instructions
- [ ] Update CHANGELOG
- [ ] Create FAQ for common license questions
- [ ] Update manifest/package descriptions

### Phase 6: Website & Sales (Week 4)
- [ ] Create landing page on your site
- [ ] Set up Aeionix license generation
- [ ] Configure payment processing
- [ ] Create email templates (purchase confirmation, license delivery)
- [ ] Set up analytics tracking
- [ ] Create demo video/screenshots

## Aeionix Integration

### API Endpoints Needed

```typescript
interface AeionixAPI {
  // Validate license key
  validateLicense(key: string, email: string): Promise<{
    valid: boolean;
    tier: 'free' | 'pro';
    expiresAt: number | null;
    maxInstances: number;
    activeInstances: number;
  }>;
  
  // Activate instance
  activateInstance(
    key: string, 
    email: string, 
    instanceId: string,
    metadata: { vaultName: string; platform: string }
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // Deactivate instance
  deactivateInstance(
    key: string, 
    instanceId: string
  ): Promise<{
    success: boolean;
  }>;
  
  // Check instance status
  checkInstance(
    key: string, 
    instanceId: string
  ): Promise<{
    active: boolean;
    lastSeen: number;
  }>;
}
```

### License Generation Rules

**In Aeionix WordPress Backend:**
- Generate license on purchase (WooCommerce hook)
- Format: `MANU-XXXX-XXXX-XXXX` (16 chars)
- Store: email, key, tier, purchase_date, max_instances (2)
- Send email with license key + activation instructions
- Allow 2 active instances per license
- Track instance IDs and last validation timestamps

## Pricing & Purchase Flow

### Landing Page Structure

```
https://your-site.com/manuscript-pro

Hero Section:
- "ManuScript Pro - Professional Academic Writing for Obsidian"
- Key benefit statement
- $39 one-time • Lifetime access
- [Buy Now] CTA

Feature Comparison Table:
- Free vs Pro features side-by-side
- Clear visual distinction

Social Proof:
- Testimonials (gather after soft launch)
- "Join 500+ academic writers" (update with real numbers)

FAQ:
- What's included?
- How does licensing work?
- Can I use on multiple devices?
- What if I switch computers?
- Refund policy?

Footer:
- Purchase button
- Contact for questions
```

### Purchase Flow

1. **User clicks "Buy Now"**
2. **WooCommerce checkout** ($39)
3. **Payment processed** (Stripe/PayPal)
4. **Aeionix generates license** (via WooCommerce hook)
5. **Email sent** with license key + instructions
6. **User activates** in Obsidian plugin

## Edge Cases & Handling

### Scenario 1: Expired License (Future Subscriptions)
- Show warning 7 days before expiration
- Grace period: 7 days after expiration
- Degrade to Free tier after grace period
- Easy renewal flow

### Scenario 2: Invalid License
- Check for typos (suggest corrections)
- Verify email matches purchase
- Contact support link

### Scenario 3: Too Many Devices
- Show message: "License active on 2 devices. Deactivate one to proceed."
- List active devices (vault name, platform, last seen)
- Easy deactivation button

### Scenario 4: Offline for >30 Days
- Show warning at 25 days
- Grace period: 30-37 days (7 days after limit)
- After grace period: require online validation
- Don't disable features immediately, show dismissible warning

### Scenario 5: Refund Request
- 30-day money-back guarantee
- Deactivate license in Aeionix
- Send confirmation email
- Process refund

## Marketing Strategy

### Launch Sequence

**Week 1: Soft Launch (Free)**
- Release free version to Obsidian community plugins
- Announce on Reddit (r/ObsidianMD)
- Post in Obsidian Discord
- Share on Twitter/X
- Goal: 100-200 downloads, gather feedback

**Week 2-3: Build Anticipation**
- Tease Pro features coming soon
- Share screenshots/videos
- Early adopter discount signup
- Build email list

**Week 4: Pro Launch**
- Announce Pro version ($29 early adopter → $39 regular)
- Email early adopter list
- Post launch announcement
- Offer 20% discount for first 50 buyers
- Create demo video

**Month 2+: Content Marketing**
- Blog posts: "Academic Writing in Obsidian"
- YouTube tutorials
- Guest posts on academic blogs
- Showcase user workflows

### Messaging

**For Free Users:**
> "ManuScript transforms Obsidian into a powerful academic writing environment with LaTeX integration, citation management, and professional formatting."

**For Pro Conversion:**
> "Upgrade to ManuScript Pro to unlock advanced research tools, automated validation, progress tracking, and publisher-ready export templates. One-time payment • Lifetime access • $39"

## Success Metrics

### Launch Goals (Month 1)
- 500-1,000 free users
- 25-50 Pro conversions (5% conversion)
- $975-1,950 revenue

### Year 1 Goals
- 2,000-5,000 free users
- 100-250 Pro licenses
- $3,900-9,750 revenue

### Key Metrics to Track
- Downloads (free)
- Activation rate (users who actually use it)
- Conversion rate (free → pro)
- Refund rate (target <5%)
- Support tickets per user
- Feature usage (which Pro features most valuable?)

## Open Questions

1. **Should we offer academic discount?** (e.g., $29 for .edu emails)
2. **Subscription option?** ($4.99/month or $39/year alternative to $39 lifetime)
3. **Team licenses?** (e.g., $99 for 5 users - research groups)
4. **Affiliate program?** (10% commission for referrals)
5. **Early access tier?** ($49 for beta access to new features)

## Next Steps

1. Review this plan and decide on naming (ManuScript vs Manu-script)
2. Set up Aeionix license generation rules
3. Begin Phase 1 implementation (license infrastructure)
4. Create feature comparison table for documentation
5. Draft landing page copy

---

**Estimated Implementation Time**: 3-4 weeks
**Launch Target**: v0.4.0 (Freemium Release)
**Pricing**: $39 one-time (lifetime)
**Conversion Target**: 5-10% (conservative)
