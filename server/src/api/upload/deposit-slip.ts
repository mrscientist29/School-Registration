import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return !!mimetype?.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);

    if (!files.depositSlip) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.depositSlip[0];
    
    // Generate unique filename
    const ext = path.extname(file.originalFilename || '');
    const filename = `${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/deposit-slips');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filepath = path.join(uploadDir, filename);
    
    // Move file to permanent location
    await fs.promises.rename(file.filepath, filepath);
    
    // Return file URL
    const fileUrl = `/uploads/deposit-slips/${filename}`;
    
    return res.status(200).json({ url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    if (err.message.includes('maxFileSize exceeded')) {
      return res.status(413).json({ error: 'File size exceeds 5MB limit' });
    }
    if (err.message.includes('unexpected file type')) {
      return res.status(415).json({ error: 'Only image files are allowed' });
    }
    return res.status(500).json({ error: 'Failed to process upload' });
  }
}
