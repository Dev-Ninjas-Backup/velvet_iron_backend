const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

async function convertMarkdownToPdf() {
  try {
    const mdFilePath = path.join(__dirname, 'API_DOCUMENTATION.md');
    const pdfFilePath = path.join(__dirname, 'API_DOCUMENTATION.pdf');

    console.log('Converting markdown to PDF...');
    console.log('Input:', mdFilePath);
    console.log('Output:', pdfFilePath);

    const pdf = await mdToPdf(
      { path: mdFilePath },
      {
        dest: pdfFilePath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm',
          },
          printBackground: true,
        },
        stylesheet: [
          'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css',
        ],
        body_class: ['markdown-body'],
        css: `
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
          
          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
          
          h1, h2, h3 {
            border-bottom: 1px solid #eaecef;
            padding-bottom: 0.3em;
          }
          
          code {
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
          }
          
          pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          table th,
          table td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
          }
          
          table tr:nth-child(2n) {
            background-color: #f6f8fa;
          }
        `,
        launch_options: {
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: 'C:\\Users\\Shamim Rana\\.cache\\puppeteer\\chrome\\win64-138.0.7204.92\\chrome-win64\\chrome.exe',
        },
      }
    );

    if (pdf) {
      console.log('✓ PDF generated successfully!');
      console.log('Location:', pdfFilePath);
    }
  } catch (error) {
    console.error('Error converting markdown to PDF:', error);
    process.exit(1);
  }
}

convertMarkdownToPdf();
