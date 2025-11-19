#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

function generatePDF(participants, ctfUrl = 'http://localhost:8890') {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CTF Participant Tokens</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 15mm 20mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 8mm;
            box-sizing: border-box;
        }
        
        .token-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6mm;
            width: 100%;
        }
        
        .token-card {
            border: 2px solid #333;
            border-radius: 8px;
            padding: 6mm;
            text-align: center;
            background: #f9f9f9;
            page-break-inside: avoid;
            break-inside: avoid;
            height: 70mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
        }
        
        .token-header {
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3mm;
        }
        
        .participant-name {
            font-size: 16px;
            font-weight: bold;
            color: #e74c3c;
            margin: 2mm 0;
        }
        
        .token-code {
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            background: #fff;
            border: 1px solid #ddd;
            padding: 3mm;
            border-radius: 4px;
            color: #2980b9;
            margin: 3mm 0;
        }
        
        .url-section {
            border-top: 1px solid #bdc3c7;
            padding-top: 2mm;
            margin-top: auto;
        }
        
        .info-label {
            font-size: 13px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 1mm;
            margin-top: 2mm;
        }
        
        .info-value {
            font-size: 15px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            color: #2980b9;
            word-break: break-all;
            line-height: 1.2;
            background: #fff;
            border: 1px solid #ddd;
            padding: 2mm;
            border-radius: 4px;
            margin-bottom: 2mm;
        }
        
        .separator {
            border-top: 1px solid #bdc3c7;
            margin: 3mm 0;
            width: 100%;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .token-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .token-grid {
                orphans: 3;
                widows: 3;
            }
        }
        
        /* Force page break after every 6 cards (2 rows of 3) */
        .token-card:nth-child(6n) {
            page-break-after: always;
        }
        
        /* Prevent page break before cards 2-6 on each page */
        .token-card:nth-child(6n+2),
        .token-card:nth-child(6n+3),
        .token-card:nth-child(6n+4),
        .token-card:nth-child(6n+5),
        .token-card:nth-child(6n+6) {
            page-break-before: avoid;
        }
        
        /* Never break a card itself */
        .token-card {
            break-inside: avoid;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="token-grid">
        ${participants.map(participant => `
            <div class="token-card">
                <div>
                    <div class="token-header">🏁 CTF CHALLENGE</div>
                    <div class="participant-name">${participant.name}</div>
                </div>
                <div class="url-section">
                    <div class="info-label">ACCESS URL</div>
                    <div class="info-value">${ctfUrl}</div>
                    <div class="separator"></div>
                    <div class="info-label">AUTHENTICATION TOKEN</div>
                    <div class="info-value">${participant.token}</div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  
  return html;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node generate-pdf-tokens.js <participants-file.yaml> [ctf-url]');
    console.error('');
    console.error('Examples:');
    console.error('  node generate-pdf-tokens.js participants.yaml');
    console.error('  node generate-pdf-tokens.js participants.yaml http://ctf.example.com:8890');
    process.exit(1);
  }
  
  const participantsFile = args[0];
  const ctfUrl = args[1] || 'http://localhost:8890';
  
  try {
    if (!fs.existsSync(participantsFile)) {
      console.error(`❌ File not found: ${participantsFile}`);
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(participantsFile, 'utf8');
    const data = yaml.load(fileContent);
    
    if (!data.participants || !Array.isArray(data.participants)) {
      console.error('❌ Invalid file format. Expected YAML with "participants" array');
      process.exit(1);
    }
    
    console.log(`🎯 Processing ${data.participants.length} participants...`);
    
    const html = generatePDF(data.participants, ctfUrl);
    const outputFile = participantsFile.replace(/\.(yaml|yml)$/i, '.html');
    
    fs.writeFileSync(outputFile, html);
    
    console.log(`✅ HTML file generated: ${outputFile}`);
    console.log('');
    console.log('📄 To convert to PDF:');
    console.log(`   - Open ${outputFile} in your browser`);
    console.log('   - Print to PDF (Ctrl+P / Cmd+P)');
    console.log('   - Or use: npx playwright-pdf ${outputFile} output.pdf');
    console.log('');
    console.log('✂️  The layout is designed for easy cutting - 3 tokens per row');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generatePDF };