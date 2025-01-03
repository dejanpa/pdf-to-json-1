import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import {
  my_custom_template,
  restaurant_schema_with_menu,
  restaurant_schema_without_menu,
  real_estate_brochure_schema,
  invoice_schema,
} from '../../data/sampleSchemas';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Učitavanje statičkih šema iz `sampleSchemas.ts`
    const staticTemplates = {
      my_custom_template,
      restaurant_schema_with_menu,
      restaurant_schema_without_menu,
      real_estate_brochure_schema,
      invoice_schema,
    };

    // Učitavanje dinamičkih šema iz `dynamicSchemas.json`
    const dynamicSchemasPath = path.join(process.cwd(), 'data', 'dynamicSchemas.json');
    let dynamicTemplates = {};

    if (fs.existsSync(dynamicSchemasPath)) {
      const fileContent = fs.readFileSync(dynamicSchemasPath, 'utf-8');
      if (fileContent.trim()) {
        dynamicTemplates = JSON.parse(fileContent);
      }
    }

    // Kombinovanje statičkih i dinamičkih šema
    const templates = { ...staticTemplates, ...dynamicTemplates };

    return res.status(200).json(templates);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
