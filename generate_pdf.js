import fs from 'fs';
import { marked } from 'marked';

// Read the markdown file
const markdownContent = fs.readFileSync('Money_Flow_Comprehensive_Analysis.md', 'utf8');

// Convert to HTML
const htmlContent = marked.parse(markdownContent);

// Create a full HTML document with styling
const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Money Flow - Comprehensive Analysis</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
        h3 { color: #1e3a8a; margin-top: 25px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Consolas', monospace; }
        pre { background: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; border-left: 4px solid #2563eb; }
        blockquote { border-left: 4px solid #e5e7eb; margin: 0; padding-left: 20px; color: #6b7280; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .status-complete { color: #059669; font-weight: bold; }
        .status-partial { color: #d97706; font-weight: bold; }
        .status-missing { color: #dc2626; font-weight: bold; }
        .priority-high { background: #fef2f2; padding: 2px 8px; border-radius: 4px; }
        .priority-medium { background: #fffbeb; padding: 2px 8px; border-radius: 4px; }
        .priority-low { background: #f0fdf4; padding: 2px 8px; border-radius: 4px; }
        @media print {
            body { margin: 0; }
            h1, h2 { page-break-after: avoid; }
            pre, blockquote { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

// Write HTML file
fs.writeFileSync('Money_Flow_Comprehensive_Analysis.html', fullHtml);

console.log('HTML file created successfully: Money_Flow_Comprehensive_Analysis.html');
console.log('You can open this file in a browser and use "Print to PDF" to create the PDF version.');