import { Request, Response } from 'express';
import { prisma } from '../index';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

export const generateSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const note = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      // Mock response if no API key
      res.status(200).json({ result: "This is a mocked AI summary because GEMINI_API_KEY is not set." });
      return;
    }

    const prompt = `Summarize the following note content concisely:\n\n${note.content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summary = response.text;

    await prisma.aILog.create({
      data: { userId, actionType: 'SUMMARY' }
    });

    res.status(200).json({ result: summary });
  } catch (error) {
    console.error('AI summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

export const generateActionItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const note = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(200).json({ result: "- Mock Action 1\n- Mock Action 2" });
      return;
    }

    const prompt = `Extract actionable items from the following note as a bulleted list. If there are no obvious action items, suggest a few based on the context:\n\n${note.content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const actionItems = response.text;

    await prisma.aILog.create({
      data: { userId, actionType: 'ACTION_ITEMS' }
    });

    res.status(200).json({ result: actionItems });
  } catch (error) {
    console.error('AI action items error:', error);
    res.status(500).json({ error: 'Failed to extract action items' });
  }
};

export const generateTitle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const note = await prisma.note.findFirst({ where: { id, authorId: userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(200).json({ result: "Mock Generated Title" });
      return;
    }

    const prompt = `Generate a short, catchy title (max 6 words) for the following note content. Return ONLY the title, no quotes or prefix:\n\n${note.content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const title = response.text?.replace(/["']/g, '').trim();

    await prisma.aILog.create({
      data: { userId, actionType: 'TITLE' }
    });

    res.status(200).json({ result: title });
  } catch (error) {
    console.error('AI title error:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
};
