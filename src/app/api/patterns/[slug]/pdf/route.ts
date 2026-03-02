import { NextRequest, NextResponse } from "next/server";
import { getPatternBySlug } from "@/services/pattern.service";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WATER_TYPE_LABELS,
  MATERIAL_TYPE_LABELS,
  APP_NAME,
} from "@/lib/constants";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Generates a printer-friendly HTML page for a fly pattern.
 * The client triggers browser print dialog to create a PDF.
 * This avoids heavy PDF library dependencies while providing
 * a clean, well-formatted printable recipe.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  const materialsHtml = pattern.materials
    .map((pm) => {
      const name = pm.material.name;
      const type = MATERIAL_TYPE_LABELS[pm.material.type] ?? pm.material.type;
      const color = pm.customColor ? ` (${pm.customColor})` : "";
      const size = pm.customSize ? ` — ${pm.customSize}` : "";
      const optional = pm.required ? "" : " <em>(optional)</em>";
      return `<tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${type}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #e5e7eb;">${name}${color}${size}${optional}</td>
      </tr>`;
    })
    .join("");

  const tyingStepsHtml = pattern.tyingSteps && pattern.tyingSteps.length > 0
    ? `<h2 style="margin-top: 24px; font-size: 18px; color: #1f2937;">How to Tie</h2>
       <ol style="margin-top: 12px; padding-left: 0; list-style: none; counter-reset: step-counter;">
         ${pattern.tyingSteps
           .map(
             (step) => `
         <li style="margin-top: 16px; padding-left: 40px; position: relative;">
           <span style="position: absolute; left: 0; top: 0; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #f0f7f4; color: #2b6e57; font-size: 13px; font-weight: 700;">${step.position}</span>
           <strong style="font-size: 14px; color: #1f2937;">${step.title}</strong>
           <p style="font-size: 13px; color: #4b5563; margin-top: 4px; line-height: 1.6;">${step.instruction}</p>
           ${step.tip ? `<p style="font-size: 12px; color: #92400e; margin-top: 6px; padding: 6px 10px; background: #fffbeb; border-radius: 4px;"><strong>Tip:</strong> ${step.tip}</p>` : ""}
         </li>`,
           )
           .join("")}
       </ol>`
    : "";

  const variationsHtml = pattern.variations.length > 0
    ? `<h2 style="margin-top: 24px; font-size: 18px; color: #1f2937;">Variations</h2>
       ${pattern.variations
         .map(
           (v) => `
         <div style="margin-top: 12px;">
           <h3 style="font-size: 15px; font-weight: 600; color: #374151;">${v.name}</h3>
           <p style="font-size: 13px; color: #6b7280; margin-top: 4px;">${v.description}</p>
           ${v.overrides.length > 0
             ? `<ul style="margin-top: 4px; padding-left: 20px; font-size: 13px; color: #4b5563;">
                 ${v.overrides.map((o) => `<li>Replace ${o.originalMaterial.name} with ${o.replacementMaterial.name}</li>`).join("")}
               </ul>`
             : ""}
         </div>`,
         )
         .join("")}`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pattern.name} — ${APP_NAME}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      color: #1f2937;
      max-width: 700px;
      margin: 0 auto;
      padding: 32px 24px;
      line-height: 1.5;
    }
    h1 { font-size: 28px; margin: 0; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #f0f7f4; border-radius: 8px; text-align: center;">
    <button onclick="window.print()" style="padding: 8px 24px; background: #2b6e57; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
      Print / Save as PDF
    </button>
    <span style="margin-left: 12px; font-size: 13px; color: #6b7280;">Use your browser's print dialog to save as PDF</span>
  </div>

  <h1>${pattern.name}</h1>

  <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
    <span style="display: inline-block; padding: 2px 10px; background: #f0f7f4; color: #2b6e57; border-radius: 12px; font-size: 13px; font-weight: 500;">${CATEGORY_LABELS[pattern.category] ?? pattern.category}</span>
    <span style="display: inline-block; padding: 2px 10px; background: #fef3c7; color: #92400e; border-radius: 12px; font-size: 13px; font-weight: 500;">${DIFFICULTY_LABELS[pattern.difficulty] ?? pattern.difficulty}</span>
    <span style="display: inline-block; padding: 2px 10px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 13px; font-weight: 500;">${WATER_TYPE_LABELS[pattern.waterType] ?? pattern.waterType}</span>
  </div>

  <p style="margin-top: 16px; font-size: 15px; color: #4b5563;">${pattern.description}</p>

  ${pattern.origin ? `<p style="font-size: 13px; color: #9ca3af; margin-top: 8px;"><strong>Origin:</strong> ${pattern.origin}</p>` : ""}

  <h2 style="margin-top: 24px; font-size: 18px; color: #1f2937;">Materials</h2>
  <table>
    <thead>
      <tr>
        <th style="padding: 6px 12px; border-bottom: 2px solid #d1d5db; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase;">Type</th>
        <th style="padding: 6px 12px; border-bottom: 2px solid #d1d5db; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase;">Material</th>
      </tr>
    </thead>
    <tbody>
      ${materialsHtml}
    </tbody>
  </table>

  ${tyingStepsHtml}

  ${variationsHtml}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
    Generated from ${APP_NAME} &bull; flyarchive.com
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
