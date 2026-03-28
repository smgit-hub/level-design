import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP, KHRMaterialsClearcoat, KHRMaterialsSpecular } from '@gltf-transform/extensions';
import { textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const io = new NodeIO().registerExtensions([EXTTextureWebP, KHRMaterialsClearcoat, KHRMaterialsSpecular]);

console.log('Reading GLB...');
const document = await io.read('public/models/pillar-table-model.glb');

console.log('Converting WebP textures to JPEG...');
await document.transform(
  textureCompress({
    encoder: sharp,
    targetFormat: 'jpeg',
    quality: 92,
  })
);

console.log('Writing GLB...');
await io.write('public/models/pillar-table-model.glb', document);
console.log('Done!');
