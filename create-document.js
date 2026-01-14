import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
         AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, VerticalAlign } from 'docx';
import fs from 'fs';

// CRITICAL RULE 1: Set page size explicitly (defaults to A4, use US Letter)
const pageSize = {
  width: 12240,  // US Letter width in DXA (1440 DXA = 1 inch)
  height: 15840  // US Letter height in DXA
};

// CRITICAL RULE 4 & 5: Table border definitions (must be outside children array)
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

// CRITICAL RULE 2: Never use unicode bullets - use numbering config
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 }
              }
            }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: pageSize,
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "Sample Document with Bulleted List and Table",
              bold: true,
              size: 28
            })
          ],
          spacing: { after: 400 }
        }),

        // Bulleted List Section
        new Paragraph({
          children: [
            new TextRun({
              text: "Key Features:",
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 200 }
        }),

        // CRITICAL RULE 3: Use numbering reference, NOT unicode bullets
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun("First bullet point with proper formatting")]
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun("Second bullet point demonstrating correct list structure")]
        }),
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun("Third bullet point following docx-js best practices")]
        }),

        // Spacing before table
        new Paragraph({
          children: [],
          spacing: { before: 400 }
        }),

        // Table Section Title
        new Paragraph({
          children: [
            new TextRun({
              text: "Sample Data Table:",
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 400, after: 200 }
        }),

        // CRITICAL RULE 4: Tables need DUAL widths - columnWidths AND cell width
        // CRITICAL RULE 5: Use ShadingType.CLEAR, never SOLID
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [4680, 4680, 4680], // Three equal columns
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Column 1", bold: true })],
                      alignment: AlignmentType.CENTER
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Column 2", bold: true })],
                      alignment: AlignmentType.CENTER
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Column 3", bold: true })],
                      alignment: AlignmentType.CENTER
                    })
                  ]
                })
              ]
            }),
            // Data row 1
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 1, Cell 1")]
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 1, Cell 2")]
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 1, Cell 3")]
                    })
                  ]
                })
              ]
            }),
            // Data row 2
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 2, Cell 1")]
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 2, Cell 2")]
                    })
                  ]
                }),
                new TableCell({
                  borders,
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      children: [new TextRun("Row 2, Cell 3")]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }
  ]
});

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("sample-document.docx", buffer);
  console.log("✅ Word document created successfully: sample-document.docx");
  console.log("\n📋 Critical Rules Followed:");
  console.log("   ✓ Page size explicitly set to US Letter (12240 x 15840 DXA)");
  console.log("   ✓ Bulleted list uses numbering config (NOT unicode bullets)");
  console.log("   ✓ Table has dual widths (columnWidths array AND cell width)");
  console.log("   ✓ Table shading uses ShadingType.CLEAR (not SOLID)");
  console.log("   ✓ No \\n characters - using separate Paragraph elements");
});
