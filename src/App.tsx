import { Analytics } from '@vercel/analytics/react';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ScrubberWorkspace } from './components/ScrubberWorkspace';

function Mark() {
  return <span className="mark" aria-hidden="true"><i>[</i><b /><i>]</i></span>;
}

export function App() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, [light]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AIscrubber home"><Mark /><span>AIscrubber</span></a>
        <nav aria-label="Primary navigation">
          <a href="#top">Landing</a>
          <a href="#workspace">Workspace</a>
          <button className="icon-button" type="button" onClick={() => setLight((value) => !value)} aria-label={`Use ${light ? 'dark' : 'light'} theme`}>
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a href="https://github.com/Poorvith-M/aiscrubber" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://poorvithmp.com">Poorvith</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">A browser-local identity redaction desk</p>
          <h1 id="page-title">Remove sensitive details before you share text.</h1>
          <p className="hero-copy">Paste a draft, choose what to detect, and replace likely personal details with consistent labels. Your text stays in this browser.</p>
          <a className="primary-link" href="#workspace">Open the workspace <span aria-hidden="true">↓</span></a>
        </section>

        <ScrubberWorkspace />

        <section className="plain-language" aria-labelledby="how-title">
          <div><p className="eyebrow">What it does</p><h2 id="how-title">A useful last check, not a privacy guarantee.</h2></div>
          <div>
            <p>AIscrubber looks for recognisable patterns such as email addresses, phone numbers, IP addresses, URLs, card-like numbers, API keys, and selected identifiers.</p>
            <p>Pattern matching can miss context or flag harmless text. Read the cleaned result before you share it, especially when the source is sensitive.</p>
          </div>
        </section>
      </main>

      <footer>
        <div><Mark /><span>Built by <a href="https://poorvithmp.com">Poorvith M P</a>.</span></div>
        <p>Text processing happens locally. Vercel Analytics collects aggregate site-usage data; it does not receive the text you enter here.</p>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
