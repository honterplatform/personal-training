import { useRef, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { apiBaseURL } from "../lib/api.js";
import { isoToDate } from "../lib/dates.js";

const ANGLES = ["front", "side", "back"];

export default function PhotoCard() {
  const { photos, selectedDate, uploadPhoto, deletePhoto } = useStore();
  const [uploading, setUploading] = useState(false);
  const [angle, setAngle] = useState("front");
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null); // photo object
  const fileRef = useRef(null);

  const recent = [...photos]
    .filter((p) => isoToDate(p.date).getTime() <= isoToDate(selectedDate).getTime())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await uploadPhoto(file, { date: selectedDate, angle, notes: "" });
    } catch (err) {
      setError(err?.message || "upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="photo-card">
      <div className="photo-card-head">
        <div className="photo-card-label">photos</div>
        <div className="photo-card-angle-picker">
          {ANGLES.map((a) => (
            <button
              key={a}
              type="button"
              className={`photo-angle-chip ${angle === a ? "active" : ""}`}
              onClick={() => setAngle(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="photo-card-upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "uploading…" : "+ photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>

      {error && <div className="photo-card-error">{error}</div>}

      {recent.length === 0 ? (
        <div className="photo-card-empty">no progress photos yet</div>
      ) : (
        <div className="photo-strip">
          {recent.map((p) => (
            <button
              key={p._id}
              className="photo-thumb"
              onClick={() => setViewing(p)}
              title={`${p.date} · ${p.angle}`}
            >
              <img src={photoURL(p)} alt={`${p.angle} ${p.date}`} loading="lazy" />
              <span className="photo-thumb-meta">
                <span className="photo-thumb-angle">{p.angle}</span>
                <span className="photo-thumb-date">{shortDate(p.date)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <PhotoLightbox
          photo={viewing}
          onClose={() => setViewing(null)}
          onDelete={async () => {
            await deletePhoto(viewing._id);
            setViewing(null);
          }}
        />
      )}
    </section>
  );
}

function PhotoLightbox({ photo, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="photo-lightbox" onClick={onClose}>
      <div className="photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img src={photoURL(photo)} alt={`${photo.angle} ${photo.date}`} />
        <div className="photo-lightbox-meta">
          <span>{photo.date}</span>
          <span>·</span>
          <span>{photo.angle}</span>
          {photo.notes && <span className="photo-lightbox-notes">— {photo.notes}</span>}
        </div>
        <div className="photo-lightbox-actions">
          {!confirming ? (
            <>
              <button className="photo-lightbox-close" onClick={onClose}>close</button>
              <button className="photo-lightbox-del" onClick={() => setConfirming(true)}>delete</button>
            </>
          ) : (
            <>
              <button className="photo-lightbox-close" onClick={() => setConfirming(false)}>keep</button>
              <button className="photo-lightbox-del confirm" onClick={onDelete}>delete forever</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function photoURL(p) {
  return `${apiBaseURL}${p.url}`;
}

function shortDate(iso) {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}
