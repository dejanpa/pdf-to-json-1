import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, schema } = req.body;

    if (!name || !schema) {
      return res.status(400).json({ message: 'Name and schema are required.' });
    }

    const dynamicSchemasPath = path.join(process.cwd(), 'data', 'dynamicSchemas.json');

    // Proverite da li direktorijum postoji, kreirajte ga ako ne postoji
    const dataDir = path.dirname(dynamicSchemasPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Proverite da li fajl postoji, kreirajte ga ako ne postoji
    if (!fs.existsSync(dynamicSchemasPath)) {
      fs.writeFileSync(dynamicSchemasPath, '{}');
    }

    // Učitajte postojeće šeme, postavite prazan JSON ako je fajl prazan
    let templates: Record<string, any> = {};
    const fileContent = fs.readFileSync(dynamicSchemasPath, 'utf-8');
    if (fileContent.trim()) {
      templates = JSON.parse(fileContent);
    }

    // Dodajte novu šemu
    templates[name] = schema;

    // Snimite šeme u fajl
    fs.writeFileSync(dynamicSchemasPath, JSON.stringify(templates, null, 2));

    return res.status(200).json({ message: 'Template saved successfully.' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
