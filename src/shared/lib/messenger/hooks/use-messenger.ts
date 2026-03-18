import { useContext } from 'react';
import { MessengerContext } from '../messenger-provider';

export function useMessenger() {
    return useContext(MessengerContext);
}
