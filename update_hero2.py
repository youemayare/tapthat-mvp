import re

def update_hero_visual(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update react imports
    if "import { useState, useEffect } from 'react';" in content:
        content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useRef, useCallback } from 'react';")
    
    new_logic = """  function HeroVisual() {
    const cardControls = useAnimation();
    const screenControls = useAnimation();
    const [isTapped, setIsTapped] = useState(false);
    const isAutoPlaying = useRef(false);

    const playTapSequence = useCallback(async () => {
      setIsTapped(true);
      await cardControls.start({
        y: "-50%",
        x: "-50%",
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        transition: { duration: 0.4, ease: "easeOut" }
      });
      screenControls.start({ opacity: 1, transition: { duration: 0.3 } });
      await cardControls.start({
        y: "100%",
        opacity: 0,
        transition: { duration: 0.6, delay: 0.2, ease: "easeInOut" }
      });
    }, [cardControls, screenControls]);

    const playResetSequence = useCallback(async () => {
      setIsTapped(false);
      screenControls.start({ opacity: 0, transition: { duration: 0.3 } });
      await cardControls.start({
        y: "-80%",
        x: "-35%",
        z: 50,
        rotateX: 25,
        rotateY: -15,
        rotateZ: -10,
        scale: 1.1,
        opacity: 1,
        transition: { duration: 0.5, ease: "backOut" }
      });
    }, [cardControls, screenControls]);

    const handleHover = async () => {
      if (isAutoPlaying.current || isTapped) return;
      await playTapSequence();
    };
  
    const handleMouseLeave = async () => {
      if (isAutoPlaying.current) return;
      await playResetSequence();
    };

    useEffect(() => {
      // Check if it's a touch device (mobile/tablet)
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      if (!isTouch) return;

      isAutoPlaying.current = true;
      let mounted = true;

      const loop = async () => {
        while (mounted) {
          await new Promise(r => setTimeout(r, 1000)); // Initial delay
          if (!mounted) break;
          
          await playTapSequence();
          
          await new Promise(r => setTimeout(r, 2000)); // Hold profile view
          if (!mounted) break;
          
          await playResetSequence();
          
          await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
        }
      };

      loop();

      return () => {
        mounted = false;
        isAutoPlaying.current = false;
      };
    }, [playTapSequence, playResetSequence]);

    return ("""

    pattern = re.compile(r'  function HeroVisual\(\) \{[\s\S]*?    return \(', re.MULTILINE)
    
    if pattern.search(content):
        content = pattern.sub(new_logic, content)
        
        # We should also replace the hardcoded "Hover to Tap" with a conditional logic depending on touch device,
        # but since we want to keep things simple, let's just make it not show up on touch devices if possible.
        # Actually, let's find the Hover to Tap text and change it to Tap or Hover
        content = content.replace(">Hover to Tap</span>", ">{isAutoPlaying.current ? 'Tap to Connect' : 'Hover to Tap'}</span>")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find regex match in {filepath}")

update_hero_visual('src/app/page.tsx')
update_hero_visual('tayz-landing/src/app/page.tsx')
