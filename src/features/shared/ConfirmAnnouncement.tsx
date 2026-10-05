// A changing button name isn't announced on its own.
export function ConfirmAnnouncement({ text }: { text: string }) {
  return (
    <span className="visually-hidden" role="status">
      {text}
    </span>
  )
}
