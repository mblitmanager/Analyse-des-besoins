import { Injectable } from '@nestjs/common';
import { P3FilterRulesService } from './p3-filter-rules.service';
import { Formation } from '../entities/formation.entity';
import { Session } from '../entities/session.entity';

/**
 * P3FilterRulesApplicationService
 * 
 * Applies P3 filter rules to formation catalogs based on a session's previous training path.
 * This service handles the business logic of filtering formations according to:
 * - Previous formation completed (sourceFormation)
 * - Level achieved (lastValidatedLevel)
 * - P3 filter rules (in priority order)
 */
@Injectable()
export class P3FilterRulesApplicationService {
  constructor(private readonly p3Service: P3FilterRulesService) {}

  /**
   * Applies active P3 filter rules to a list of formations
   * 
   * @param formations - All available formations
   * @param session - Current session with previous training path info
   * @returns Filtered list of formations based on applicable P3 rules
   * 
   * Algorithm:
   * 1. Get active P3 rules ordered by priority
   * 2. For each rule, check if it matches the session's source:
   *    - sourceCategory matches OR sourceSlugs includes previous formation
   *    - AND (if maxLevelOrder set) level achieved <= maxLevelOrder
   * 3. Apply filter based on filterMode:
   *    - ALLOW_ONLY: Keep ONLY formations/categories specified in targets
   *    - EXCLUDE: Remove formations/categories specified in targets
   * 4. Continue to next rule (rules can chain)
   * 5. Return filtered list
   */
  async applyP3Rules(
    formations: Formation[],
    session: Session,
  ): Promise<Formation[]> {
    // Get all active rules, ordered by priority (order ASC)
    const rules = await this.p3Service.findActive();

    if (!rules || rules.length === 0) {
      return formations;
    }

    // Determine candidate's training history
    const sessionsToCheck: any[] = (session as any).previousSessions || [];

    // Fallback: if no historical completed sessions are loaded, but the current session
    // itself has a chosen formation (e.g. standard flow or P2 mid-evaluation), check the current session.
    if (sessionsToCheck.length === 0 && session.formationChoisie) {
      sessionsToCheck.push(session);
    }

    if (sessionsToCheck.length === 0) {
      return formations;
    }

    let filtered = formations;

    // Apply each rule in priority order
    for (const rule of rules) {
      // Check if this rule matches ANY of the completed sessions in the history
      let ruleApplies = false;
      for (const checkSession of sessionsToCheck) {
        // Pass formations catalog so we can resolve label→slug
        if (this.ruleMatches(rule, checkSession, formations)) {
          ruleApplies = true;
          break; // Match found, this rule is active for the current filter step
        }
      }

      if (!ruleApplies) {
        continue;
      }

      // Apply the rule's filter
      filtered = this.applyRule(filtered, rule);
    }

    return filtered;
  }

  /**
   * Checks if a P3 filter rule matches a given session context (current or historical)
   * 
   * @param formations - Catalog of all formations (used to resolve label→slug)
   */
  private ruleMatches(rule: any, checkSession: Session, formations: Formation[] = []): boolean {
    const formationChoisie = checkSession.formationChoisie?.trim() || '';
    if (!formationChoisie) {
      return false;
    }

    // Resolve the stored formation label/slug to the canonical slug from the catalog
    // Sessions store formationChoisie as the label (e.g. "Anglais") but rules use slugs (e.g. "toeic")
    const resolvedSlugs = this.resolveFormationSlugs(formationChoisie, formations);

    // Check source condition using both the stored value and resolved slugs
    const sourceMatches = this.sourceMatches(rule, formationChoisie, resolvedSlugs);

    if (!sourceMatches) {
      return false;
    }

    // Check level condition (if specified)
    if (rule.maxLevelOrder !== null && rule.maxLevelOrder !== undefined) {
      const levelNumber = this.getLevelNumber(checkSession);

      // Debug log to diagnose level comparison issues
      console.log(`[P3-DEBUG] Rule "${rule.name}" | session=${checkSession.id?.slice(0,8)} | formation="${formationChoisie}" | resolvedSlugs=${resolvedSlugs.join(',')} | stopLevelOrder=${checkSession.stopLevelOrder} | stopLevel="${checkSession.stopLevel}" | lastValidatedLevel="${checkSession.lastValidatedLevel}" | computedLevel=${levelNumber} | operator=${rule.levelOperator} | threshold=${rule.maxLevelOrder}`);

      if (levelNumber === null) {
        // If we can't parse the level, don't apply this rule (safe fallback = show the formation)
        console.log(`[P3-DEBUG] → level is null → rule does NOT apply (formation stays visible)`);
        return false;
      }
      const operator = rule.levelOperator || 'lte';
      if (operator === 'gte') {
        if (levelNumber < rule.maxLevelOrder) {
          // Candidate's level is lower than rule threshold → rule does NOT apply
          console.log(`[P3-DEBUG] → gte check: ${levelNumber} < ${rule.maxLevelOrder} → rule does NOT apply`);
          return false;
        }
        console.log(`[P3-DEBUG] → gte check: ${levelNumber} >= ${rule.maxLevelOrder} → rule APPLIES → formation will be hidden`);
      } else {
        if (levelNumber > rule.maxLevelOrder) {
          // Candidate's level is higher than rule threshold → rule does NOT apply
          console.log(`[P3-DEBUG] → lte check: ${levelNumber} > ${rule.maxLevelOrder} → rule does NOT apply`);
          return false;
        }
        console.log(`[P3-DEBUG] → lte check: ${levelNumber} <= ${rule.maxLevelOrder} → rule APPLIES → formation will be hidden`);
      }
    }

    return true;
  }

  /**
   * Resolves a formationChoisie (which may be a label like "Anglais" or a slug like "toeic")
   * to all possible slugs using the formations catalog.
   */
  private resolveFormationSlugs(formationChoisie: string, formations: Formation[]): string[] {
    const lower = formationChoisie.toLowerCase().trim();
    const slugs: string[] = [lower]; // Always include the raw value as fallback

    // Look up by label match
    for (const f of formations) {
      const labelLower = (f.label || '').toLowerCase().trim();
      const slugLower = (f.slug || '').toLowerCase().trim();
      if (labelLower === lower || slugLower === lower || 
          labelLower.includes(lower) || lower.includes(labelLower)) {
        if (slugLower && !slugs.includes(slugLower)) slugs.push(slugLower);
        if (labelLower && !slugs.includes(labelLower)) slugs.push(labelLower);
      }
    }

    return slugs;
  }

  private getLevelOrderFromLabel(label: string | null | undefined): number | null {
    if (!label) {
      return null;
    }
    const lvl = label.toLowerCase();
    if (lvl.includes('initial') || lvl.includes('a1')) return 1;
    if (lvl.includes('basique') || lvl.includes('a2')) return 2;
    if (lvl.includes('opérationnel') || lvl.includes('operationnel') || lvl.includes('b1')) return 3;
    if (lvl.includes('avancé') || lvl.includes('avance') || lvl.includes('b2')) return 4;
    if (lvl.includes('expert') || lvl.includes('c1')) return 5;
    return null;
  }

  private getLevelNumber(session: Session): number | null {
    if (session.stopLevelOrder !== null && session.stopLevelOrder !== undefined && session.stopLevelOrder > 0) {
      return session.stopLevelOrder;
    }

    const stopLevelOrderFromLabel = this.getLevelOrderFromLabel(session.stopLevel);
    if (stopLevelOrderFromLabel !== null) {
      return stopLevelOrderFromLabel;
    }

    const lastValLevelOrderFromLabel = this.getLevelOrderFromLabel(session.lastValidatedLevel);
    if (lastValLevelOrderFromLabel !== null) {
      return lastValLevelOrderFromLabel;
    }

    const stopLevelNum = this.extractLevelNumber(session.stopLevel);
    if (stopLevelNum !== null) {
      return stopLevelNum;
    }

    const lastValLevelNum = this.extractLevelNumber(session.lastValidatedLevel);
    if (lastValLevelNum !== null) {
      return lastValLevelNum;
    }

    return null;
  }

  /**
   * Checks if the source part of the rule matches the target formation
   * Uses both the raw stored value and resolved slugs from the catalog.
   */
  private sourceMatches(
    rule: any,
    formationChoisie: string,
    resolvedSlugs: string[],
  ): boolean {
    const sourceCategory = rule.sourceCategory?.toLowerCase();
    const ruleSlugs = (rule.sourceSlugs || []).map((s: string) =>
      s.toLowerCase().trim(),
    );

    const lower = formationChoisie.toLowerCase().trim();

    // Check against all resolved slugs (includes label + catalog slug)
    const slugMatches = ruleSlugs.length > 0 && resolvedSlugs.some(resolved =>
      ruleSlugs.some(rs => resolved === rs || resolved.includes(rs) || rs.includes(resolved))
    );

    // Category guessing based on keywords in the stored formation label/slug
    let guessedCategory = '';
    if (lower.includes('word') || lower.includes('excel') || lower.includes('powerpoint') || lower.includes('outlook') || lower.includes('bureautique')) {
      guessedCategory = 'bureautique';
    } else if (lower.includes('toeic') || lower.includes('voltaire') || lower.includes('langue') || lower.includes('anglais') || lower.includes('français') || lower.includes('francais')) {
      guessedCategory = 'langues';
    } else if (lower.includes('sketchup') || lower.includes('illustrator') || lower.includes('gimp') || lower.includes('photoshop') || lower.includes('canva') || lower.includes('design') || lower.includes('création') || lower.includes('creation')) {
      guessedCategory = 'création & design';
    } else if (lower.includes('digcomp') || lower.includes('wordpress') || lower.includes('digital')) {
      guessedCategory = 'digital & compétences';
    }

    const categoryMatches = sourceCategory && (
      lower.includes(sourceCategory) || 
      sourceCategory.includes(lower) ||
      guessedCategory === sourceCategory
    );

    return categoryMatches || slugMatches;
  }

  /**
   * Applies a single rule to filter formations
   * 
   * Two modes:
   * - EXCLUDE: Remove matching formations/categories from the list
   * - ALLOW_ONLY: Keep ONLY matching formations/categories
   */
  private applyRule(formations: Formation[], rule: any): Formation[] {
    const targetSlugs = (rule.targetSlugs || []).map((s: string) =>
      s.toLowerCase(),
    );
    const targetCategories = (rule.targetCategories || []).map((c: string) =>
      c.toLowerCase(),
    );

    if (rule.filterMode === 'ALLOW_ONLY') {
      // Keep ONLY formations that match targets
      return formations.filter((f) => {
        const slugMatches = targetSlugs.includes(f.slug?.toLowerCase());
        const categoryMatches = targetCategories.includes(
          f.category?.toLowerCase(),
        );
        return slugMatches || categoryMatches;
      });
    } else if (rule.filterMode === 'EXCLUDE') {
      // Remove formations that match targets
      return formations.filter((f) => {
        const slugMatches = targetSlugs.includes(f.slug?.toLowerCase());
        const categoryMatches = targetCategories.includes(
          f.category?.toLowerCase(),
        );
        return !slugMatches && !categoryMatches;
      });
    }

    // Unknown filter mode, don't filter
    return formations;
  }

  /**
   * Extracts numeric level from level string
   * Examples: "1" → 1, "2" → 2, "A1" → 1, "Intermédiaire" → null
   * Returns null if level cannot be parsed as a number
   */
  private extractLevelNumber(levelStr: string | null | undefined): number | null {
    if (!levelStr) {
      return null;
    }

    // Try direct number parse
    const num = Number(levelStr);
    if (Number.isFinite(num) && num >= 0) {
      return num;
    }

    // Try extract number from string (e.g., "Level 2" → 2, "A2" → 2)
    const match = levelStr.match(/\d+/);
    if (match) {
      return Number(match[0]);
    }

    return null;
  }
}
