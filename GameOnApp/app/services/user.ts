import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';


export async function deleteUserData(userId: string) {
    try {
        // Log the deletion process
        console.log('Starting user data deletion...');

        // Delete user document
        await deleteDoc(doc(db, 'users', userId));
        console.log('User document deleted');

        // Delete user scores
        await deleteDoc(doc(db, 'scores', userId));
        console.log('User scores deleted');

        return true;
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
}

// Add other user-related functions here 