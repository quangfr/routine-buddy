#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const parse = (key) => {
  const prefix = `--${key}=`;
  const found = args.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};
const hasFlag = flag => args.includes(`--${flag}`);

const libraryPath = path.resolve(parse('libraryPath') || 'library.json');
const serviceAccountPath = parse('serviceAccount') || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Missing service account key. Pass --serviceAccount=/path/to/key.json or set GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
const projectId = parse('projectId') || serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('Unable to infer Firebase project ID. Provide --projectId or set it in the service account key.');
  process.exit(1);
}

admin.initializeApp({
  projectId,
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  if (!fs.existsSync(libraryPath)) {
    console.error(`Library file not found at ${libraryPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(libraryPath, 'utf8');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  let library;
  try {
    library = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse library.json:', err.message);
    process.exit(1);
  }
  if (!Array.isArray(library)) {
    console.error('Expected library.json to export an array of habits.');
    process.exit(1);
  }

  const metaRef = db.collection('libraryMeta').doc('import');
  const metaSnap = await metaRef.get();
  const metaData = metaSnap.exists ? metaSnap.data() : null;
  if (metaData?.hash === hash && !hasFlag('force')) {
    console.log('Library already imported (hash matches). Use --force to re-run.');
    return;
  }

  console.log(`Importing ${library.length} habits into project ${projectId}…`);

  if (hasFlag('dry-run')) {
    console.log('Dry run → skipping writes.');
    return;
  }

  const collection = db.collection('libraryHabits');
  const existing = await collection.listDocuments();
  if (existing.length) {
    console.log(`Removing ${existing.length} existing habits…`);
    const deleteBatch = db.batch();
    existing.forEach(doc => deleteBatch.delete(doc));
    await deleteBatch.commit();
  }

  const operations = library.map((habit, index) => {
    const id = String(habit.id || `lib-${index}`);
    const cleaned = { ...habit, id };
    return { id, data: cleaned };
  });

  const chunkSize = 400;
  while (operations.length) {
    const chunk = operations.splice(0, chunkSize);
    const batch = db.batch();
    chunk.forEach(({ id, data }) => {
      batch.set(collection.doc(id), data);
    });
    await batch.commit();
  }

  await metaRef.set({
    hash,
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
    count: library.length,
    sourcePath: libraryPath
  }, { merge: true });

  console.log('Import complete.');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
