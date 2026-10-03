import { FavoritesEditor } from '../../features/favorites-editor/FavoritesEditor'

// A labelled section, not a fieldset: a fieldset legend overlaps the controls under it
// when the sheet scrolls on a phone and swallows their taps.
export function FavoritesSettingsSection() {
  return (
    <section className="sheet__section" aria-labelledby="favorites-editor-title">
      <h3 id="favorites-editor-title">Edit favorites</h3>
      <FavoritesEditor />
    </section>
  )
}
