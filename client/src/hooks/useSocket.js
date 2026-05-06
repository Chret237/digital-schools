// hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addInvitationSocket } from '../store/slices/invitationSlice';
import { updateTacheFromSocket } from '../store/slices/tacheSlice';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket(projetId = null) {
  const dispatch = useDispatch();
  const { token, user } = useSelector(s => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join personal room for notifications
      socket.emit('join_user', user.id);
      // Join project room if viewing a project
      if (projetId) socket.emit('join_project', projetId);
    });

    // Real-time: new invitation received
    socket.on('nouvelle_invitation', ({ invitation, projet, invite_par }) => {
      dispatch(addInvitationSocket({ ...invitation, projet_titre: projet.titre, invite_par_nom: invite_par.nom }));
      toast(`${invite_par.nom} vous a invité dans "${projet.titre}"`, {
        duration: 6000,
        icon: <FontAwesomeIcon icon={faEnvelope} />,
      });
    });

    // Real-time: task status changed by another user
    socket.on('tache_statut_change', (tache) => {
      dispatch(updateTacheFromSocket(tache));
    });

    // Real-time: invitation accepted (notify project room)
    socket.on('invitation_acceptee', ({ utilisateur }) => {
      toast.success(`${utilisateur.nom} a rejoint le projet !`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (projetId) socket.emit('leave_project', projetId);
      socket.disconnect();
    };
  }, [token, user, projetId, dispatch]);

  return socketRef.current;
}

// Also update server index.js to handle join_user room
export default useSocket;
