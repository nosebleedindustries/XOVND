# CLVSTER hero module — JUCE WebBrowserComponent handoff

This folder contains a **single self-contained HTML file** (`clvster-hero.html`) that reproduces, pixel-for-pixel, the hero panel from the marketing site:

- generative algorithmic background (5 line/wiggle/noise primitives in a grid of n×n cells, three params `n` / `marg` / `amp` re-rolling every ~2.8 s)
- white-glitch animated CLVSTER logo (`mix-blend-mode: screen` + a 4.6 s `clvsterGlitch` keyframe sequence: jitter / slice-tear / strobe)
- yellow `Cluster Chain Sequencer` tagline pulled up `-57 px` so it overlaps the bottom of the logo's bounding box
- floating plugin UI screenshot below

Drop it into a `juce::WebBrowserComponent` and you're done.

---

## 1. Files you need

```
Resources/
├── clvster-hero.html       ← this folder
├── clvster-logo.jpg        ← logo with transparent / black bg, blended to white via mix-blend-mode
└── clvster-ui.png          ← plugin UI screenshot
```

The HTML references both images by relative URL (`src="clvster-logo.jpg"` and `src="clvster-ui.png"`). Keep them all in the same served directory.

> The logo must be a dark-on-dark image (black background, mid-tone artwork). `mix-blend-mode: screen` plus the brightness-pumping CSS filter is what makes it punch out as luminous white. A pre-keyed white PNG will not look the same.

---

## 2. Bundle resources into the plugin (BinaryData)

In **Projucer** → File Explorer → add these three files under `Binary Resources`. They become `BinaryData::clvster_hero_html` etc.

Or in **CMake**:

```cmake
juce_add_binary_data (ClvsterAssets
    SOURCES
        Resources/clvster-hero.html
        Resources/clvster-logo.jpg
        Resources/clvster-ui.png)

target_link_libraries (YourPlugin PRIVATE ClvsterAssets)
```

---

## 3. The WebView component (JUCE 8+)

JUCE 8 added a real Chromium/WebKit-backed `WebBrowserComponent` with a resource provider hook. Pre-JUCE-8, see Section 5.

```cpp
// HeroWebView.h
#pragma once
#include <juce_gui_extra/juce_gui_extra.h>
#include "BinaryData.h"

class HeroWebView  : public juce::Component
{
public:
    HeroWebView()
    {
        using WB = juce::WebBrowserComponent;

        web = std::make_unique<WB> (
            WB::Options()
                .withBackend (WB::Options::Backend::webview2)        // Win: WebView2
              #if JUCE_MAC
                .withBackend (WB::Options::Backend::webKit)
              #endif
                .withResourceProvider ([] (const auto& url) -> std::optional<WB::Resource>
                {
                    return getResourceForUrl (url);
                })
                .withNativeIntegrationEnabled());                    // optional

        addAndMakeVisible (*web);

        // Load the embedded HTML. The "https://clvster.local/" host is arbitrary —
        // it just has to be consistent so the resource provider can match relative URLs.
        web->goToURL ("https://clvster.local/clvster-hero.html");
    }

    void resized() override { web->setBounds (getLocalBounds()); }

private:
    static std::optional<juce::WebBrowserComponent::Resource>
    getResourceForUrl (const juce::String& url)
    {
        // url is e.g. "https://clvster.local/clvster-hero.html"
        const auto file = juce::URL (url).getFileName();

        auto serve = [] (const char* data, int size, const juce::String& mime)
        {
            std::vector<std::byte> bytes (size);
            std::memcpy (bytes.data(), data, (size_t) size);
            return juce::WebBrowserComponent::Resource { std::move (bytes), mime };
        };

        if (file == "clvster-hero.html")
            return serve (BinaryData::clvster_hero_html,
                          BinaryData::clvster_hero_htmlSize, "text/html");

        if (file == "clvster-logo.jpg")
            return serve (BinaryData::clvster_logo_jpg,
                          BinaryData::clvster_logo_jpgSize, "image/jpeg");

        if (file == "clvster-ui.png")
            return serve (BinaryData::clvster_ui_png,
                          BinaryData::clvster_ui_pngSize, "image/png");

        return std::nullopt;   // 404
    }

    std::unique_ptr<juce::WebBrowserComponent> web;
};
```

Add `HeroWebView` to your editor:

```cpp
// PluginEditor.h
HeroWebView hero;

// PluginEditor.cpp constructor
addAndMakeVisible (hero);
setSize (1280, 720);

// resized()
hero.setBounds (getLocalBounds());
```

---

## 4. Required JUCE modules / build flags

- `juce_gui_extra` (provides `juce::WebBrowserComponent`)
- Enable in `juce_gui_extra` module config:
  - `JUCE_USE_WIN_WEBVIEW2 = 1` (Windows; install the WebView2 evergreen runtime — already present on Win 11)
  - `JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING = 1` if you want to bundle the loader statically
  - macOS uses WKWebView automatically; no extra flags
- Link `WebView2LoaderStatic.lib` on Windows when static-linking

CMake snippet:

```cmake
target_compile_definitions (YourPlugin PRIVATE
    JUCE_USE_WIN_WEBVIEW2=1)
```

---

## 5. Pre-JUCE-8 fallback (no resource provider)

If you're stuck on JUCE 7, embed the HTML as a base64 data URI. Image references won't resolve through `data:` URLs (cross-origin), so inline the images as base64 into the HTML before serving:

```cpp
// Read the binary HTML, base64-inline the two images, then:
const juce::String dataUri = "data:text/html;base64,"
                              + juce::Base64::toBase64 (html);
web->goToURL (dataUri);
```

You can do the base64 inlining at build time with a small script, or at runtime with `juce::Base64::toBase64` + a regex replace on `<img src="…">` tags.

---

## 6. Fonts

The HTML pulls **Archivo Black**, **JetBrains Mono**, and **Space Mono** from Google Fonts. The WebView fetches them over the network at first load. If your plugin must work offline:

1. Download the `.woff2` files for those families
2. Add them to `BinaryData`
3. Serve them from the resource provider (mime `font/woff2`)
4. Replace the `<link href="…googleapis…">` in `clvster-hero.html` with a `@font-face` block that points at the local files

---

## 7. What each piece does — for tweaking

| Selector / function           | Purpose                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `.hero-right`                 | Outer panel. Radial gradient base. `flex-direction: column` stack.                       |
| `.hero-right::after`          | Vignette ramp; dims corners so the logo + photo pop.                                     |
| `.hero-genart` `<canvas>`     | 2D-canvas background, painted by the JS at the bottom of the file.                       |
| `.hero-genart-readout`        | Three small mono chips showing live `n` / `marg` / `amp`. Delete the `<div>` if unwanted.|
| `.hero-logo`                  | `mix-blend-mode: screen` + glitch animation. Logo asset must be dark/transparent.        |
| `@keyframes clvsterGlitch`    | 4.6 s loop: jitter (15–17 %), strobe-dim (37 %), slice-tear (59–60 %), blackout (79 %).  |
| `.hero-tagline`               | `margin-top: -57px` lifts it into the bottom of the logo's bbox. Adjust to taste.        |
| `pickTarget()`                | Picks a new `{n, marg, amp}` triple every epoch. Ranges defined here.                    |
| `EPOCH_MS` / `TRANS_MS`       | How long between rerolls (2800 ms) and how long the ease-morph takes (1400 ms).          |
| `STROKES`                     | Four grays — the entire palette of the generative bg. Add/swap to retune.                |
| The 5 `rect_*` primitives     | Direct ports of the original p5 sketch: lines, x-wiggle, y-wiggle, zigzag, noise dots.   |
| `mulberry32(seed)`            | Seeded PRNG. Seed = `epoch * 9973 + n * 131`, so each epoch lays out the same grid stably.|

---

## 8. Performance notes

- The canvas redraws every frame; on a 4-cell grid it's trivial, on a 9-cell grid with noise primitives it's still cheap. Test on your minimum-spec target — if the GPU is starving the audio thread, drop to `EPOCH_MS = 4500` and skip frames between rerolls (only redraw when `cur` changes more than an epsilon).
- The animation runs in the WebView process, not the audio thread. No risk of audio dropout from CSS animations or `requestAnimationFrame`.
- `mix-blend-mode: screen` is GPU-accelerated everywhere; no perf concern.

---

## 9. Quick checklist for Claude Code

- [ ] Add `clvster-hero.html`, `clvster-logo.jpg`, `clvster-ui.png` to `Resources/` and to BinaryData
- [ ] Add `juce_gui_extra` to the project if not present
- [ ] Set `JUCE_USE_WIN_WEBVIEW2 = 1`
- [ ] Drop `HeroWebView` class into the project
- [ ] `addAndMakeVisible (hero)` in the editor; `hero.setBounds (getLocalBounds())` in `resized()`
- [ ] Build, launch; expect a glitching white CLVSTER over a moving grid of gray lines with the yellow tagline overlapping the bottom of the logo
