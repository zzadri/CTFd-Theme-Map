# CTFd-Theme-Map

`CTFd-Theme-Map` is a public CTFd theme that replaces the classic challenge board with a map-driven experience.

Players browse challenges by country, filter the visible list by category or difficulty, and open challenge modals directly from the map panel without leaving the page.

## Highlights

- Map-first challenge browsing on `/challenges`
- Theme-only setup using native CTFd tags
- No custom plugin required
- Direct challenge modal opening from the map panel
- Light and dark theme support
- Custom public pages for challenges, scoreboard, users, teams, and content pages

## Included Pages

The theme currently overrides the following templates:

| Page | File |
| --- | --- |
| Challenge board | `templates/challenges.html` |
| Content / rules page | `templates/page.html` |
| Scoreboard | `templates/scoreboard.html` |
| Users directory | `templates/users/users.html` |
| Teams directory | `templates/teams/teams.html` |

All other pages fall back to the active CTFd core theme.

## Requirements

- A working CTFd instance
- Theme fallback enabled if you do not duplicate every missing CTFd template

Recommended setting in `CTFd/config.ini`:

```ini
THEME_FALLBACK = true
```

## Installation

1. Copy or clone the theme into your CTFd themes directory:

   ```text
   CTFd/themes/CTFd-Theme-Map
   ```

2. Start CTFd normally.
3. Open the admin panel and select `CTFd-Theme-Map` as the active theme.
4. Keep `THEME_FALLBACK = true` unless you intentionally provide every missing template yourself.

## Challenge Placement

Challenge placement is handled through standard CTFd tags.

Use tags in the form:

```text
map:<country-code>
```

Examples:

- `map:fr`
- `map:de`
- `map:it`
- `map:es`
- `map:us`

If a challenge has a supported `map:*` tag, it becomes available in the matching country on the map.

## Difficulty And Category Display

- Category badges are read from the native CTFd challenge category.
- Difficulty is inferred from visible challenge tags.
- Supported difficulty labels are: `intro`, `tres facile`, `facile`, `moyen`, `difficile`, and `tres difficile`.
- If no matching difficulty tag is found, the theme displays a neutral fallback indicator.

## Map Configuration

Country metadata is defined in:

- `static/js/ctfd-map-data.js`

The map asset is selected in:

- `templates/challenges.html`

The repository currently ships with:

- `static/img/europe-map.svg`
- `static/img/world-map.svg`

The challenge page defaults to `europe-map.svg`, but this can now be changed from admin theme settings.
Regional scopes such as `americas`, `africa`, and `asia-pacific` reuse the world SVG and auto-fit to the selected countries.

## Theme Settings

The theme supports the native CTFd `Theme Settings` JSON field in the admin config page.

Available keys:

- `map_scope`: `europe`, `world`, `americas`, `africa`, or `asia-pacific`
- `map_texture`: `detailed`, `soft`, or `off`
- `map_motion`: `off` or `on`
- `map_zoom`: `50` to `200`
- `map_offset_x`: `-30` to `30`
- `map_offset_y`: `-30` to `30`
- `texture_dark_intensity`: `0` to `500`
- `texture_light_intensity`: `0` to `220`
- `glow_dark_intensity`: `0` to `220`
- `glow_light_intensity`: `0` to `220`
- `vignette_intensity`: `0` to `180`
- `country_glow_intensity`: `50` to `220`
- `used_country_clarity`: `40` to `180`
- `unused_country_clarity`: `40` to `180`
- `panel_visible_rows`: integer from `3` to `10`
- `desktop_panel_width`: integer from `380` to `720`
- `challenge_row_density`: `compact`, `comfortable`, or `spacious`
- `challenge_modal_size`: `md`, `lg`, or `xl`

Example:

```json
{
  "map_scope": "world",
  "map_texture": "detailed",
  "map_motion": "on",
  "map_zoom": 110,
  "map_offset_x": 6,
  "map_offset_y": -2,
  "texture_dark_intensity": 115,
  "texture_light_intensity": 150,
  "glow_dark_intensity": 100,
  "glow_light_intensity": 125,
  "vignette_intensity": 90,
  "country_glow_intensity": 110,
  "used_country_clarity": 115,
  "unused_country_clarity": 80,
  "panel_visible_rows": 6,
  "desktop_panel_width": 560,
  "challenge_row_density": "comfortable",
  "challenge_modal_size": "lg"
}
```

The admin UI also exposes these settings through the theme builder modal, so manual JSON editing is optional.

## Customization

Main customization points:

- Map styles: `static/css/ctfd-map.css`
- Map behavior: `static/js/ctfd-map.js`
- Country dataset: `static/js/ctfd-map-data.js`
- Content pages: `static/css/ctfd-page.css`
- Scoreboard: `static/css/ctfd-scoreboard.css`
- Users and teams: `static/css/ctfd-users.css`

## Public Naming

The public project name is `CTFd-Theme-Map`.

Internal asset and class prefixes use the neutral `ctfd-*` naming for consistency with the public project.

## Limitations

- The theme does not add a custom admin UI for map placement.
- Placement is tag-driven, not form-driven.
- Non-overridden pages still depend on the CTFd core theme.
- If you swap the SVG map, you may also need to update the country dataset and SVG identifiers.

## Repository Layout

```text
CTFd-Theme-Map/
|-- static/
|   |-- css/
|   |-- img/
|   `-- js/
|-- templates/
|   |-- teams/
|   `-- users/
|-- MAP_LICENSE.md
`-- README.md
```

## Credits

- SVG licensing and attribution: see [`MAP_LICENSE.md`](./MAP_LICENSE.md)
- Built for CTFd theme fallback usage
