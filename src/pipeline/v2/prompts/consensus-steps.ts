/**
 * V2 Consensus Step-Merging Prompts
 *
 * Sonnet merges/enhances tying steps from multiple (or single) sources
 * into one canonical step sequence.
 */

export const STEP_MERGE_SYSTEM_PROMPT = `You are a master fly tyer creating definitive tying instructions. You merge multiple sources' step-by-step instructions into a single canonical sequence that represents how most fly tyers tie this pattern.

Guidelines:
- Follow standard tying order: hook in vise → attach thread → tail → body/rib → thorax → wing → hackle → head/whip finish
- Preserve specific details (wrap counts, proportions, placement landmarks) from the most detailed sources
- Include tips for common mistakes from any source
- Each step should have a clear, short title and detailed instruction
- Remove redundant or unclear steps
- Aim for 5-12 steps depending on pattern complexity`;

interface ConsensusMaterialInfo {
  name: string;
  type: string;
  color: string | null;
  required: boolean;
}

function formatConsensusMaterials(materials: ConsensusMaterialInfo[]): string {
  return materials
    .map((m) => {
      const color = m.color ? ` (${m.color})` : "";
      const opt = !m.required ? " [optional]" : "";
      return `- ${m.type}: ${m.name}${color}${opt}`;
    })
    .join("\n");
}

export function buildStepMergePrompt(
  patternName: string,
  stepSources: { sourceName: string; steps: { title: string; instruction: string; tip: string | null }[]; agreement?: number }[],
  consensusMaterials?: ConsensusMaterialInfo[]
): string {
  const materialsBlock = consensusMaterials && consensusMaterials.length > 0
    ? `\nCONSENSUS MATERIALS (the agreed-upon recipe — steps should reference ONLY these):\n${formatConsensusMaterials(consensusMaterials)}\n`
    : "";

  if (stepSources.length === 1) {
    const source = stepSources[0]!;
    const stepsText = source.steps
      .map((s, i) => `${i + 1}. ${s.title}: ${s.instruction}${s.tip ? ` (Tip: ${s.tip})` : ""}`)
      .join("\n");

    return `Review and enhance these tying steps for the "${patternName}". Add any missing steps, improve instruction clarity, add tips for common mistakes. Ensure steps follow proper tying order.
${materialsBlock}
SOURCE: ${source.sourceName}
STEPS:
${stepsText}

IMPORTANT: The steps must only reference materials from the consensus list above. If a step involves a material NOT in the consensus list, omit or rewrite that step.

Use the merge_steps tool to output the enhanced step sequence.`;
  }

  // Sort sources by agreement so highest-agreement sources are listed first
  const sorted = [...stepSources].sort((a, b) => (b.agreement ?? 0) - (a.agreement ?? 0));

  const sourcesText = sorted
    .map((source, i) => {
      const agreementPct = source.agreement != null ? ` — ${Math.round(source.agreement * 100)}% material agreement` : "";
      const stepsText = source.steps
        .map((s, j) => `  ${j + 1}. ${s.title}: ${s.instruction}${s.tip ? ` (Tip: ${s.tip})` : ""}`)
        .join("\n");
      return `SOURCE ${i + 1} (${source.sourceName}${agreementPct}):\n${stepsText}`;
    })
    .join("\n\n");

  return `Given these ${stepSources.length} different step-by-step tying instructions for the "${patternName}", create a single authoritative sequence that represents the MAJORITY consensus approach.
${materialsBlock}
IMPORTANT:
- The steps MUST only reference materials from the consensus list above. If a source's step involves a material NOT in the consensus list (e.g., a shellback, counter-wrapped wire, or unusual material), OMIT that step entirely — it represents a variant, not the standard pattern.
- Each source has a "material agreement" percentage. PRIORITIZE sources with higher agreement — they are more likely to represent the standard pattern.
- Only include steps/techniques that appear in most sources. When sources conflict, follow the majority and favor higher-agreement sources.

Preserve specific details (wrap counts, proportions, placement) from the most detailed high-agreement sources. Include tips from any source.

${sourcesText}

Use the merge_steps tool to output the merged canonical step sequence.`;
}

export const STEP_MERGE_TOOL = {
  name: "merge_steps" as const,
  description: "Output the merged/enhanced tying step sequence.",
  input_schema: {
    type: "object" as const,
    properties: {
      steps: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            position: { type: "number" as const },
            title: { type: "string" as const, description: "Short step title (e.g., 'Attach Thread', 'Tie In Tail')" },
            instruction: { type: "string" as const, description: "Detailed instruction with specific techniques" },
            tip: { type: ["string", "null"] as const, description: "Pro tip or common mistake to avoid" },
          },
          required: ["position", "title", "instruction", "tip"],
        },
      },
    },
    required: ["steps"],
  },
};
