import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ message: 'No data provided to save.' });
      }

      // Define the folder and file path
      const folderPath = path.join(process.cwd(), 'saved-json');
      const filePath = path.join(folderPath, `data_${Date.now()}.json`);

      // Ensure the folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Write the JSON data to the file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      res.status(200).json({ message: 'JSON file saved successfully!' });
    } catch (error) {
      console.error('Error saving JSON file:', error);
      res.status(500).json({ message: 'Failed to save JSON file.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
