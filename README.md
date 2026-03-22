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

- `static/js/april-map-data.js`

The map asset is selected in:

- `templates/challenges.html`

The repository currently ships with:

- `static/img/europe-map.svg`
- `static/img/world-map.svg`

The current challenge page is wired to `europe-map.svg` by default.

## Customization

Main customization points:

- Map styles: `static/css/april-map.css`
- Map behavior: `static/js/april-map.js`
- Country dataset: `static/js/april-map-data.js`
- Content pages: `static/css/april-page.css`
- Scoreboard: `static/css/april-scoreboard.css`
- Users and teams: `static/css/april-users.css`

## Public Naming

The public project name is `CTFd-Theme-Map`.

Some internal asset filenames still use the historical `april-*` prefix. This is kept as an implementation detail for compatibility and does not affect installation, activation, or public branding.

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
