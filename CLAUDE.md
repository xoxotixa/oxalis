# Oxalis — site vitrine

Site vitrine (accueil, page tarifs, page devis) pour **Oxalis**, l'agence web d'Adrien Eloy (micro-entreprise, Reims). Oxalis crée, entretient et automatise le site internet des artisans, TPE et PME de Reims, de la Marne et du Grand Est. Le site est hébergé sur **Netlify** et le domaine prévu est `agence-oxalis.fr`.

Tout le contenu est en **français**, avec un vouvoiement chaleureux, sans jargon, et « on » pour parler de l'agence. Les explications données à Adrien se font aussi en français.

## Structure

```
index.html              accueil (/) : hero, bandeau défilant, constat, services, ce qu'on fait pour vous, méthode, réalisations, pourquoi, FAQ, contact
tarifs/index.html       page « Tarifs » (/tarifs/) : offres « Sur devis », devis en 3 étapes, bandeau vers /devis/
devis/index.html        page « Demande de devis » (/devis/) : formulaire complet + coordonnées
css/site.css            tout le design commun aux trois pages (variables en haut du fichier)
css/exemple.css         styles du site exemple intégré (classes mx-) et de sa fenêtre (classes emb-), accueil seulement
css/visuels.css         maquette qui se construit (mk-), globe 3D, cerveau et réseau (viz-), mini-sites des autres métiers (ms-)
js/site.js              animations et interactions des trois pages (apparitions, en-tête, menu, services, site exemple, formulaire…)
js/visuels.js           maquette qui se construit, cerveau et réseau de nœuds (data-viz) ; l'ancien globe 2D (data-globe) n'est plus utilisé
js/globe-avis.js        globe 3D des avis clients dans le hero (module, accueil seulement), lit /avis.json
js/vendor/cobe.esm.js   bibliothèque du globe WebGL (cobe 2.0.1, MIT), copie locale : aucun chargement extérieur
js/grid.js              fond en grille lumineuse : traînée verte sous la souris, onde ronde au clic
js/pixmark.js           grand logo OXALIS en pixels tout en bas du pied de page (toutes les pages)
avis.json               les avis Google affichés sur le globe, à remplir à la main (voir plus bas)
fonts/                  polices auto-hébergées (woff2) + fonts.css + licences OFL
assets/                 logo blanc/vert (mode nuit), logo foncé oxalis-logo-sombre.png (mode jour), 3 photos du site exemple (webp)
favicon.png, apple-touch-icon.png
netlify.toml            publication du dossier tel quel, en-têtes de cache
```

Le site est en **HTML, CSS et JavaScript simples**, sans framework, sans moteur et sans étape de build : on modifie les fichiers et on déploie le dossier. L'ancien moteur `runtime.js` (gabarits `<x-dc>`) n'est plus utilisé depuis la refonte « éditorial épuré ».

## Lancer en local

Le site doit être servi en HTTP, il ne s'ouvre pas en double-cliquant sur le fichier :

```
python3 -m http.server 8080      # puis http://localhost:8080
```

Le formulaire ne peut pas envoyer en local : il affiche son message d'erreur, c'est normal. Seul Netlify reçoit les envois.

## Design : « éditorial épuré » + effets de la première version

C'est un mélange voulu par Adrien. La mise en page est éditoriale : très grande typographie, beaucoup d'espace, de fins traits de séparation (`.hair`), des étiquettes numérotées (`.label` avec `<b>01</b>`). Les effets marquants viennent de la première version :
- le **fond en grille lumineuse** (`js/grid.js`, réglages `--grid-*` dans `css/site.css`) : cases vertes sous la souris sur ordinateur et sous le doigt sur mobile (traînée d'origine du composant : portée 2,6 cases, densité 1), onde ronde au clic ou au toucher, cases qui s'allument seules. Derrière les textes posés sur le fond, les cases restent faibles. Les blocs listés dans `SKIP` sont ignorés ;
- le **globe 3D des avis** (cobe) dans la section « Pourquoi choisir Oxalis », à la place de l'ancien schéma de zone. La carte de l'avis s'affiche dessous quand `avis.json` contient des avis ;
- le **grand logo OXALIS en pixels** tout en bas du pied de page (`js/pixmark.js`). Les carrés sont lus dans `assets/oxalis-logo.png`. Sous la souris ou le doigt, ils s'écartent, passent au vert et « buguent » avec des bandes décalées ; un clic envoie une onde de choc ;
- les **mini-sites des autres métiers** sous le site exemple, avec une page qui défile au survol ;
- le **cerveau** dans la carte Automatisation de `/tarifs/` et le **réseau** dans la colonne contact de `/devis/` ;
- les **cartes qui s'inclinent** sous la souris (`data-tilt`).

**Mode jour / mode nuit :**
- Le bouton rond soleil / lune de l'en-tête (`[data-theme-toggle]`) change le thème.
- Un petit script dans `<head>` pose `data-theme="dark"` ou `"light"` sur `<html>` avant l'affichage : choix enregistré, sinon réglage de l'appareil.
- Les couleurs du mode jour sont dans le bloc « Mode jour » à la fin de `css/site.css` (variables redéfinies sous `:root[data-theme="light"]`, puis quelques retouches).
- `--accent-big` est la couleur des grands textes verts : vert sauge la nuit, vert plus foncé le jour pour rester lisible.
- Le logo existe en deux versions (`.logo-d` la nuit, `.logo-l` le jour). Le globe change de couleurs selon le thème (`js/visuels.js`). La maquette, le site exemple et les visuels cerveau et réseau restent sombres, comme des écrans.
- Tout nouvel élément doit être vérifié dans les deux thèmes.

**Animations** (`js/site.js`) :
- La classe `.anim` est posée sur `<html>` seulement si « réduire les animations » n'est pas demandé. Sans elle, tout est visible et immobile.
- `[data-tilt]` : carte qui s'incline sous la souris, avec un reflet vert.
- `[data-rv]` : apparition au défilement (`data-rv="line"` pour un trait qui se dessine). `--d` règle le décalage.
- `[data-split]` : titre découpé en mots qui montent un à un.
- `[data-scrub]` : texte qui s'éclaire mot à mot au fil du défilement (le constat).
- Le constat : la phrase à gauche (fixe pendant le défilement sur ordinateur), et à droite les 3 cartes de la première version avec leurs icônes animées (horloge, loupe, papiers).
- Hero : titre centré sur deux phrases (la seconde en vert), phrase, boutons et 3 garanties, sur toute la hauteur du premier écran. Adrien ne veut pas qu'un site d'exemple soit la première chose vue (le portable qui le montrait a été retiré). Il va envoyer des sites modèles pour retravailler ce haut de page.
- **Intro de l'accueil** (inspirée du site King River) : écran bleu nuit, les lettres d'OXALIS (découpées dans `assets/oxalis-logo.png` par masque CSS) montent depuis le centre, un fin trait se remplit, les lettres redescendent, puis l'écran se lève comme un rideau (≈ 3 s). Un script dans le `<head>` de l'accueil pose `has-intro` sur `<html>` seulement à l'arrivée depuis un autre site, sans ancre dans l'adresse, et sans « réduire les animations » ; rien n'est enregistré. Les animations du hero attendent la fin du rideau (`--intro-d`). Attention : ne jamais nommer la classe de `<html>` comme celle du calque (`.intro`), sinon toute la page est masquée.
- Bandeau défilant (`.marquee`) qui accélère quand on fait défiler la page.
- Services : colonne de gauche fixe, compteur 01/03 et barre de progression. Le grand numéro du bloc actif se remplit de vert.
- Exemple d'automatisation (`[data-flow]`) : la ligne se remplit et les étapes s'allument au fil du défilement.
- Méthode : barres qui se remplissent l'une après l'autre.
- Réalisations : la fenêtre du site exemple se redresse en arrivant (`.emb-stage`).
- Zone d'intervention : cercles qui se dessinent et ondes autour de Reims.
- En-tête qui se cache en descendant et revient en remontant. Menu mobile plein écran.
- Boutons `[data-magnet]` aimantés, uniquement avec une souris.

**Pièges à éviter :**
- Un seul `<h1>` par page, et des identifiants uniques.
- Les classes du site exemple sont préfixées `mx-`. Ses interactions (menu, types de travaux, avant/après, faux formulaire) sont dans `js/site.js`, bloc « Site exemple intégré ».
- Un élément qui s'ouvre ou se ferme est un vrai `<button>` avec `aria-expanded`.
- Le panneau Mentions légales est copié à la fin de chaque page (style, balisage et script). Il s'ouvre avec tout lien vers `#mentions-legales` ou `#mentions-legales-donnees`.
- En-tête, menu mobile, pied de page et panneau Mentions légales sont **identiques dans les trois pages**. Une modification se fait dans les trois fichiers.

## Sections de l'accueil (dans l'ordre)

Hero (titre centré) → bandeau défilant → Le constat `#constat` → Services `#services` → Nos services `#nos-services` (Sites internet / Automatisations + exemple d'automatisation) → Méthode `#methode` → Réalisations `#realisations` (site exemple « Maçonnerie & Rénovation », entreprise fictive, puis les mini-sites « Autres métiers ») → Pourquoi `#pourquoi` (4 raisons + zone d'intervention avec le globe des avis) → FAQ `#faq` (accordéon néo-brutaliste, une seule question ouverte à la fois grâce à `name="faq"`) → Contact `#contact` → pied de page. Le formulaire est sur `/devis/`, les offres sur `/tarifs/`.

## Avis Google sur le globe (avis.json)

Google ne donne pas la ville des auteurs d'avis, et son API demanderait une clé et un service tiers : les avis sont donc **copiés à la main** dans `avis.json`, à la racine du site. Il ne faut **jamais inventer d'avis** : seulement de vrais avis Google d'Adrien, avec l'accord implicite de leur publication publique sur Google.

```json
{
  "lienGoogle": "https://g.page/r/…",
  "avis": [
    {
      "nom": "Prénom N.",
      "ville": "Reims",
      "pays": "FR",
      "lat": 49.26,
      "lng": 4.03,
      "note": 5,
      "texte": "Le texte de l'avis, tel qu'il est sur Google.",
      "date": "2026-11",
      "lien": "https://…lien vers l'avis sur Google (facultatif)"
    }
  ]
}
```

- `nom`, `ville`, `lat`, `lng` et `texte` sont obligatoires. Un avis incomplet est ignoré.
- Coordonnées de quelques villes : Reims 49.26 / 4.03, Épernay 49.04 / 3.96, Châlons-en-Champagne 48.96 / 4.36, Charleville-Mézières 49.77 / 4.72, Troyes 48.30 / 4.08, Paris 48.86 / 2.35.
- Le globe affiche Reims en vert, une pastille avec les initiales de chaque client (pas de photo, pour ne rien charger depuis Google), et la carte de l'avis mis en avant. Le défilement est automatique toutes les ~5 s ; survol, clic, flèches ‹ › et glisser pour tourner.
- `lienGoogle` (fiche Google d'Adrien) ajoute le lien « Tous nos avis Google ».
- Pour tester sans publier, intercepter `/avis.json` dans le navigateur de test : ne jamais pousser d'avis d'essai.

## Formulaire de devis (Netlify Forms) — sur la page /devis/

- La balise `<form name="devis" method="POST" data-netlify="true" netlify-honeypot="bot-field">` contient le champ caché `form-name=devis` et un champ anti-spam `bot-field`.
- Champs (3 blocs : Vous / Votre entreprise / Votre projet) : `nom`, `telephone`, `email`, `preference_contact`, `entreprise`, `metier`, `taille`, `commune`, `besoins` (champ caché rempli en JS avec les cases `[data-besoin]` cochées), `site_actuel`, `site_url`, `delai`, `message`. Le nom et le message sont obligatoires, plus un téléphone **ou** un e-mail (vérifié dans `js/site.js`, bloc « Formulaire de devis »). Un nouveau champ doit avoir un `name` unique et être ajouté à « Données collectées » dans les mentions légales.
- L'envoi se fait par `fetch('/')` en `application/x-www-form-urlencoded`, sans recharger la page. Pendant l'envoi : bouton désactivé et « Envoi en cours… ». En cas de succès, le formulaire est remplacé par « Merci, votre demande a bien été envoyée. Je vous réponds sous 24 h. ». En cas d'échec : « L'envoi n'a pas fonctionné. Écrivez-moi directement à contact@agence-oxalis.fr. »
- Dans Netlify, il faut activer la détection des formulaires (Forms) et configurer une notification par e-mail vers contact@agence-oxalis.fr.

## Informations de référence (à garder cohérentes partout)

- **Contact :** contact@agence-oxalis.fr · 06 67 86 48 85 (`tel:+33667864885`) · LinkedIn https://www.linkedin.com/in/adrien-eloy-a9698928a/
- **Éditeur :** Adrien Eloy, entrepreneur individuel, 24 rue Jane Addams, 51430 Bezannes · SIRET 130 950 876 00016 · TVA non applicable, art. 293 B du CGI
- **Hébergeur :** Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis
- **Prix :** **aucun prix affiché sur le site**, c'est le choix d'Adrien, car chaque demande est particulière. Tout est « sur devis » : site vitrine (maintenance comprise) et automatisation. Ne jamais remettre de montant, ni dans les textes, ni dans la FAQ, ni dans les balises meta.
- **Maintenance :** 6 mois minimum, puis sans engagement.
- **Délais :** site livré en **5 jours** · réponse aux messages sous **24 h** · devis gratuit sous **48 h**
- **Zone :** sur place à Reims, dans la Marne et le Grand Est · à distance partout en France

Si une de ces informations change, mettez à jour **toutes** ses occurrences : texte, FAQ, meta description, balises og:, mentions légales.

## Règles à respecter

- **Contenu :**
  - Ne jamais dire que l'agence est récente.
  - N'inventer aucun chiffre, aucun avis client, aucun logo client et aucune réalisation présentée comme réelle. Le site exemple est indiqué comme fictif.
  - Ne faire aucune promesse non prouvée, par exemple « première place Google ».
- **RGPD et cookies :** le site n'utilise **aucun cookie, aucun traceur et aucun service tiers**, puisque les polices sont hébergées sur le site. Seule exception, voulue par Adrien : le choix jour / nuit, enregistré dans `localStorage` sous la clé `oxalis-theme`, et seulement quand le visiteur utilise le bouton. Les mentions légales (partie Cookies) le disent. Aucun autre stockage navigateur n'est permis. Ajouter un outil tiers (statistiques, Google Fonts, carte, vidéo…) oblige à mettre à jour la partie Données personnelles ou Cookies, et parfois à ajouter un bandeau de consentement.
- **Accessibilité :**
  - Textes alternatifs sur les images (`alt=""` si l'image est décorative), contrastes AA, navigation au clavier, lien « Aller au contenu ».
  - Vrais `<button>` avec `aria-expanded` / `aria-controls` pour tout ce qui s'ouvre et se ferme.
- **Design :**
  - Fond `#0b1220`, surfaces `#18202a` et `#222c38`, bordures `#354253`, traits fins `rgba(238,241,242,.1)`.
  - Accent vert sauge : `#7cc79b` et `#8fd0aa`. Texte : `#eef1f2`, texte secondaire `#aab5c1`.
  - Polices : Sora pour les titres, Geist pour le texte, Geist Mono pour les étiquettes.
  - Réutiliser les classes et les variables de `css/site.css` (`.btn`, `.label`, `.h-xl`, `.ticks`, `--ease`…).
- **Mobile d'abord :** tester à 320, 390, 768, 1024 et 1440 px de large, sans aucun défilement horizontal.

## Mise en ligne

- **Projet Netlify :** `oxalis-pro` (site ID `79027017-1461-414b-b10b-e070cef2efb6`), servi sur https://agence-oxalis.fr.
- **Le dépôt GitHub n'est pas relié à Netlify, volontairement.** Sur l'offre gratuite, Netlify bloque les déploiements d'un dépôt privé qui reçoit des commits poussés par Claude (« Build blocked: unrecognized Git contributor »). GitHub garde seulement l'historique.
- **Pour publier :**
  1. Pousser sur `main`, sans ligne `Co-Authored-By` dans les commits de ce dépôt.
  2. Utiliser l'outil Netlify `deploy-site` avec ce site ID.
  3. Lancer la commande `npx @netlify/mcp …` qu'il renvoie depuis une copie propre du dossier (`git archive HEAD`), puis vérifier que le déploiement est `ready`.
- Toujours demander l'accord d'Adrien avant de mettre en ligne.
- Après un changement du formulaire, vérifier que « devis » apparaît dans Forms et envoyer une demande de test.
