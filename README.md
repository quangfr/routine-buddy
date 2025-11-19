### 🌱 Habitube — Les petites habitudes qui changent tout

**Habitube, c’est ton jardin d’habitudes partagées 🌿**

🙋‍♀️🙋‍♂️ **Pour qui ?**  
• Colocs, familles, classes, associations, bureaux…  
• Tous ceux qui veulent mieux s’organiser sans se prendre la tête  

✨ **Ce que ça fait**  
• Tu transformes les petites tâches du quotidien en habitudes visibles (rangement, linge, frigo, salle de classe…)  
• Chaque membre devient jardinier : il choisit ses habitudes, les réalise, aide les autres  
• L’app suit les progrès à la semaine et montre qui contribue, combien d’heures, et sur quoi  
• Tout est présenté comme un jardin vivant plutôt qu’une to-do list stressante  

💚 **La promesse**  
Moins de “Qui devait faire ça déjà ?”, plus de clarté, de partage et de douceur dans la gestion du quotidien.

--

### 🌱 Habitube — Small habits, big change

**Habitube is your shared habit garden 🌿**

🙋‍♀️🙋‍♂️ **Who is it for?**  
• Roommates, families, classrooms, associations, teams…  
• Anyone who wants smoother organization without the mental load  

✨ **What it does**  
• Turns everyday tasks into clear habits (cleaning, laundry, fridge check, classroom setup…)  
• Everyone becomes a gardener: choose habits, complete them, support others  
• Tracks weekly progress: who contributes, how much time, and on what  
• A living garden metaphor instead of a stressful to-do list  

💚 **The promise**  
Less “Who was supposed to do this?”, more clarity, teamwork, and calm in shared daily life.

## 📦 Import `library.js` into Firestore

The app now ships with the habit library baked into `public/library.js` and still keeps a hash in `libraryMeta/import` to avoid double imports. To push `library.js` into Firestore once:

1. Install the Firestore admin SDK (if not already available):  
   `npm install firebase-admin`
2. Obtain a service account key and set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` or pass `--serviceAccount=/path/to/key.json`.  
3. Run the importer from the repo root:
   ```
   node scripts/import-library.js --projectId=my-project-id
   ```
   Use `--libraryPath` to point to a different file (it accepts either `.js` or `.json`), `--dry-run` to preview without writing, or `--force` to re-import even if the existing hash matches.

The script wipes `libraryHabits`, writes each habit under `/libraryHabits/{id}`, and records the import hash so subsequent runs skip unchanged data.

### ⚙️ Automating via GitHub Actions

A `workflow_dispatch` workflow (`.github/workflows/import-library.yml`) runs the same importer when you trigger it from GitHub. Provide the secrets `FIREBASE_SERVICE_ACCOUNT` (JSON key) and `FIREBASE_PROJECT_ID`, then launch the workflow from the Actions tab. You can optionally pass `dry_run` or `force` inputs to preview or re-run even if the hash matches.

## 🧭 Spécification technique

### Contexte & architecture
- Tout est encapsulé dans `public/index.html`, qui contient les styles, la configuration Firebase (`const HABITU_FIREBASE_CONFIG`) et le `div#app` qui alimente la barre supérieure, les commandes de date, la liste `main#home` et le panel détail/tab (`section#detail`). (`public/index.html:14`, `public/index.html:2271`, `public/index.html:2290`, `public/index.html:2295`)
- La seconde vue d’espace (`section#space`) propose des onglets de réglages, d’historique et de préférences pour chaque jardin partagé. (`public/index.html:2414`)
- Le manifeste PWA (`manifest.webmanifest`) expose le nom, l’icône et le mode standalone, tandis qu’un service worker (`service-worker.js`) met en cache les actifs essentiels et est enregistré/rafraîchi automatiquement via le script principal pour garantir l’accès hors ligne et les mises à jour. (`public/manifest.webmanifest:1`, `public/service-worker.js:1`, `public/index.html:8541`)

### Données & synchronisation
- Les fonctions `persistUserProfile`, `persistSpaceDoc`, `persistHabit`, `persistInviteDoc` et `sendActivityToServer` écrivent respectivement dans les collections `users`, `spaces`, `spaces/{spaceId}/habits`, `invites` et `activities`, puis `loadHabitsForSpace`, `loadActivitiesForSpace` et `fetchSpacesForUser` reconstruisent les états locaux. (`public/index.html:4410`, `public/index.html:4508`, `public/index.html:4524`, `public/index.html:4536`, `public/index.html:4550`, `public/index.html:4599`, `public/index.html:4632`, `public/index.html:4692`, `public/index.html:4718`)
- Les résumés d’activité sont conservés localement dans des Maps et dans `localStorage` (`ACTIVITY_SUMMARY_*`), ce qui permet de recalculer les classements sans relire l’historique complet à chaque fois. (`public/index.html:3239`, `public/index.html:3268`)
- La bibliothèque de routines peut provenir soit du fichier embarqué `public/library.js`, soit de la collection `libraryHabits` ; elle est normalisée dans `LIBRARY_HABITS` au moment du chargement. (`public/library.js:1`, `public/index.html:4871`)
- Les pseudos aléatoires utilisent les listes de `NAMES_LIBRARY_DATA` pour produire des noms champêtres en cas de besoin. (`public/names.js:1`)
- Les règles Firestore limitent la lecture/écriture aux propriétaires/membres des espaces, contrôlent les invitations, restreignent les profils aux identifiants de connexion et laissent la bibliothèque en lecture seule. (`firestore.rules:57`, `firestore.rules:71`, `firestore.rules:95`, `firestore.rules:110`, `firestore.rules:114`)
- L’index `activities(spaceId, recordedAt)` accélère les requêtes de journalisation des habitudes. (`firestore.indexes.json:4`)
- Le script `scripts/import-library.js` importe le fichier de bibliothèque en batch, stocke son hash dans `libraryMeta/import` et refuse toute réimportation identique sauf `--force`. (`scripts/import-library.js:74`, `scripts/import-library.js:89`, `scripts/import-library.js:114`)

### Interface & interactions
- La barre supérieure propose le basculement de jardin, la navigation date (`prevDay`, `nextDay`) et l’ouverture du menu principal, tandis que `#habitFilterBar` régule les filtres “À faire / Fait / Caché”. (`public/index.html:2271`, `public/index.html:2280`, `public/index.html:2290`, `public/index.html:2809`)
- La vue détail permet d’éditer le nom, la note et la récurrence d’une habitude (jours de la semaine, intervalles, plages) et de consulter les jardiniers ou les paramètres avancés. (`public/index.html:2295`)
- Une section “Espace” expose des classements, un calendrier d’activité et des préférences pour le jardin partagé. (`public/index.html:2414`)
- Plusieurs modales soutiennent les actions complémentaires : menu principal, invitation, bibliothèque, création de jardin et joining. (`public/index.html:2526`, `public/index.html:2585`, `public/index.html:2622`, `public/index.html:2636`)
- Les données de bibliothèque et de pseudo alimentent les suggestions de cartes et le générateur de pseudo sans dépendance serveur supplémentaire. (`public/library.js:1`, `public/names.js:1`)

### Règles techniques
- Le service worker suit une stratégie “network first”, met en cache les ressources listées, gère `SKIP_WAITING`, permet d’effacer les caches à la demande et recharge l’application dès que le nouveau worker prend la main. (`public/service-worker.js:1`, `public/service-worker.js:48`, `public/index.html:8541`)
- Firestore impose des vérifications d’appartenance pour `spaces`, `habits`, `activities`, `users`, `invites` et laisse `libraryHabits` lisible par tous. (`firestore.rules:57`, `firestore.rules:67`, `firestore.rules:71`, `firestore.rules:95`, `firestore.rules:110`, `firestore.rules:114`)
- L’importeur de bibliothèque vérifie le hash, purge les documents existants, écrit en batch et met à jour la métadonnée (`libraryMeta/import`). (`scripts/import-library.js:74`, `scripts/import-library.js:89`, `scripts/import-library.js:114`)
