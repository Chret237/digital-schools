// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projetReducer from "./slices/projetSlice";
import tacheReducer from "./slices/tacheSlice";
import invitationReducer from "./slices/invitationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projets: projetReducer,
    taches: tacheReducer,
    invitations: invitationReducer,
  },
});

export default store;
