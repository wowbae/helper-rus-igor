import { configureStore } from '@reduxjs/toolkit';
import { dataAPI } from './api';
import authReducer from './auth-slice';
import { setupListeners } from '@reduxjs/toolkit/query';


export const store = configureStore({
    reducer: {
        // telegram: telegramReducer,
        [dataAPI.reducerPath]: dataAPI.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(dataAPI.middleware),
});

// Настройка listeners для RTK Query (опционально)
setupListeners(store.dispatch);

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
