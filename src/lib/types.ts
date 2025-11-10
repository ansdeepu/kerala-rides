export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    createdAt: any; // Can be a Date object or a Firestore Timestamp
}
