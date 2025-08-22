// Biblioteca de avatares actualizada. Cada entrada apunta a un SVG en /public/avatars.
// Solo los avatares disponibles en la carpeta.

export const AVATARS = [
  { id: 'nidea', label: 'Nidea', src: '/avatars/avatar-04-nidea.svg' },
  { id: 'bmo', label: 'BMO', src: '/avatars/avatar-05_bmo.svg' },
  { id: 'cheburashka', label: 'Cheburashka', src: '/avatars/avatar-06-cheburashka.svg' },
  { id: 'darthvader', label: 'Darth Vader', src: '/avatars/avatar-07-darth-vader.svg' },
];

export function preloadAvatars() {
  return AVATARS.map(a => {
    const img = new Image();
    img.src = a.src;
    a.image = img;
    return img;
  });
}
