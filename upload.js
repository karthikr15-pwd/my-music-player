import { put } from '@vercel/blob';
import { MongoClient } from 'mongodb';

export default async function handler(request, response) {
  // Only allow POST requests (sending data)
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const filename = request.query.filename || 'unnamed_song.mp3';

  try {
    // 1. Upload the actual MP3 file to Vercel Blob storage
    // This uses the BLOB_READ_WRITE_TOKEN you set up in Vercel
    const blob = await put(filename, request, {
      access: 'public',
    });

    // 2. Connect to your MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('music_app');

    // 3. Save the "link" to the song in your database
    const songData = {
      name: filename,
      url: blob.url, // This is the link to play the song
      uploadedAt: new Date(),
    };

    await db.collection('songs').insertOne(songData);
    await client.close();

    // 4. Tell the front-end everything worked!
    return response.status(200).json(songData);
    
  } catch (error) {
    console.error("Upload Error:", error);
    return response.status(500).json({ error: error.message });
  }
}