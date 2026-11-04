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
js/site.js              toutes les animations et interactions des trois pages
fonts/                  polices auto-hébergées (woff2) + fonts.css + licences OFL
assets/                 logo blanc/vert transparent + 3 photos du site exemple (webp)
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

## Design « éditorial épuré »

Très grande typographie, beaucoup d'espace, de fins traits de séparation (`.hair`), des étiquettes numérotées (`.label` avec `<b>01</b>`). Le fond est uni bleu nuit, avec un léger grain.

**Animations** (`js/site.js`) :
- La classe `.anim` est posée sur `<html>` seulement si « réduire les animations » n'est pas demandé. Sans elle, tout est visible et immobile.
- `[data-rv]` : apparition au défilement (`data-rv="line"` pour un trait qui se dessine). `--d` règle le décalage.
- `[data-split]` : titre découpé en mots qui montent un à un.
- `[data-scrub]` : texte qui s'éclaire mot à mot au fil du défilement (le constat).
- Hero : lignes du titre qui montent au chargement, titre qui remonte et s'estompe au défilement, lueur verte qui suit doucement la souris.
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

Hero → bandeau défilant → Le constat `#constat` → Services `#services` → Nos services `#nos-services` (Sites internet / Automatisations + exemple d'automatisation) → Méthode `#methode` → Réalisations `#realisations` (site exemple « Maçonnerie & Rénovation », entreprise fictive) → Pourquoi `#pourquoi` (4 raisons + zone d'intervention) → FAQ `#faq` (accordéon néo-brutaliste, une seule question ouverte à la fois grâce à `name="faq"`) → Contact `#contact` → pied de page. Le formulaire est sur `/devis/`, les offres sur `/tarifs/`.

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
- **RGPD et cookies :** le site n'utilise **aucun cookie, aucun traceur et aucun stockage navigateur** (`localStorage`, etc.), et **aucun service tiers**, puisque les polices sont hébergées sur le site. Les mentions légales l'affirment. Ajouter un outil tiers (statistiques, Google Fonts, carte, vidéo…) oblige à mettre à jour la partie Données personnelles ou Cookies, et parfois à ajouter un bandeau de consentement.
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
