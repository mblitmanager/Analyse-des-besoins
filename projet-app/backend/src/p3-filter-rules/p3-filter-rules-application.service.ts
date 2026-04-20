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
    // If session hasn't completed a formation yet, no P3 filtering
    if (!session.formationChoisie) {
      return formations;
    }

    // Get all active rules, ordered by priority (order ASC)
    const rules = await this.p3Service.findActive();

    if (!rules || rules.length === 0) {
      return formations;
    }

    let filtered = formations;

    // Apply each rule in priority order
    for (const rule of rules) {
      // Check if this rule applies to the current session
      if (!this.ruleMatches(rule, session)) {
        continue;
      }

      // Apply the rule's filter
      filtered = this.applyRule(filtered, rule);
    }

    return filtered;
  }

  /**
   * Checks if a P3 filter rule matches the current session's context
   * 
   * A rule matches if:
   * 1. Source condition is met:
   *    - sourceCategory matches formation's category (case-insensitive), OR
   *    - sourceSlugs includes the formation slug (case-insensitive)
   * 2. Level condition is met (if specified):
   *    - lastValidatedLevel is at or below maxLevelOrder
   */
  private ruleMatches(rule: any, session: Session): boolean {
    // Get source formation (what the candidate just completed)
    const sourceFormationSlug = session.formationChoisie?.toLowerCase() || '';

    // Check source condition
    const sourceMatches = this.sourceMatches(
      rule,
      sourceFormationSlug,
      session.lastValidatedLevel,
    );

    if (!sourceMatches) {
      return false;
    }

    // Check level condition (if specified)
    if (rule.maxLevelOrder !== null && rule.maxLevelOrder !== undefined) {
      const levelNumber = this.extractLevelNumber(session.lastValidatedLevel);
      if (levelNumber === null) {
        // If we can't parse the level, don't apply this rule
        return false;
      }
      if (levelNumber > rule.maxLevelOrder) {
        // Candidate's level is higher than rule threshold
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the source part of the rule matches the session
   * Matches if sourceCategory OR sourceSlugs match the previous formation
   */
  private sourceMatches(
    rule: any,
    sourceFormationSlug: string,
    lastValidatedLevel: string,
  ): boolean {
    const sourceCategory = rule.sourceCategory?.toLowerCase();
    const sourceSlugs = (rule.sourceSlugs || []).map((s: string) =>
      s.toLowerCase(),
    );

    // Try to extract category from formation slug (e.g., "word-basique" → "word")
    // This is a simple heuristic; in production, you'd query the Formation entity
    const sourceFormationCategory = sourceFormationSlug?.split('-')[0];

    // Rule matches if sourceCategory OR sourceSlugs match
    const categoryMatches =
      sourceCategory &&
      (sourceCategory === sourceFormationCategory ||
        sourceCategory === sourceFormationSlug);
    const slugMatches = sourceSlugs.length > 0 && sourceSlugs.includes(sourceFormationSlug);

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
