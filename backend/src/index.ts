import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import insightsRoutes from './routes/insights';
import aiRoutes from './routes/ai';
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/ai', aiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Peblo Notes API is running');
});

// Socket.io for Realtime collaboration
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-note', (noteId) => {
    socket.join(noteId);
    console.log(`Socket ${socket.id} joined note ${noteId}`);
  });

  socket.on('leave-note', (noteId) => {
    socket.leave(noteId);
  });

  socket.on('note-change', ({ noteId, delta }) => {
    socket.to(noteId).emit('receive-note-change', delta);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
