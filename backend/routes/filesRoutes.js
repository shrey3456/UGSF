import { Router } from 'express'
import mongoose from 'mongoose'
import { getGridFSBucket } from '../config/gridfsConfig.js'

const router = Router()

async function findInBucket(bucket, _id) {
  if (!bucket) return null
  const files = await bucket.find({ _id }).toArray()
  return files?.[0] || null
}

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'invalid file id' })
    }
    const _id = new mongoose.Types.ObjectId(id)
    const db = mongoose.connection.db

    // Try your configured buckets first, then common fallbacks
    const candidates = []
    try { candidates.push(getGridFSBucket('document')) } catch {}
    try { candidates.push(getGridFSBucket('image')) } catch {}
    // fallbacks if your upload middleware used these names
    candidates.push(new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' }))
    candidates.push(new mongoose.mongo.GridFSBucket(db, { bucketName: 'documents' }))
    candidates.push(new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' }))
    candidates.push(new mongoose.mongo.GridFSBucket(db, { bucketName: 'farmerDocuments' }))
    candidates.push(new mongoose.mongo.GridFSBucket(db, { bucketName: 'profileImages' }))

    let file = null
    let bucket = null
    for (const b of candidates) {
      // skip duplicates/nulls
      if (!b || (bucket && b.options?.bucketName === bucket.options?.bucketName)) continue
      const f = await findInBucket(b, _id)
      if (f) { file = f; bucket = b; break }
    }

    if (!file || !bucket) return res.status(404).json({ error: 'file not found' })

    const contentType = file.contentType || file.metadata?.mimetype || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`)
    res.setHeader('Accept-Ranges', 'bytes')

    const stream = bucket.openDownloadStream(_id)
    stream.on('error', () => res.status(404).end())
    stream.pipe(res)
  } catch (err) {
    console.error('filesRoutes error:', err)
    res.status(500).json({ error: 'failed to stream file' })
  }
})

export default router