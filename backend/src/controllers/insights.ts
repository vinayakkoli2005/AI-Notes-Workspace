import { Request, Response } from 'express';
import { prisma } from '../index';

export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const totalNotes = await prisma.note.count({ where: { authorId: userId, isArchived: false } });
    
    const recentlyEdited = await prisma.note.findMany({
      where: { authorId: userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, updatedAt: true }
    });

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: { select: { notes: true } }
      },
      orderBy: {
        notes: { _count: 'desc' }
      },
      take: 5
    });

    const mostUsedTags = tags.map(t => ({ name: t.name, count: t._count.notes }));

    const aiUsage = await prisma.aILog.count({ where: { userId } });

    res.status(200).json({
      totalNotes,
      recentlyEdited,
      mostUsedTags,
      aiUsage
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
