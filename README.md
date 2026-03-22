# april-hacker-map

Theme CTFd minimaliste pour une home "carte du monde" sur fond noir, avec ouverture directe des challenges par pays.

## Ce que fait le theme

- surcharge uniquement `page.html`
- remplace la page `index` par une carte SVG interactive
- garde le reste du theme via le fallback `core`
- ouvre les modals de challenges CTFd sans quitter la carte
- place automatiquement les challenges par pays via les tags natifs de CTFd

## Activation

1. Lancez CTFd normalement.
2. Dans la configuration CTFd, selectionnez le theme `april-hacker-map`.
3. Conservez `THEME_FALLBACK = true` dans `CTFd/config.ini` si vous ne dupliquez pas tout le theme `core`.

## Placement des challenges

Le theme ne peut pas ajouter un champ custom dans l'admin CTFd sans plugin. Pour rester 100% "theme only", il utilise l'onglet Tags deja present dans CTFd.

Regle simple:

- `map:fr` pour France
- `map:ru` pour Russia
- `map:us` pour United States
- `map:jp` pour Japan
- `map:br` pour Brazil

Exemple: si vous ajoutez le tag `map:fr` a un challenge, il apparaitra automatiquement sur la France dans la carte.

Les metadonnees pays sont configurees dans `CTFd/themes/april-hacker-map/static/js/april-map-data.js`.

## Fallback manuel

Si vous voulez absolument forcer un challenge sur un pays sans tag, vous pouvez encore utiliser `challengeIds` dans `april-map-data.js`, mais ce n'est plus le mode recommande.

## Notes

- Si un challenge n'est pas visible via l'API CTFd, il n'apparaitra pas dans la carte.
- Le panneau de droite rappelle le tag attendu pour chaque pays.
- La carte SVG est servie localement depuis `static/img/europe-map.svg`.

## Credits

Voir `CTFd/themes/april-hacker-map/MAP_LICENSE.md` pour la provenance du SVG.
