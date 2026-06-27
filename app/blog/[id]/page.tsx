import { notFound } from "next/navigation"
import { prisma } from "@/lib/database"
import { PostStatus } from "@prisma/client"
import BlogDetailContent from "@/components/sections/BlogDetailContent"

export const revalidate = 300

export default async function BlogDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const post = await prisma.blogPost.findFirst({
    where: { 
      id: params.id,
      status: PostStatus.PUBLISHED 
    },
    include: { 
      author: { 
        select: { 
          firstName: true, 
          lastName: true 
        } 
      },
      comments: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  })

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <BlogDetailContent post={post} />
    </main>
  )
}
