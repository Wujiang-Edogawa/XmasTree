
// Helper to load local default photos
export const loadDefaultPhotos = () => {
  const photosGlob = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });

  return Object.entries(photosGlob)
    .map(([path, url]) => {
      const fileName = path.split('/').pop() || '';
      return { fileName, url: url as string };
    })
    .filter((item) => Boolean(item.fileName))
    .sort((a, b) => {
      const aNum = Number.parseInt(a.fileName.split('.')[0], 10);
      const bNum = Number.parseInt(b.fileName.split('.')[0], 10);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);
      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' });
    });
    // Returns array of { fileName, url }
};
