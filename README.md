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

## 📦 Import `library.json` into Firestore

The app now reads `libraryHabits` from Firestore and keeps a hash in `libraryMeta/import` to avoid double imports. To push `library.json` into Firestore once:

1. Install the Firestore admin SDK (if not already available):  
   `npm install firebase-admin`
2. Obtain a service account key and set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` or pass `--serviceAccount=/path/to/key.json`.  
3. Run the importer from the repo root:
   ```
   node scripts/import-library.js --projectId=my-project-id
   ```
   Use `--libraryPath` to point to a different JSON file, `--dry-run` to preview without writing, or `--force` to re-import even if the existing hash matches.

The script wipes `libraryHabits`, writes each habit under `/libraryHabits/{id}`, and records the import hash so subsequent runs skip unchanged data.

### ⚙️ Automating via GitHub Actions

A `workflow_dispatch` workflow (`.github/workflows/import-library.yml`) runs the same importer when you trigger it from GitHub. Provide the secrets `FIREBASE_SERVICE_ACCOUNT` (JSON key) and `FIREBASE_PROJECT_ID`, then launch the workflow from the Actions tab. You can optionally pass `dry_run` or `force` inputs to preview or re-run even if the hash matches.
