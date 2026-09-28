import os

def insert_eco_section(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    eco_component = """
function StoryboardEco() {
  return (
    <section className="py-24 bg-background border-t border-border-subtle relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <FadeIn>
          <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Never print a paper card again.
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-xl text-[#52525b] dark:text-[#a1a1aa] mb-0 max-w-2xl mx-auto leading-relaxed">
            One Tayz metal card replaces thousands of paper business cards. Change your job, update your title, or switch contact details without ever throwing away another card. Zero paper wasted.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

function PricingOffer()"""

    if "StoryboardEco" not in content:
        # Insert the component definition before PricingOffer
        content = content.replace("function PricingOffer()", eco_component)
        
        # Insert the component call in the main render block before <PricingOffer />
        content = content.replace("<PricingOffer />", "<StoryboardEco />\n      <PricingOffer />")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

insert_eco_section('src/app/page.tsx')
insert_eco_section('tayz-landing/src/app/page.tsx')
