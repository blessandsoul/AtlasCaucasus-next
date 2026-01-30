import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
    isDrawerOpen: boolean;
    selectedChatId: string | null;
}

const initialState: ChatState = {
    isDrawerOpen: false,
    selectedChatId: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        openDrawer: (state) => {
            state.isDrawerOpen = true;
        },
        closeDrawer: (state) => {
            state.isDrawerOpen = false;
        },
        toggleDrawer: (state) => {
            state.isDrawerOpen = !state.isDrawerOpen;
        },
        selectChat: (state, action: PayloadAction<string>) => {
            state.selectedChatId = action.payload;
            state.isDrawerOpen = true; // Auto open drawer when selecting
        },
        clearSelectedChat: (state) => {
            state.selectedChatId = null;
        },
    },
});

export const { openDrawer, closeDrawer, toggleDrawer, selectChat, clearSelectedChat } = chatSlice.actions;
export default chatSlice.reducer;
