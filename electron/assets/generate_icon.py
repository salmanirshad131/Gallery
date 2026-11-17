import math
from PIL import Image, ImageDraw, ImageFilter

def create_mac_icon():
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # macOS App Icon squircle size: 824x824 inside 1024x1024 canvas (padded by 100px)
    pad = 100
    w = size - 2 * pad
    radius = 185
    
    # Base background: deep obsidian gradient with subtle cyan/purple metallic sheen
    base = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    
    # Draw rounded rectangle mask
    mask = Image.new("L", (w, w), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, w, w], radius=radius, fill=255)
    
    # Create gradient background
    for y in range(w):
        t = y / w
        r = int(18 + 14 * math.sin(t * math.pi))
        g = int(20 + 24 * t)
        b = int(32 + 48 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Draw concentric audio vinyl grooves
    cx, cy = w // 2, w // 2 - 20
    groove_draw = ImageDraw.Draw(base)
    for r in range(80, 320, 14):
        alpha = int(18 + 12 * math.cos(r * 0.1))
        groove_draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, alpha), width=1)
        
    # Draw center glowing music note / dynamic sound wave
    # Glowing backdrop circle
    glow = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([cx - 160, cy - 160, cx + 160, cy + 160], fill=(59, 130, 246, 50))
    glow = glow.filter(ImageFilter.GaussianBlur(35))
    base = Image.alpha_composite(base, glow)
    
    # Equalizer soundwaves radiating through the center
    wave_draw = ImageDraw.Draw(base)
    bar_heights = [45, 95, 160, 220, 180, 240, 190, 130, 70]
    bar_w = 22
    bar_gap = 14
    start_x = cx - (len(bar_heights) * (bar_w + bar_gap)) // 2
    
    for i, h in enumerate(bar_heights):
        bx = start_x + i * (bar_w + bar_gap)
        by1 = cy - h // 2
        by2 = cy + h // 2
        # Gradient colors from warm rose/amber to electric cyan
        prog = i / (len(bar_heights) - 1)
        br = int(244 - 150 * prog)
        bg = int(114 + 100 * prog)
        bb = int(182 + 70 * prog)
        wave_draw.rounded_rectangle([bx, by1, bx + bar_w, by2], radius=11, fill=(br, bg, bb, 250))
    
    # Outer border / subtle specular highlight
    specular = ImageDraw.Draw(base)
    specular.rounded_rectangle([1, 1, w - 2, w - 2], radius=radius, outline=(255, 255, 255, 45), width=2)
    
    # Apply rounded mask
    rounded = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    rounded.paste(base, (0, 0), mask=mask)
    
    # Add subtle drop shadow
    shadow_pad = 40
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [pad - 5, pad + 18, size - pad + 5, size - pad + 28],
        radius=radius,
        fill=(0, 0, 0, 110)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    
    img = Image.alpha_composite(img, shadow)
    img.paste(rounded, (pad, pad), mask=mask)
    
    img.save("electron/assets/icon.png", "PNG")
    print("Saved electron/assets/icon.png")

if __name__ == "__main__":
    create_mac_icon()

