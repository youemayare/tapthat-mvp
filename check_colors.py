from PIL import Image
import os
import colorsys

dir = "public/backgrounds/"
for file in os.listdir(dir):
    if file.endswith(".png"):
        img = Image.open(os.path.join(dir, file))
        img = img.resize((1,1))
        color = img.getpixel((0,0))
        # If RGBA, take first 3
        if len(color) == 4:
            r,g,b,a = color
        else:
            r,g,b = color
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        # Silver is low saturation, light-ish
        print(f"{file}: rgb({r},{g},{b}) sat={s:.2f} val={v:.2f}")