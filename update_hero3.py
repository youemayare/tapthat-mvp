import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    
    for i, line in enumerate(lines):
        if "function HeroVisual() {" in line:
            start_idx = i
        if start_idx != -1 and i > start_idx and "return (" in line:
            end_idx = i
            break
            
    if start_idx == -1 or end_idx == -1:
        print(f"Could not find HeroVisual bounds in {filepath}")
        return
        
    # Inject react imports if not there
    react_import_idx = -1
    for i, line in enumerate(lines):
        if "from 'react'" in line:
            react_import_idx = i
            break
            
    if react_import_idx != -1:
        lines[react_import_idx] = "import { useState, useEffect, useRef, useCallback } from 'react';\n"
        
    new_logic = """  function HeroVisual() {
    const cardControls = useAnimation();
    const screenControls = useAnimation();
    const [isTapped, setIsTapped] = useState(false);
    const isAutoPlaying = useRef(false);
    const [isTouch, setIsTouch] = useState(false);

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
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      setIsTouch(isTouchDevice);
      if (!isTouchDevice) return;

      isAutoPlaying.current = true;
      let mounted = true;

      const loop = async () => {
        while (mounted) {
          await new Promise(r => setTimeout(r, 1000));
          if (!mounted) break;
          
          await playTapSequence();
          
          await new Promise(r => setTimeout(r, 2000));
          if (!mounted) break;
          
          await playResetSequence();
          
          await new Promise(r => setTimeout(r, 3000));
        }
      };

      loop();

      return () => {
        mounted = false;
        isAutoPlaying.current = false;
      };
    }, [playTapSequence, playResetSequence]);

    return (
"""
    
    # Replace the chunk
    new_lines = lines[:start_idx] + [new_logic] + lines[end_idx + 1:]
    
    content = "".join(new_lines)
    content = content.replace(">Hover to Tap</span>", ">{isTouch ? 'Tap to Connect' : 'Hover to Tap'}</span>")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully updated {filepath}")

process_file('src/app/page.tsx')
process_file('tayz-landing/src/app/page.tsx')
