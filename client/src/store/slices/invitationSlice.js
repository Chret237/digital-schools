// store/slices/invitationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMesInvitations = createAsyncThunk('invitations/fetchMes', async () => {
  const { data } = await api.get('/invitations/mes-invitations');
  return data;
});

export const accepterInvitation = createAsyncThunk('invitations/accepter', async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/invitations/${id}/accepter`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const refuserInvitation = createAsyncThunk('invitations/refuser', async (id, { rejectWithValue }) => {
  try {
    await api.patch(`/invitations/${id}/refuser`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const envoyerInvitation = createAsyncThunk('invitations/envoyer', async ({ projetId, utilisateur_id, message }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projets/${projetId}/invitations`, { utilisateur_id, message });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchInvitationsProjet = createAsyncThunk('invitations/fetchProjet', async (projetId) => {
  const { data } = await api.get(`/projets/${projetId}/invitations`);
  return { projetId, invitations: data.invitations };
});

export const annulerInvitation = createAsyncThunk('invitations/annuler', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/invitations/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const invitationSlice = createSlice({
  name: 'invitations',
  initialState: {
    mesInvitations: [],
    enAttente: 0,
    parProjet: {},  // { [projetId]: [invitations] }
    loading: false,
  },
  reducers: {
    addInvitationSocket(state, action) {
      state.mesInvitations.unshift(action.payload);
      state.enAttente += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMesInvitations.pending, (s) => { s.loading = true; })
      .addCase(fetchMesInvitations.fulfilled, (s, a) => {
        s.loading = false;
        s.mesInvitations = a.payload.invitations;
        s.enAttente = a.payload.en_attente;
      })
      .addCase(accepterInvitation.fulfilled, (s, a) => {
        const inv = s.mesInvitations.find(i => i.id === a.payload);
        if (inv) { inv.statut = 'acceptee'; s.enAttente = Math.max(0, s.enAttente - 1); }
      })
      .addCase(refuserInvitation.fulfilled, (s, a) => {
        const inv = s.mesInvitations.find(i => i.id === a.payload);
        if (inv) { inv.statut = 'refusee'; s.enAttente = Math.max(0, s.enAttente - 1); }
      })
      .addCase(annulerInvitation.fulfilled, (s, a) => {
        // Remove from projet invitations
        Object.keys(s.parProjet).forEach(pid => {
          s.parProjet[pid] = s.parProjet[pid].filter(i => i.id !== a.payload);
        });
      })
      .addCase(fetchInvitationsProjet.fulfilled, (s, a) => {
        s.parProjet[a.payload.projetId] = a.payload.invitations;
      });
  },
});

export const { addInvitationSocket } = invitationSlice.actions;
export default invitationSlice.reducer;
