// store/slices/projetSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProjets = createAsyncThunk('projets/fetchAll', async (params = {}) => {
  const { data } = await api.get('/projets', { params });
  return data;
});

export const fetchProjet = createAsyncThunk('projets/fetchOne', async (id) => {
  const { data } = await api.get(`/projets/${id}`);
  return data;
});

export const createProjet = createAsyncThunk('projets/create', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projets', payload);
    return data.projet;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateProjet = createAsyncThunk('projets/update', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projets/${id}`, payload);
    return data.projet;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteProjet = createAsyncThunk('projets/delete', async (id) => {
  await api.delete(`/projets/${id}`);
  return id;
});

const projetSlice = createSlice({
  name: 'projets',
  initialState: { list: [], current: null, pagination: null, loading: false, error: null },
  reducers: {
    clearCurrent(state) { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjets.pending, (s) => { s.loading = true; })
      .addCase(fetchProjets.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.projets; s.pagination = a.payload.pagination; })
      .addCase(fetchProjets.rejected, (s) => { s.loading = false; })
      .addCase(fetchProjet.pending, (s) => { s.loading = true; })
      .addCase(fetchProjet.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchProjet.rejected, (s) => { s.loading = false; })
      .addCase(createProjet.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(updateProjet.fulfilled, (s, a) => {
        const idx = s.list.findIndex(p => p.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
        if (s.current?.projet?.id === a.payload.id) s.current.projet = a.payload;
      })
      .addCase(deleteProjet.fulfilled, (s, a) => { s.list = s.list.filter(p => p.id !== a.payload); });
  },
});

export const { clearCurrent } = projetSlice.actions;
export default projetSlice.reducer;
