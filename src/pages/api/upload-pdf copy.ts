/**
 * External dependencies
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer, { Multer } from 'multer';

/**
 * Internal dependencies
 */
import { aiPdfHandler } from '@Utils/aiPdfHandler';
import { Schema } from '@Types/schemaTypes';

const upload: Multer = multer({ storage: multer.memoryStorage() });
const uploadMiddleware = upload.single('pdf');

type ExtendedNextApiRequest = NextApiRequest & {
  file: Express.Multer.File;
};

const handler = nextConnect<ExtendedNextApiRequest, NextApiResponse>();

handler.use(uploadMiddleware);

handler.post(async (req, res) => {
  try {
    // Proveri da li je fajl primljen
    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file received' });
    }

    console.log('Received file:', req.file.originalname);

    // Proveri da li je schema primljena
    if (!req.body.schema) {
      console.error('No schema received');
      return res.status(400).json({ error: 'No schema received' });
    }

    let schema: Schema;
    try {
      schema = JSON.parse(req.body.schema);
    } catch (error) {
      console.error('Invalid schema format');
      return res.status(400).json({ error: 'Invalid schema format' });
    }

    // Proveri da li je schema validna
    if (!schema || Object.keys(schema).length === 0) {
      console.error('Schema is empty or invalid');
      return res.status(400).json({ error: 'Schema is empty or invalid' });
    }

    console.log('Parsed schema:', schema);

    // Obrada fajla pomoću AI handler-a
    const aiResponse = await aiPdfHandler(req.file.buffer, schema);

    // Vraćanje uspešnog odgovora
    res.status(200).json({ fileName: req.file.originalname, data: aiResponse });
  } catch (error: any) {
    console.error('Error in upload-pdf:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
