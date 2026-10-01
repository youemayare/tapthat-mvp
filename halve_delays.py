import sys

def halve_delays(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace initial delay
    content = content.replace("await new Promise(r => setTimeout(r, 1000));", "await new Promise(r => setTimeout(r, 500));")
    
    # Replace loop delay
    content = content.replace("await new Promise(r => setTimeout(r, 3000));", "await new Promise(r => setTimeout(r, 1500));")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

halve_delays('src/app/page.tsx')
halve_delays('tayz-landing/src/app/page.tsx')
