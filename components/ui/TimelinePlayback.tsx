"use client";

export function TimelinePlayback({ events }: { events: string[] }) {
  return (
    <div className="timeline-playback">
      {events.map((event) => (
        <div key={event} className="timeline-playback__item">
          {event}
        </div>
      ))}
    </div>
  );
}
