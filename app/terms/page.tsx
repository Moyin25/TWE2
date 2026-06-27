import { Metadata } from 'next'
import { prisma } from "@/lib/database";

export const metadata: Metadata = {
  title: 'Terms of Service | The Weather & Everything',
  description: 'Read our terms of service and usage guidelines.',
}

export const revalidate = 3600

async function getTermsOfService() {
  try {
    // @ts-ignore: Ignore TypeScript error for setting model
    const setting = await prisma.setting.findUnique({
      where: { key: "terms_of_service" }
    })
    return setting?.value || getDefaultTermsOfService()
  } catch (error) {
    console.error("Error fetching terms of service:", error)
    return getDefaultTermsOfService()
  }
}

function getDefaultTermsOfService() {
  return `
    <p class="text-sm text-muted-foreground">Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>Acceptance of Terms</h2>
    <p>By accessing and using The Weather & Everything website and services, you accept and agree to be bound by the terms and provision of this agreement.</p>

    <h2>Use License</h2>
    <p>Permission is granted to temporarily access the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>

    <h3>Restrictions</h3>
    <ul>
      <li>Modify or copy the materials</li>
      <li>Use the materials for any commercial purpose</li>
      <li>Attempt to decompile or reverse engineer any software</li>
      <li>Remove any copyright or other proprietary notations</li>
    </ul>

    <h2>User Responsibilities</h2>
    <p>Users are responsible for:</p>
    <ul>
      <li>Providing accurate and complete information</li>
      <li>Maintaining the security of their account</li>
      <li>Complying with applicable laws and regulations</li>
      <li>Respecting the rights of other users</li>
    </ul>

    <h2>Content</h2>
    <p>Our website may contain user-generated content. We do not endorse or guarantee the accuracy of such content. Users are responsible for the content they post.</p>

    <h2>Disclaimer of Warranties</h2>
    <p>The materials on our website are provided on an "as is" basis. We make no warranties, expressed or implied, about the suitability or accuracy of the information.</p>

    <h2>Limitation of Liability</h2>
    <p>In no event shall The Weather & Everything, nor its directors, employees, or agents, be liable for any loss, damage, or injury arising from the use of these materials.</p>

    <h2>Changes to Terms</h2>
    <p>We reserve the right to modify these terms at any time. Continued use of the site constitutes acceptance of the revised terms.</p>

    <h2>Governing Law</h2>
    <p>This agreement shall be governed by the laws of Nigeria without consideration of conflict of law principles.</p>
  `
}

export default async function TermsPage() {
  const content = await getTermsOfService()

  return (
    <div className="container py-8 mx-auto prose prose-gray dark:prose-invert max-w-3xl">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
