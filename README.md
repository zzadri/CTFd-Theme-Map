# CTFd-Theme-Map

`CTFd-Theme-Map` is a public CTFd theme that turns the challenge board into an interactive map-driven experience.

Instead of browsing a flat list of challenges, players open a region on the map, filter by category or difficulty, and launch challenge modals directly from the map panel.

## Features

- Interactive map-based challenge browsing on the `/challenges` page
- Theme-only challenge placement using native CTFd tags such as `map:fr` or `map:de`
- Direct challenge modal opening without leaving the map page
- Custom public-facing layouts for:
  - `challenges`
  - `scoreboard`
  - `users`
  - `teams`
  - `page` / rules-style content pages
- Light and dark theme support
- No custom plugin required

## Requirements

- A working CTFd instance
- Theme fallback enabled if you do not duplicate the full core theme

Recommended setting in `CTFd/config.ini`:

```ini
THEME_FALLBACK = true
```

## Installation

1. Copy the theme into your CTFd themes directory as:

```text
CTFd/themes/CTFd-Theme-Map
```

2. Start CTFd normally.
3. In the CTFd admin panel, open the theme configuration and select `CTFd-Theme-Map`.
4. Keep `THEME_FALLBACK = true` unless you intentionally provide every missing template yourself.

## What The Theme Overrides

The theme currently provides custom templates for:

- `templates/challenges.html`
- `templates/page.html`
- `templates/scoreboard.html`
- `templates/users/users.html`
- `templates/teams/teams.html`

Everything else falls back to the active CTFd core theme.

## How Challenge Placement Works

`CTFd-Theme-Map` stays theme-only by relying on native CTFd challenge tags.

Assign tags in the format:

```text
map:<country-code>
```

Examples:

- `map:fr`
- `map:de`
- `map:it`
- `map:es`
- `map:us`

If a challenge includes a supported `map:*` tag, it becomes available in the corresponding region on the map.

## Map Configuration

Country metadata is defined in:

- `static/js/april-map-data.js`

The active map asset is configured in:

- `templates/challenges.html`

The repository currently ships both:

- `static/img/europe-map.svg`
- `static/img/world-map.svg`

The default `challenges` template is currently wired to `europe-map.svg`.

## User Experience Notes

- The map opens challenge modals directly from the challenge board.
- Difficulty and category filters are generated from the visible challenges currently loaded on the page.
- If a challenge is not visible through the CTFd API for the current user, it will not appear on the map.
- Admin and non-admin users can see different challenge visibility depending on standard CTFd permissions.

## Customization

Common customization points:

- Map country metadata: `static/js/april-map-data.js`
- Map behavior: `static/js/april-map.js`
- Map styling: `static/css/april-map.css`
- Public page styling: `static/css/april-page.css`
- Scoreboard styling: `static/css/april-scoreboard.css`
- User and team directory styling: `static/css/april-users.css`

## Naming Note

The public project name is `CTFd-Theme-Map`.

Some internal asset filenames still use the historical `april-*` prefix. That prefix is only an implementation detail and does not affect installation or activation.

## Limitations

- This theme does not add custom admin fields by itself.
- Placement is driven by tags, not by a dedicated admin UI.
- The theme depends on CTFd core templates for all non-overridden pages.
- If you change map assets, you may also need to update the country dataset and SVG identifiers.

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
