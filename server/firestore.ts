import { Firestore } from '@google-cloud/firestore';

let firestoreClient: Firestore | null = null;
let firestoreInitialized = false;

/**
 * Checks whether Firestore should be enabled.
 * Firestore is activated if:
 * 1. Explicitly enabled via FIRESTORE_ENABLED=true
 * 2. Running in Google Cloud Run (detected via K_SERVICE environment variable)
 * 3. GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT is set
 */
export function isFirestoreConfigured(): boolean {
    if (process.env.FIRESTORE_DISABLED === 'true') {
        return false;
    }
    return (
        process.env.FIRESTORE_ENABLED === 'true' ||
        Boolean(process.env.K_SERVICE) ||
        Boolean(process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT)
    );
}

/**
 * Initializes and returns the Firestore client singleton.
 * On Google Cloud Run, it automatically uses Application Default Credentials (ADC).
 * Locally, it can use GOOGLE_APPLICATION_CREDENTIALS or gcloud credentials.
 */
export function getFirestore(): Firestore | null {
    if (firestoreInitialized) {
        return firestoreClient;
    }
    firestoreInitialized = true;

    if (!isFirestoreConfigured()) {
        console.log('[Firestore] Cloud Firestore not configured. Falling back to local disk persistence.');
        return null;
    }

    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || undefined;
        firestoreClient = new Firestore({
            projectId,
            ignoreUndefinedProperties: true,
        });
        console.log(`[Firestore] Initialized Firestore client (Project: ${projectId || 'default'}).`);
        return firestoreClient;
    } catch (err) {
        console.warn('[Firestore] Could not initialize Firestore client, falling back to local storage:', err);
        firestoreClient = null;
        return null;
    }
}

const COLLECTION_NAME = 'astraminds_app';
const STATE_DOC_ID = 'main_store';

/**
 * Loads the complete store state from Firestore.
 */
export async function loadStateFromFirestore(): Promise<any | null> {
    const db = getFirestore();
    if (!db) return null;

    try {
        const docRef = db.collection(COLLECTION_NAME).doc(STATE_DOC_ID);
        const snapshot = await docRef.get();
        if (!snapshot.exists) {
            console.log('[Firestore] No existing state document found in Firestore. Will initialize from seed data.');
            return null;
        }

        const data = snapshot.data();
        if (!data || !Array.isArray(data.users)) {
            console.warn('[Firestore] State document exists but is invalid. Falling back.');
            return null;
        }

        console.log(`[Firestore] Successfully loaded state from Firestore (${data.users?.length || 0} users, ${data.trackerTransactions?.length || 0} transactions, ${data.goals?.length || 0} goals).`);
        return data;
    } catch (err) {
        console.error('[Firestore] Error loading state from Firestore:', err);
        return null;
    }
}

/**
 * Saves the store state to Firestore.
 */
export async function saveStateToFirestore(payload: any): Promise<boolean> {
    const db = getFirestore();
    if (!db) return false;

    try {
        const docRef = db.collection(COLLECTION_NAME).doc(STATE_DOC_ID);
        await docRef.set({
            ...payload,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        return true;
    } catch (err) {
        console.error('[Firestore] Failed to save state to Firestore:', err);
        return false;
    }
}
