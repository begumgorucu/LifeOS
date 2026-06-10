/**
 * Dashboard'da Daily Pool önerilerini gösteren kart.
 *
 * Her satır bir öneri: checkbox + isim + alan/skor. Checkbox tıklanırsa
 * task complete tetiklenir. Pool boşsa "Henüz oluşturulmadı, Daily Pool'a
 * git" CTA'sı.
 */
import { Link } from "react-router-dom";
import { useDailyPool, useGeneratePool } from "@/hooks/useDailyPool";
import { useCompleteTask } from "@/hooks/useTasks";
import { Icon } from "@/utils/icons";

export function PoolPreview() {
  const { data, isLoading } = useDailyPool();
  const generate = useGeneratePool();
  const complete = useCompleteTask();

  const items = data?.items ?? [];
  const doneCount = items.filter((i) => i.task.status === "done").length;

  if (isLoading) {
    return (
      <div className="focus-card">
        <div className="fc-top">
          <div className="l">
            <div className="sun"><Icon name="pool" size={19} strokeWidth={1.7} /></div>
            <div>
              <h3>Bugünün havuzu</h3>
              <p>Yükleniyor…</p>
            </div>
          </div>
        </div>
        <div className="fc-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ height: 38, margin: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="focus-card">
      <div className="fc-top">
        <div className="l">
          <div className="sun"><Icon name="pool" size={19} strokeWidth={1.7} /></div>
          <div>
            <h3>Bugünün havuzu</h3>
            <p>Sabah ritüeli — {items.length || "henüz boş"}{items.length > 0 ? " görev" : ""}</p>
          </div>
        </div>
        <Link to="/pool" className="btn sec sm">
          Tümünü gör <Icon name="arrow" size={13} strokeWidth={2} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--ink-3)" }}>
          <p style={{ marginBottom: 14, fontSize: 13.5 }}>
            Bugün için henüz öneri yok.
          </p>
          <button
            type="button"
            className="btn pri sm"
            onClick={() => generate.mutate(false)}
            disabled={generate.isPending}
          >
            {generate.isPending ? "Hazırlanıyor…" : "Önerileri oluştur"}
          </button>
        </div>
      ) : (
        <>
          <div className="fc-list">
            {items.map((it) => {
              const done = it.task.status === "done";
              return (
                <div className="frow" key={it.id}>
                  <button
                    type="button"
                    className={`fcheck ${done ? "done" : ""}`}
                    onClick={() => {
                      if (!done) complete.mutate(it.task.id);
                    }}
                    aria-label="Tamamla"
                  >
                    <Icon name="check" size={12} strokeWidth={3} />
                  </button>
                  <span className="ft" style={done ? { textDecoration: "line-through", color: "var(--ink-3)" } : undefined}>
                    {it.task.title}
                  </span>
                  <span className="fa">{it.task.area.icon ?? "🌿"}</span>
                </div>
              );
            })}
          </div>
          <div className="fc-foot">
            <span className="prog">
              <b>{doneCount}/{items.length}</b> tamamlandı
            </span>
            <Link to="/pool" style={{ color: "var(--iris)", fontSize: 13, textDecoration: "none" }}>
              Detay →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
