/**
 * Settings — designs/10-settings.html'in React versiyonu.
 *
 * Sol sekme nav + sağ sticky sections. PATCH /me ile değişiklikler
 * anında kaydedilir; export GET /me/export'ten JSON indirir.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import "@/styles/pages/settings.css";
import { useMe } from "@/hooks/useMe";
import { meApi } from "@/api/endpoints";
import { Icon } from "@/utils/icons";
import type { UserUpdate } from "@/types/api";

const NAV = [
  { id: "profile", label: "Profil", icon: "user" },
  { id: "theme", label: "Görünüm", icon: "moon" },
  { id: "lang", label: "Dil", icon: "globe" },
  { id: "notif", label: "Bildirimler", icon: "bell" },
  { id: "data", label: "Veri", icon: "download" },
];

export default function SettingsPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState("profile");

  // Her PATCH'te /me cache'ini güncelle
  const patchMe = useMutation({
    mutationFn: (payload: UserUpdate) => meApi.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  if (!me) {
    return (
      <>
        <div className="page-head" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26 }}>Ayarlar</h1>
        </div>
        <div className="skel" style={{ height: 200 }} />
      </>
    );
  }

  const exportData = async () => {
    const data = await meApi.get().then(() => fetch("/api/v1/me/export").then((r) => r.json()));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>Ayarlar</h1>
      </div>

      <div className="set-wrap">
        <nav className="set-nav">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={activeSection === n.id ? "on" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(n.id);
                document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <Icon name={n.icon} size={15} strokeWidth={1.8} />
              {n.label}
            </a>
          ))}
        </nav>

        <div className="set-content">
          {/* Profil */}
          <div className="set-sec" id="profile">
            <h2>Profil</h2>
            <div className="sd">Hesap bilgilerin</div>
            <div className="set-card">
              <div className="set-row">
                <div className="prof-avatar">{me.name.charAt(0).toUpperCase()}</div>
                <div className="info">
                  <div className="t">{me.name}</div>
                  <div className="d">
                    Seviye {me.level} · {me.level_name} · {me.xp.toLocaleString("tr-TR")} XP
                  </div>
                </div>
              </div>
              <div className="set-row">
                <div className="info">
                  <div className="t">İsim</div>
                </div>
                <input
                  className="field-sm"
                  defaultValue={me.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== me.name) patchMe.mutate({ name: v });
                  }}
                />
              </div>
              <div className="set-row">
                <div className="info">
                  <div className="t">E-posta</div>
                </div>
                <input className="field-sm" value={me.email} readOnly />
              </div>
            </div>
          </div>

          {/* Görünüm */}
          <div className="set-sec" id="theme">
            <h2>Görünüm</h2>
            <div className="sd">Temayı seç — değişiklik anında uygulanır</div>
            <div className="theme-opts">
              {(["light", "dark", "system"] as const).map((th) => (
                <div
                  key={th}
                  className={`theme-opt ${me.theme === th ? "on" : ""}`}
                  onClick={() => patchMe.mutate({ theme: th })}
                >
                  <div className={`theme-prev prev-${th === "light" ? "light" : th === "dark" ? "dark" : "sys"}`}>
                    <span className="bar" />
                    <span className="dot" />
                  </div>
                  <div className="tl">
                    {th === "light" ? "Açık" : th === "dark" ? "Koyu" : "Sistem"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dil */}
          <div className="set-sec" id="lang">
            <h2>Dil</h2>
            <div className="sd">Uygulama dili</div>
            <div className="set-card">
              <div className="set-row">
                <div className="info">
                  <div className="t">Görüntüleme dili</div>
                  <div className="d">Türkçe / English</div>
                </div>
                <div className="seg-sm">
                  <button
                    type="button"
                    className={me.locale === "tr" ? "on" : ""}
                    onClick={() => patchMe.mutate({ locale: "tr" })}
                  >
                    Türkçe
                  </button>
                  <button
                    type="button"
                    className={me.locale === "en" ? "on" : ""}
                    onClick={() => patchMe.mutate({ locale: "en" })}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bildirimler */}
          <div className="set-sec" id="notif">
            <h2>Bildirimler</h2>
            <div className="sd">Ne zaman ve nasıl hatırlatalım</div>
            <div className="set-card">
              <div className="set-row">
                <div className="info">
                  <div className="t">Günlük hatırlatma</div>
                  <div className="d">Her sabah günü planlama hatırlatıcısı</div>
                </div>
                <input
                  className="time-input"
                  type="time"
                  defaultValue={me.notif_daily_reminder_time.slice(0, 5)}
                  onBlur={(e) =>
                    patchMe.mutate({ notif_daily_reminder_time: e.target.value + ":00" })
                  }
                />
              </div>
              <ToggleRow
                title="İhmal uyarıları"
                desc="Bir alan 7+ gün ihmal edilince"
                value={me.notif_neglect_warnings_enabled}
                onChange={(v) => patchMe.mutate({ notif_neglect_warnings_enabled: v })}
              />
              <ToggleRow
                title="Streak riski"
                desc="Gün bitmeden görev yapmadıysan"
                value={me.notif_streak_risk_enabled}
                onChange={(v) => patchMe.mutate({ notif_streak_risk_enabled: v })}
              />
              <ToggleRow
                title="E-posta özeti"
                desc="Haftalık ilerleme e-postası"
                value={me.notif_email_weekly_enabled}
                onChange={(v) => patchMe.mutate({ notif_email_weekly_enabled: v })}
              />
              <ToggleRow
                title="Push bildirimleri"
                desc="Mobil cihaz bildirimleri"
                value={me.notif_push_enabled}
                onChange={(v) => patchMe.mutate({ notif_push_enabled: v })}
              />
            </div>
          </div>

          {/* Veri */}
          <div className="set-sec" id="data">
            <h2>Veri</h2>
            <div className="sd">Verilerini dışa aktar veya hesabını yönet</div>
            <div className="set-card">
              <div className="set-row">
                <div className="info">
                  <div className="t">Verileri dışa aktar</div>
                  <div className="d">Tüm alanların, görevlerin, hayallerin (JSON)</div>
                </div>
                <button type="button" className="btn sec sm" onClick={exportData}>
                  <Icon name="download" size={13} strokeWidth={1.8} /> İndir
                </button>
              </div>
              <div className="set-row">
                <div className="info">
                  <div className="t" style={{ color: "var(--h-crit-d)" }}>
                    Hesabı sil
                  </div>
                  <div className="d">Bu işlem geri alınamaz</div>
                </div>
                <button type="button" className="btn-danger" disabled>
                  Hesabı sil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="set-row">
      <div className="info">
        <div className="t">{title}</div>
        <div className="d">{desc}</div>
      </div>
      <div
        className={`toggle ${value ? "on" : ""}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
      />
    </div>
  );
}
