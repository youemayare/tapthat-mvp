import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add ASSET_MODE constant after imports
    if 'const ASSET_MODE =' not in content:
        content = content.replace(
            "import Link from 'next/link';",
            "import Link from 'next/link';\n\nconst ASSET_MODE = process.env.NEXT_PUBLIC_LANDING_MODE === 'dummy' ? 'dummy' : 'real';"
        )
    
    # Replace static storyboard images
    content = re.sub(
        r'src="/storyboard/([^"]+)"',
        r'src={`/storyboard/${ASSET_MODE}/\1`}',
        content
    )
    
    # Replace dynamic storyboard images (like layout-${theme}.png)
    content = content.replace(
        'src={`/storyboard/layout-${theme}.png`}',
        'src={`/storyboard/${ASSET_MODE}/layout-${theme}.png`}'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/app/page.tsx')
process_file('tayz-landing/src/app/page.tsx')
