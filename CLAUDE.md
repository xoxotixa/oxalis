# Oxalis — site vitrine

Site vitrine (accueil + page devis) pour **Oxalis**, l'agence web d'Adrien Eloy (micro-entreprise, Reims). Oxalis crée, entretient et automatise le site internet des artisans, TPE et PME de Reims, de la Marne et du Grand Est. Le site est hébergé sur **Netlify** et le domaine prévu est `agence-oxalis.fr`.

Tout le contenu est en **français**, avec un vouvoiement chaleureux, sans jargon, et « on » pour parler de l'agence. Les explications données à Adrien se font aussi en français.

## Structure

```
index.html              page d'accueil (/) : balisage, CSS et JS du composant
devis/index.html        page « Demande de devis » (/devis/) : en-tête, bouton Retour, formulaire complet, pied de page
js/runtime.js           moteur d'affichage (React intégré) — ne pas modifier
css/oxalis.css          composants du design system Oxalis (classes ox-*)
fonts/                  polices auto-hébergées (woff2) + fonts.css + licences OFL
assets/                 logo blanc/vert transparent + 3 photos du site exemple (webp)
favicon.png, apple-touch-icon.png
netlify.toml            publication du dossier tel quel, en-têtes de cache
```

Il n'y a pas d'étape de build : on modifie les fichiers et on déploie le dossier.

## Lancer en local

Le site doit être servi en HTTP, il ne s'ouvre pas en double-cliquant sur le fichier :

```
python3 -m http.server 8080      # puis http://localhost:8080
```

Le formulaire ne peut pas envoyer en local : il affiche son message d'erreur, c'est normal. Seul Netlify reçoit les envois.

## Comment fonctionne index.html (important)

La page n'est pas du HTML « classique ». `js/runtime.js` lit deux blocs et les affiche avec React :

1. **`<x-dc> … </x-dc>`** : le gabarit de la page. Il est en HTML, avec :
   - des trous `{{nom}}`, remplis par `renderVals()` : textes, classes, attributs, et les gestionnaires d'événements `onClick="{{fn}}"`, `onSubmit="{{fn}}"` ou `onInput="{{fn}}"` ;
   - des blocs conditionnels `<sc-if value="{{bool}}" hint-placeholder-val="{{true}}"> … </sc-if>` et des boucles `<sc-for list="{{tableau}}" as="t"> … </sc-for>` ;
   - un bloc `<helmet>` au début, qui contient tout le CSS du site (dans un `<style>`).
2. **`<script type="text/x-dc" data-dc-script>`** : `class Component extends DCLogic`, qui fonctionne comme un composant React à classe :
   - `this.state` / `this.setState()` ;
   - `componentDidMount()` contient toutes les animations et tous les effets, rangés en blocs commentés `/* --- … --- */` : chargement, titres décodés, compteurs de prix, révélations au scroll, globe 3D, cerveau et réseau, workflow, site exemple, en-tête au scroll, effets souris… ;
   - `renderVals()` renvoie les valeurs et les fonctions des trous `{{…}}`.

Après `</script>`, juste avant `</body>`, se trouve le **panneau Mentions légales**. C'est du HTML, du CSS et du JS ordinaires, en dehors du moteur.

### Fond du site : grille lumineuse (les deux pages)

Un calque fixe `.ox-grid` (un `<div>` avec un `<canvas>`) est placé derrière tout le contenu, juste avant le panneau Mentions légales, avec son script « FOND EN GRILLE LUMINEUSE ». Il dessine une grille fine de 32 px sur le fond bleu nuit. Les cases s'allument en vert là où passe la souris (pointeur fin uniquement), et quelques cases s'allument seules toutes les 2 s environ. Derrière les lignes de texte posées directement sur le fond, les cases restent très faibles pour garder le texte lisible. Les textes dans les cartes, les en-têtes et la maquette sont ignorés (sélecteur `SKIP` du script).

- **Réglages :** variables `--grid-*` en haut de la balise `<style>` : couleur du fond, taille des cases, traits, nuances de vert, opacités, portée autour de la souris, cases allumées seules.
- **Réduire les animations :** la grille reste visible, mais aucune case ne s'allume.
- Elle remplace l'ancien fond en vagues, ainsi que la grille et les cases clignotantes du hero (`.hero-grid` et `.px`, masquées en CSS).
- Pour qu'un texte posé sur le fond soit protégé alors qu'il n'est pas un titre, un paragraphe ou un élément de liste, ajoutez-lui l'attribut `data-grid-avoid`.

### Pièges connus (déjà rencontrés)

- **Ne jamais mettre une classe dynamique (`class="… {{x}}"`) sur un élément qui a `data-reveal`.** Le nouveau rendu efface la classe `in` ajoutée par l'IntersectionObserver, et l'élément redevient invisible. Pour un état, on utilise un attribut à part, par exemple `data-open="{{…}}"`, et le CSS cible `[data-open="true"]`. C'est le cas des cartes « Nos services ».
- **Les écouteurs posés sur des éléments du gabarit avant le rendu sont perdus.** Le JS extérieur au composant, comme celui du panneau Mentions légales, utilise donc la délégation : `document.addEventListener('click', … e.target.closest(...))`.
- **Animations :** elles ne s'activent que si `prefers-reduced-motion` ne le demande pas. Les effets souris (classe `fx-on`) ne s'activent qu'avec un pointeur fin. Tout nouvel effet doit respecter ces deux règles, et le contenu doit rester visible sans animation.
- **Révélations au scroll :** les éléments `[data-reveal]` sont cachés tant que `.anim-on` est présent et que `.in` est absent. Il faut vérifier qu'un nouvel élément apparaît bien.
- **Un seul `<h1>`.** Les identifiants doivent être uniques. Les classes du site exemple sont préfixées `mx-`, celles des mini-maquettes `ms-` et `mk-`.

## Sections (dans l'ordre)

Chargement (logo et barre verte, ≈1,5 s) → Hero `#accueil`, avec le header, le globe 3D et la maquette → Le constat `#constat` → Services `#services`, avec l'animation de workflow → Tarifs `#tarifs` → Nos services `#nos-services`, en accordéon, une seule carte ouverte à la fois → Méthode `#methode` → Réalisations `#realisations`, avec le site exemple « Maçonnerie & Rénovation » intégré, entreprise fictive → Pourquoi `#pourquoi`, avec la carte radar de zone et son bandeau → FAQ `#faq` → Contact `#contact` (bandeau avec bouton vers `/devis/`, téléphone et e-mail) → Footer. Le formulaire est sur la page `/devis/`.

Un menu fixe (`.hdr-site`) apparaît quand le hero sort de l'écran. Tant qu'il est caché, il est `inert` et `aria-hidden`.

## Formulaire de devis (Netlify Forms) — sur la page /devis/

- La balise `<form name="devis" method="POST" data-netlify="true" netlify-honeypot="bot-field">` contient le champ caché `form-name=devis` et un champ anti-spam `bot-field`.
- Champs (3 blocs : Vous / Votre entreprise / Votre projet) : `nom`, `telephone`, `email`, `preference_contact`, `entreprise`, `metier`, `taille`, `commune`, `besoins` (champ caché rempli en JS avec les cases `[data-besoin]` cochées), `site_actuel`, `site_url`, `delai`, `message`. Le nom et le message sont obligatoires, plus un téléphone **ou** un e-mail (vérifié en JS dans `send`). Un nouveau champ doit avoir un `name` unique et être ajouté à « Données collectées » dans les mentions légales.
- L'envoi se fait par `fetch('/')` en `application/x-www-form-urlencoded`, sans recharger la page. Pendant l'envoi : bouton désactivé et « Envoi en cours… ». En cas de succès, le formulaire est remplacé par « Merci, votre demande a bien été envoyée. Je vous réponds sous 24 h. ». En cas d'échec : « L'envoi n'a pas fonctionné. Écrivez-moi directement à contact@agence-oxalis.fr. »
- Dans Netlify, il faut activer la détection des formulaires (Forms) et configurer une notification par e-mail vers contact@agence-oxalis.fr.

## Informations de référence (à garder cohérentes partout)

- **Contact :** contact@agence-oxalis.fr · 06 67 86 48 85 (`tel:+33667864885`) · LinkedIn https://www.linkedin.com/in/adrien-eloy-a9698928a/
- **Éditeur :** Adrien Eloy, entrepreneur individuel, 24 rue Jane Addams, 51430 Bezannes · SIRET 130 950 876 00016 · TVA non applicable, art. 293 B du CGI
- **Hébergeur :** Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis
- **Prix :** site vitrine sur devis, à partir de **699 € TTC**. Maintenance **99 €/mois TTC**, 6 mois minimum, puis sans engagement.
- **Délais :** site livré en **5 jours** · réponse aux messages sous **24 h** · devis gratuit sous **48 h**
- **Zone :** sur place à Reims, dans la Marne et le Grand Est · à distance partout en France

Si une de ces informations change, mettez à jour **toutes** ses occurrences : texte, FAQ, meta description, balises og:, mentions légales.

## Règles à respecter

- **Contenu :**
  - Ne jamais dire que l'agence est récente.
  - N'inventer aucun chiffre, aucun avis client, aucun logo client et aucune réalisation présentée comme réelle. Le site exemple est indiqué comme fictif.
  - Ne faire aucune promesse non prouvée, par exemple « première place Google ».
- **RGPD et cookies :** le site n'utilise **aucun cookie, aucun traceur et aucun stockage navigateur** (`localStorage`, etc.), et **aucun service tiers**, puisque les polices sont hébergées sur le site. Les mentions légales l'affirment. Ajouter un outil tiers (statistiques, Google Fonts, carte, vidéo…) oblige à mettre à jour la partie Données personnelles ou Cookies, et parfois à ajouter un bandeau de consentement.
- **Accessibilité :**
  - Textes alternatifs sur les images (`alt=""` si l'image est décorative), contrastes AA, navigation au clavier, lien « Aller au contenu ».
  - Vrais `<button>` avec `aria-expanded` / `aria-controls` pour tout ce qui s'ouvre et se ferme.
- **Design :**
  - Thème sombre : fonds `#18202a` et `#121820`, cartes `#222c38`, bordures `#354253`.
  - Accent vert sauge : `#7cc79b` et `#8fd0aa`. Texte : `#eef1f2`, texte secondaire `#aab5c1`.
  - Polices : Sora pour les titres, Geist pour le texte, Geist Mono pour les étiquettes `// SURTITRE`.
  - Réutiliser les classes `ox-*` (`ox-btn`, `ox-card`, `ox-h2`, `ox-faq__item`…) et les variables `--ease` existantes.
- **Mobile d'abord :** tester à 320, 390, 768, 1024 et 1440 px de large, sans aucun défilement horizontal.

## Mise en ligne

Glisser le dossier dans Netlify (Deploy manually), ou relier un dépôt Git : la publication se fait depuis la racine, comme l'indique `netlify.toml`. Après le premier déploiement, vérifier que le formulaire « devis » apparaît dans Forms, puis envoyer une demande de test.


## Pages

- **`/` (index.html)** : l'accueil. La section `#contact` est un bandeau avec un bouton vers `/devis/`, le téléphone et l'e-mail. Tous les boutons « Devis » et « Contact » pointent vers `/devis/`.
- **`/devis/` (devis/index.html)** : même CSS et même composant que l'accueil, sans chargement ni hero. Bouton « ← Retour » vers `/`, en-tête fixe toujours visible, liens du menu vers `/#services`, `/#tarifs`, etc. Chemins absolus (`/css/…`, `/js/…`, `/assets/…`).
- Formulaire complet en 3 blocs (Vous / Votre entreprise / Votre projet) : `nom`, `telephone`, `email`, `preference_contact`, `entreprise`, `metier`, `taille`, `commune`, `besoins` (champ caché rempli en JS), `site_actuel`, `site_url`, `delai`, `message`.
- **Souris :** rond vert `.cur-ring`, cartes qui s'inclinent (`data-tilt`) et boutons aimantés (`data-magnet`). Les formes du haut de page suivent légèrement la souris (effet de profondeur, variables `--mx` / `--my` sur le hero). Pas de grille lumineuse ni de traînée : Adrien a choisi de ne pas les garder.
- Modifier une partie commune (en-tête, pied de page, CSS, composant) : le faire **dans les deux fichiers**.
