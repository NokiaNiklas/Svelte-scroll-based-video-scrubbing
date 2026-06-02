# frame-tools: Frames → Sprite Sheets

Packt eine **PNG-Frame-Sequenz** in webp-Spritesheets für `<ScrollSpriteAnimation>`.
Output landet in `src/lib/assets/hero-animation/`. Das Skript sagt am Ende, welchen
`frameCount` du im Component eintragen musst.

Voraussetzung: `ffmpeg` im PATH (das `spright`-Binary liegt hier im Ordner).

## Benutzung

**1. In den frame-tools-Ordner wechseln** (die Skripte erwarten, dass sie von hier
laufen — `spright.conf`, `./frames/` usw. sind relativ):

```bash
cd src/lib/components/scroll-sprite-animation/frame-tools
```

**2. Frames ablegen:** deine Einzelbilder als **PNG** nach `./frames/` legen —
durchnummeriert mit führenden Nullen und alle gleich groß:

```
frames/frame-0001.png
frames/frame-0002.png
…
```

> Führende Nullen sind wichtig, sonst sortiert `frame-10.png` vor `frame-2.png`.

**3. Packen:**

```bash
./pack-frames.sh
# optional: ./pack-frames.sh [columns] [rows] [qualität]   (Default 4 4 75)
```

`pack-frames.sh` erkennt die Frame-Größe automatisch und baut das Raster passend dazu:
spright packt die Frames → ffmpeg macht webp → kopiert nach `src/lib/assets/hero-animation/`.

**4. `frameCount` übernehmen:** am Ende gibt das Skript die fertige Zeile aus, z. B.
`<ScrollSpriteAnimation … frameCount={192} … />`. Dann `pnpm dev` und scrollen.

## Aufräumen

`pack-frames.sh` legt Zwischen-Ordner an (`frames/`, `spritesheet/`, `webp/`). Gebraucht
werden nur die fertigen `.webp` in `src/lib/assets/hero-animation/`. Die Zwischen-Ordner
entfernst du mit:

```bash
./delete-temp-files.sh
```

(Sie sind ohnehin per `.gitignore` von Git ausgeschlossen.)
