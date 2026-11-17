# Design System & Motion Taste Guidelines

This project adheres strictly to **Apple Human Interface Guidelines (HIG)** and **Emil Kowalski's Design Engineering Principles**.

## 1. Physical Foundations (Apple Spring Physics)
- **Interruptible Springs**: Never use arbitrary cubic-beziers or fixed duration easings (`ease-in-out`). Use physical spring configurations:
  - Standard Micro-interactions: `stiffness: 480, damping: 30, mass: 0.8`
  - Gentle Sheets & Modals: `stiffness: 320, damping: 28, mass: 1`
  - Tactile Bounce (Heart toggle, badge pop): `stiffness: 550, damping: 22, mass: 0.6`
- **Instant Press Feedback**: Always respond on pointer-down / `:active`, never on release. Use `.apple-press` (`scale(0.96)`) or `.apple-press-subtle` (`scale(0.982)`).

## 2. Materials & Specular Layers
- **Liquid Glass Materials**: Use `backdrop-filter: blur(28px) saturate(190%)` for toolbars and sidebars.
- **Specular Inset Highlights**: Avoid harsh 100% opaque borders. Use semi-transparent borders with subtle inner specular sheen:
  - Light mode: `inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 1px 3px rgba(0, 0, 0, 0.04)`
  - Dark mode: `inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 8px rgba(0, 0, 0, 0.35)`

## 3. Gestures & Direct Manipulation
- **1:1 Pointer Tracking**: In the lightbox, pulling down tracks the pointer 1:1 with proportional opacity decay. Releasing past the velocity or distance threshold dismisses; releasing below threshold springs back to center.
- **Continuous Wheel Zoom**: Zooming photos centers on cursor with rubber-band limits.

## 4. Compositor Performance
- All animations must strictly target `transform` and `opacity`. Never animate `width`, `height`, `top`, or `margin`.

