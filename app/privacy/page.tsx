import { Metadata } from 'next'
import { prisma } from "@/lib/database";

export const metadata: Metadata = {
  title: 'Privacy Policy | The Weather & Everything',
  description: 'Learn how we collect, use, and protect your personal information.',
}

export const revalidate = 3600

async function getPrivacyPolicy() {
  try {
    // @ts-ignore: Ignore TypeScript error for setting model
    const setting = await prisma.setting.findUnique({
      where: { key: "privacy_policy" }
    })
    return setting?.value || getDefaultPrivacyPolicy()
  } catch (error) {
    console.error("Error fetching privacy policy:", error)
    return getDefaultPrivacyPolicy()
  }
}

function getDefaultPrivacyPolicy() {
  return `
    <p class="text-sm text-muted-foreground">Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>Information We Collect</h2>
    <p>We collect information you provide directly to us, such as when you create an account, make a donation, volunteer, or contact us for support.</p>

    <h3>Personal Information</h3>
    <ul>
      <li>Name and contact information</li>
      <li>Email address and phone number</li>
      <li>Payment information for donations</li>
      <li>Volunteer application details</li>
    </ul>

    <h3>Automatically Collected Information</h3>
    <ul>
      <li>IP address and location data</li>
      <li>Browser type and version</li>
      <li>Pages visited and time spent</li>
      <li>Device information</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <ul>
      <li>To provide and improve our services</li>
      <li>To communicate with you about our campaigns</li>
      <li>To process donations and volunteer applications</li>
      <li>To send newsletters and updates (with your consent)</li>
      <li>To comply with legal obligations</li>
    </ul>

    <h2>Data Security</h2>
    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

    <h2>Your Rights</h2>
    <ul>
      <li>Access to your personal information</li>
      <li>Correction of inaccurate data</li>
      <li>Erasure of your personal information</li>
      <li>Objection to processing</li>
      <li>Data portability</li>
      <li>Restriction of processing</li>
    </ul>

    <h2>Cookies and Similar Technologies</h2>
    <p>We use cookies and similar technologies to enhance your experience on our website. You can control cookie usage through your browser settings.</p>

    <h2>Third-Party Services</h2>
    <p>We may share your information with trusted third parties who assist us in operating our website, conducting business, or serving our users, provided they agree to maintain confidentiality.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update this Privacy Policy periodically. We will notify you of any material changes through our website or other communication channels.</p>

    <h2>Contact Us</h2>
    <p>If you have questions about this Privacy Policy, please contact us through our official channels.</p>
  `
}

export default async function PrivacyPage() {
  const content = await getPrivacyPolicy()

  return (
    <div className="container py-8 mx-auto prose prose-gray dark:prose-invert max-w-3xl">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
