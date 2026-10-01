import re

def update_hero_visual(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update react imports
    if "import { useState, useEffect } from 'react';" in content:
        content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useRef, useCallback } from 'react';")
    elif "useRef" not in content and "import { useState, useEffect" in content:
        # Fallback if someone modified it
        pass # will handle manually if needed, but it should match exactly

    # Define new HeroVisual logic
    old_logic = """  function HeroVisual() {
    const cardControls = useAnimation();
    const screenControls = useAnimation();
    const [isTapped, setIsTapped] = useState(false);
  
    const handleHover = async () => {
      if (isTapped) return;
      setIsTapped(true);
      // 1. Card moves in to tap the screen
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
      // 2. Screen lights up
      screenControls.start({ opacity: 1, transition: { duration: 0.3 } });
      // 3. Card slides away (down) to reveal the profile
      await cardControls.start({
        y: "100%",
        opacity: 0,
        transition: { duration: 0.6, delay: 0.2, ease: "easeInOut" }
      });
    };
  
    const handleMouseLeave = async () => {
      setIsTapped(false);
      screenControls.start({ opacity: 0, transition: { duration: 0.3 } });
      cardControls.start({
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
    };"""

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
          await new Promise(r => setTimeout(r, 1000)); // Initial delay before starting the loop
          if (!mounted) break;
          
          await playTapSequence();
          
          await new Promise(r => setTimeout(r, 2000)); // Hold profile view for 2 seconds
          if (!mounted) break;
          
          await playResetSequence();
          
          await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds before next tap
        }
      };

      loop();

      return () => {
        mounted = false;
        isAutoPlaying.current = false;
      };
    }, [playTapSequence, playResetSequence]);"""

    if old_logic in content:
        content = content.replace(old_logic, new_logic)
        
        # We should also change the text "Hover to Tap" conditionally, or at least change it to something else on mobile.
        # But for now, we'll just leave it or change it via CSS or a state if needed.
        # "Hover to Tap" won't show long since the animation auto-plays.
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Could not find exact text in {filepath}. Check old_logic variable.")

update_hero_visual('src/app/page.tsx')
update_hero_visual('tayz-landing/src/app/page.tsx')
