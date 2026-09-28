import os

def update_text(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    old_text = "Refine your digital presence in seconds. Change your bio, update your contact details, and swap layouts effortlessly. Every change you make in the editor reflects instantly on your live profile."
    new_text = "Refine your digital presence in seconds. Change your bio, update your contact details, and swap layouts effortlessly."

    if old_text in content:
        content = content.replace(old_text, new_text)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find exact text in {filepath}")

update_text('src/app/page.tsx')
update_text('tayz-landing/src/app/page.tsx')
