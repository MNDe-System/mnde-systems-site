import Calculator from "@/components/Calculator";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MNDe Systems",
  description: "Deterministic control for irreversible execution"
}


export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F2F2F2]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0B0D0F] border-b border-[#262A30]">
        <nav className="max-w-brand mx-auto px-6 py-6 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight">MNDe Systems</div>
          <div className="hidden lg:flex gap-6 text-sm font-medium text-[#B8BDC4]">
            <a href="#what-it-does" className="hover:text-[#F2F2F2]">What it does</a>
            <a href="#where-it-fits" className="hover:text-[#F2F2F2]">Where it fits</a>
            <a href="#products" className="hover:text-[#F2F2F2]">Products</a>
            <a href="#calculator" className="hover:text-[#F2F2F2]">Calculator</a>
            <a href="#proof" className="hover:text-[#F2F2F2]">Proof</a>
            <a href="#security" className="hover:text-[#F2F2F2]">Security</a>
            <a href="#faq" className="hover:text-[#F2F2F2]">FAQ</a>
            <a href="#contact" className="hover:text-[#F2F2F2]">Contact</a>
          </div>
        </nav>
      </header>

      <main className="max-w-brand mx-auto px-6">
        {/* Hero Section */}
        <section className="pt-32 pb-24 border-b border-[#262A30]">
          <h1 className="text-5xl md:text-6xl font-semibold mb-8 max-w-2xl leading-tight">
            Deterministic control for irreversible execution
          </h1>
          <p className="text-xl text-[#B8BDC4] mb-12 max-w-xl leading-relaxed">
            MNDe builds boundaries. Boundaries decide if execution proceeds. Refusal happens before damage, cost, or commitment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <HeroBullet text="Refuse execution by policy" />
            <HeroBullet text="Release only with explicit authorization" />
            <HeroBullet text="Produce audit ready decision receipts" />
            <HeroBullet text="Fail closed under uncertainty" />
          </div>
          <div className="font-mono text-sm border border-[#262A30] p-4 mb-12 inline-block">
            <span className="text-[#6F7680]">Default state:</span> <span className="text-[#D14B4B] font-bold">REFUSE</span>. <span className="text-[#6F7680]">Release requires proof.</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#contact" className="px-8 py-4 border border-[#F2F2F2] text-center font-semibold hover:bg-[#F2F2F2] hover:text-[#0B0D0F] transition-colors">
              Open contact
            </a>
            <a href="#calculator" className="px-8 py-4 border border-[#262A30] text-center font-semibold hover:border-[#6F7680] transition-colors">
              View calculator
            </a>
          </div>
        </section>

        {/* What it does */}
        <section id="what-it-does" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-8">MNDe sits between intent and execution</h2>
          <div className="max-w-2xl text-[#B8BDC4] space-y-4 mb-16 text-lg">
            <p>Systems accept requests. Requests become actions.</p>
            <p>MNDe inserts a boundary.</p>
            <p>The boundary evaluates an intent against policy.</p>
            <p>If policy fails, execution stops.</p>
            <p>If policy passes, release occurs once, then ends.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#262A30] border border-[#262A30]">
            <Card 
              title="Intent in"
              body="A structured intent describes one action. The intent stays stable. Unknown fields fail."
            />
            <Card 
              title="Decision"
              body="Policy evaluates the intent. Output equals allow or refuse. Timeout equals refuse."
            />
            <Card 
              title="Execution out"
              body="Release occurs once. Logs include refusal reason codes or release proof."
            />
          </div>
        </section>

        {/* Where it fits */}
        <section id="where-it-fits" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-4">Deployment points</h2>
          <p className="text-[#B8BDC4] mb-12">Place MNDe at the last safe point before irreversible execution.</p>
          <div className="space-y-px bg-[#262A30] border border-[#262A30]">
            <Row label="Schedulers" description="Control GPU jobs, batch runs, and queue admissions with a refuse first boundary." />
            <Row label="CI and release" description="Block deploys, migrations, and privileged scripts until intent and policy match." />
            <Row label="Robotics and automation" description="Gate motion, actuation, and process start. Refuse on missing preconditions." />
            <Row label="Data movement" description="Gate deletion, export, and irreversible transforms. Require explicit release authority." />
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-12">Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#262A30] border border-[#262A30]">
            <ProductItem 
              name="Orbit"
              purpose="A deterministic intent format for one action."
              bullets={["Fixed schema versioning.", "Cryptographic signing support in spec."]}
              artifact="Intent JSON plus signature."
            />
            <ProductItem 
              name="ARMS"
              purpose="A release authority mechanism with fail closed behavior."
              bullets={["Armed then released lifecycle.", "One time release tokens with expiry."]}
              artifact="Release record with token id."
            />
            <ProductItem 
              name="ACRL"
              purpose="A refusal layer for GPU and compute execution."
              bullets={["Deny execution without budget owner and limits.", "Block idle, oversized, or untagged work."]}
              artifact="Refusal receipt with reason code."
            />
            <ProductItem 
              name="RIP"
              purpose="Receipts and immutable proofs for decisions."
              bullets={["Signed decision receipts.", "Stable reason code taxonomy."]}
              artifact="Receipt bundle, json plus hash chain."
            />
          </div>
        </section>

        {/* Calculator */}
        <section id="calculator" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-4">ACRL calculator</h2>
          <p className="text-[#B8BDC4] mb-12 max-w-xl">Estimate waste eliminated through refusal rules. Outputs align with operators and finance.</p>
          <Calculator />
        </section>

        {/* Proof */}
        <section id="proof" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-4">What you receive</h2>
          <p className="text-[#B8BDC4] mb-12">MNDe produces proofs. Proofs support audits, incidents, and change control.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ProofItem title="Refusal receipt" body="Reason code, policy id, intent hash, timestamp, signer id." />
            <ProofItem title="Release record" body="Release token id, expiry, intent hash, policy id, signer id." />
            <ProofItem title="Change trace" body="Policy version, diff hash, approval ids, activation time." />
          </div>
        </section>

        {/* Security */}
        <section id="security" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-12">Security posture</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
            <SecurityBullet text="Fail closed on parse errors." />
            <SecurityBullet text="Fail closed on timeouts." />
            <SecurityBullet text="No silent policy edits." />
            <SecurityBullet text="Signed policy bundles." />
            <SecurityBullet text="Stable reason code set." />
            <SecurityBullet text="Receipt hashes for tamper evidence." />
            <SecurityBullet text="Minimal data retention by default." />
            <SecurityBullet text="Operator override requires one time signed token." />
          </ul>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 border-b border-[#262A30]">
          <h2 className="text-3xl font-semibold mb-12">FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <FAQItem q="What problem does MNDe solve" a="Irreversible actions run without sufficient checks. MNDe blocks execution until policy passes." />
            <FAQItem q="What changes for operators" a="Operators gain a single boundary. The boundary returns allow or refuse with proof." />
            <FAQItem q="What happens during failure" a="The boundary refuses. Systems stay safe. Recovery uses explicit override tokens." />
            <FAQItem q="How does MNDe reduce cost" a="ACRL refuses waste patterns. Examples include idle allocation, oversized requests, missing ownership, missing limits." />
            <FAQItem q="What data does MNDe store" a="Only intents, decisions, and receipts. Payload content stays out unless policy requires fields." />
            <FAQItem q="How does adoption start" a="Start with one queue or one pipeline. Enforce tags, limits, and ownership. Expand after stable results." />
            <FAQItem q="What proof exists for audit" a="Signed receipts, stable reason codes, policy ids, and intent hashes." />
            <FAQItem q="What stops bypass" a="Place MNDe at the last enforcement point. Track bypass paths. Enforce coverage expansion by policy." />
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-24">
          <h2 className="text-3xl font-semibold mb-4">Contact</h2>
          <p className="text-[#B8BDC4] mb-12 max-w-xl">Describe the boundary. Share the execution point. Provide one sample intent. Request a refusal taxonomy.</p>
          <div className="max-w-2xl">
            <ContactForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262A30] py-12 bg-[#0B0D0F]">
        <div className="max-w-brand mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-lg font-bold">MNDe Systems</div>
            <div className="text-sm text-[#6F7680] mt-1">Deterministic control for irreversible execution</div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-12 text-sm font-mono">
            <div>
              <div className="text-[#6F7680] uppercase tracking-widest text-[10px] mb-1">Email</div>
              <a href="mailto:MNDeproject@proton.me" className="text-[#B8BDC4] hover:text-[#F2F2F2]">MNDeproject@proton.me</a>
            </div>
            <div>
              <div className="text-[#6F7680] uppercase tracking-widest text-[10px] mb-1">Phone</div>
              <a href="tel:2314209108" className="text-[#B8BDC4] hover:text-[#F2F2F2]">231-420-9108</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroBullet({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-1 h-6 bg-[#6F7680] shrink-0" />
      <div className="text-sm font-medium text-[#F2F2F2]">{text}</div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#0B0D0F] p-8">
      <h3 className="text-xl font-semibold mb-4 text-[#F2F2F2]">{title}</h3>
      <p className="text-[#B8BDC4] leading-relaxed">{body}</p>
    </div>
  );
}

function Row({ label, description }: { label: string; description: string }) {
  return (
    <div className="bg-[#0B0D0F] p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start">
      <div className="text-sm font-bold uppercase tracking-wider text-[#6F7680]">{label}</div>
      <div className="md:col-span-2 text-[#B8BDC4] leading-relaxed">{description}</div>
    </div>
  );
}

function ProductItem({ name, purpose, bullets, artifact }: { name: string; purpose: string; bullets: string[]; artifact: string }) {
  return (
    <div className="bg-[#0B0D0F] p-8 space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-[#B8BDC4] italic">{purpose}</p>
      </div>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm text-[#B8BDC4]">
            <span className="text-[#6F7680]">•</span>
            {b}
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-[#262A30] text-xs font-mono">
        <span className="text-[#6F7680]">Output artifact:</span>
        <div className="mt-1 text-[#F2F2F2]">{artifact}</div>
      </div>
    </div>
  );
}

function ProofItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-l-2 border-[#6F7680] pl-4">{title}</h3>
      <p className="text-[#B8BDC4] text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function SecurityBullet({ text }: { text: string }) {
  return (
    <li className="flex gap-4 items-start text-[#B8BDC4]">
      <div className="w-2 h-2 mt-1.5 bg-[#262A30] shrink-0" />
      <span className="text-sm">{text}</span>
    </li>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-[#F2F2F2]">Q: {q}</h4>
      <p className="text-[#B8BDC4] leading-relaxed">A: {a}</p>
    </div>
  );
}
