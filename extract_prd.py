import zipfile
import xml.etree.ElementTree as ET

ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
docx_path = r'c:\Users\Acer\Desktop\work\VetWorld\VetWorld_PRD.docx'
output_path = r'c:\Users\Acer\Desktop\work\VetWorld\prd_text.txt'

with zipfile.ZipFile(docx_path, 'r') as z:
    with z.open('word/document.xml') as f:
        tree = ET.parse(f)

root = tree.getroot()
lines = []
for para in root.iter('{' + ns + '}p'):
    parts = []
    for t in para.iter('{' + ns + '}t'):
        if t.text:
            parts.append(t.text)
    line = ''.join(parts).strip()
    lines.append(line)  # include empty lines for paragraph breaks

with open(output_path, 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))

print(f"Extracted {len(lines)} paragraphs to {output_path}")
