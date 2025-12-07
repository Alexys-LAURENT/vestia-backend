import { MultipartFile } from '@adonisjs/core/bodyparser'
import fs from 'node:fs/promises'
export default class MediaService {
  async getBase64FromImage(image: MultipartFile) {
    const file = await fs.readFile(image.tmpPath!)
    const base64Image = file.toString('base64')
    return base64Image
  }
}
