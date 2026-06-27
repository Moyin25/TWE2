import GalleryHero from "@/components/sections/GalleryHero";
import GallerySectionClient, { GalleryImageItem } from "@/components/sections/GallerySectionClient";
import { prisma } from "@/lib/database";

export const revalidate = 300;

export default async function GalleryPage() {
  let images: any[] = [];
  
  try {
    images = await prisma.galleryImage.findMany({ 
      orderBy: { createdAt: "desc" }, 
      take: 24 
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    // Return an empty array if the table doesn't exist or there's another error
    images = [];
  }
  
  const mapped: GalleryImageItem[] = images.map(i => ({ 
    id: i.id, 
    url: i.url, 
    title: i.title, 
    category: i.category, 
    takenAt: i.takenAt?.toISOString() || null, 
    location: i.location 
  }));
  
  return (
    <main className="min-h-screen">
      <GalleryHero />
      <GallerySectionClient images={mapped} />
    </main>
  );
}
