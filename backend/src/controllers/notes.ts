import { Request, Response } from 'express';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { search, tag } = req.query;

    let whereClause: any = {
      authorId: userId,
      isArchived: false,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { content: { contains: String(search) } }
      ];
    }

    if (tag) {
      whereClause.tags = {
        some: {
          tag: {
            name: String(tag)
          }
        }
      };
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        tags: {
          include: { tag: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedNotes = notes.map(note => ({
      ...note,
      tags: note.tags.map(nt => nt.tag)
    }));

    res.status(200).json(formattedNotes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, authorId: userId },
      include: {
        tags: { include: { tag: true } }
      }
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.status(200).json({
      ...note,
      tags: note.tags.map(nt => nt.tag)
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { title, content } = req.body;

    const note = await prisma.note.create({
      data: {
        title: title || 'Untitled',
        content: content || '',
        authorId: userId
      }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, content, isArchived, newTags } = req.body;

    // Check ownership
    const existing = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    let updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    // Handle tags if provided
    if (newTags && Array.isArray(newTags)) {
      // Clear existing tags
      await prisma.noteTag.deleteMany({ where: { noteId: id } });
      
      // Add new tags
      for (const tagName of newTags) {
        let tag = await prisma.tag.findUnique({
          where: { name_userId: { name: tagName, userId } }
        });
        
        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName, userId }
          });
        }
        
        await prisma.noteTag.create({
          data: { noteId: id, tagId: tag.id }
        });
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
      include: { tags: { include: { tag: true } } }
    });

    res.status(200).json({
      ...updatedNote,
      tags: updatedNote.tags.map(nt => nt.tag)
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await prisma.note.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const shareNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (existing.shareId) {
       res.status(200).json({ shareId: existing.shareId });
       return;
    }

    const shareId = uuidv4();
    await prisma.note.update({
      where: { id },
      data: { shareId }
    });

    res.status(200).json({ shareId });
  } catch (error) {
    console.error('Share note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unshareNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await prisma.note.update({
      where: { id },
      data: { shareId: null }
    });

    res.status(200).json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('Unshare note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSharedNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;

    const note = await prisma.note.findUnique({
      where: { shareId },
      include: { author: { select: { name: true } } }
    });

    if (!note) {
      res.status(404).json({ error: 'Shared note not found' });
      return;
    }

    res.status(200).json(note);
  } catch (error) {
    console.error('Get shared note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
