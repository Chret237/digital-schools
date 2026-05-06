// store/slices/tacheSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTaches = createAsyncThunk('taches/fetchAll', async ({ projetId, params = {} }) => {
  const { data } = await api.get(`/projets/${projetId}/taches`, { params });
  return data.taches;
});

export const createTache = createAsyncThunk('taches/create', async ({ projetId, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projets/${projetId}/taches`, payload);
    return data.tache;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateStatut = createAsyncThunk('taches/updateStatut', async ({ id, statut }) => {
  const { data } = await api.patch(`/taches/${id}/statut`, { statut });
  return data.tache;
});

export const updateTache = createAsyncThunk('taches/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/taches/${id}`, payload);
    return data.tache;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteTache = createAsyncThunk('taches/delete', async (id) => {
  await api.delete(`/taches/${id}`);
  return id;
});

export const addCommentaire = createAsyncThunk('taches/addComment', async ({ id, contenu }) => {
  const { data } = await api.post(`/taches/${id}/commentaires`, { contenu });
  return { tacheId: id, commentaire: data.commentaire };
});

const tacheSlice = createSlice({
  name: 'taches',
  initialState: { list: [], loading: false },
  reducers: {
    clearTaches(state) { state.list = []; },
    updateTacheFromSocket(state, action) {
      const idx = state.list.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaches.pending, (s) => { s.loading = true; })
      .addCase(fetchTaches.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchTaches.rejected, (s) => { s.loading = false; })
      .addCase(createTache.fulfilled, (s, a) => { s.list.push(a.payload); })
      .addCase(updateStatut.fulfilled, (s, a) => {
        const idx = s.list.findIndex(t => t.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(updateTache.fulfilled, (s, a) => {
        const idx = s.list.findIndex(t => t.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(deleteTache.fulfilled, (s, a) => { s.list = s.list.filter(t => t.id !== a.payload); });
  },
});

export const { clearTaches, updateTacheFromSocket } = tacheSlice.actions;
export default tacheSlice.reducer;
