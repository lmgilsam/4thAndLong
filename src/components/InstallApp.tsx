import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { promptInstall, useInstallMode, type InstallMode } from '../lib/install'

/** GET THE APP: installs straight away where the browser allows it, otherwise shows how. */
export function InstallButton({ className = 'btn btn-ghost' }: { className?: string }) {
  const mode = useInstallMode()
  const [help, setHelp] = useState<InstallMode>(null)
  if (!mode) return null

  const onClick = () => {
    if (mode === 'prompt') void promptInstall()
    else setHelp(mode)
  }

  return (
    <>
      <button className={className} onClick={onClick}>GET THE APP</button>
      {/* Portal: the home buttons animate with a transform, which would trap a fixed-position modal. */}
      {help && createPortal(<InstallHelp mode={help} onClose={() => setHelp(null)} />, document.body)}
    </>
  )
}

function ShareIcon() {
  return (
    <svg className="inline-icon" viewBox="0 0 24 24" aria-label="Share">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11H6v10h12V11h-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  )
}

function InstallHelp({ mode, onClose }: { mode: InstallMode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="install-title">GET THE APP</h2>
        {mode === 'ios-inapp' ? (
          <ol className="htp-steps">
            <li><strong>Open this page in Safari first.</strong> Tap the <b>•••</b> menu and choose <b>Open in Safari</b> (or Open in Browser). Apps like Instagram and TikTok can't add it to your home screen.</li>
            <li>In Safari, tap <ShareIcon /> <b>Share</b>, then <b>Add to Home Screen</b>.</li>
          </ol>
        ) : mode === 'ios' ? (
          <ol className="htp-steps">
            <li>Tap <ShareIcon /> <b>Share</b> in the toolbar. On newer iPhones, tap <b>•••</b> first.</li>
            <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
            <li>Tap <b>Add</b>.</li>
          </ol>
        ) : (
          <ol className="htp-steps">
            <li>Open your browser menu (<b>⋮</b>).</li>
            <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
          </ol>
        )}
        <p className="muted small">4th &amp; Long opens full screen like a real app, right from your home screen, and works even with a bad signal.</p>
        <button className="btn btn-primary" onClick={onClose} autoFocus>GOT IT</button>
      </div>
    </div>
  )
}
