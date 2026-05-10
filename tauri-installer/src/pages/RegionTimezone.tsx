import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";
import { useInstallerStore } from "../store/installer";
import { getRegions, getTimezones } from "../tauri/commands";

export default function RegionTimezone() {
  const { region, timezone, setRegion, setTimezone, nextStep } = useInstallerStore();

  const [regions, setRegions] = useState<string[]>([]);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingTimezones, setLoadingTimezones] = useState(false);
  const [errors, setErrors] = useState<{ region?: string; timezone?: string }>({});

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .finally(() => setLoadingRegions(false));
  }, []);

  useEffect(() => {
    if (!region) {
      setTimezones([]);
      return;
    }
    setLoadingTimezones(true);
    setTimezone("");
    getTimezones(region)
      .then(setTimezones)
      .finally(() => setLoadingTimezones(false));
  }, [region, setTimezone]);

  const handleNext = () => {
    const errs: typeof errors = {};
    if (!region) errs.region = "Please select a region.";
    if (!timezone) errs.timezone = "Please select a timezone.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    nextStep();
  };

  return (
    <Layout
      icon={<GlobeIcon />}
      title="Region & Timezone"
      subtitle="Choose your geographic region and local timezone for accurate time sync."
      footer={<Footer onNext={handleNext} nextDisabled={!region || !timezone} />}
    >
      <div className="form-group">
        <div className="form-label">Region</div>
        <SearchableSelect
          options={regions}
          value={region}
          onChange={(v) => { setRegion(v); setErrors((e) => ({ ...e, region: undefined })); }}
          placeholder="Select a region..."
          searchPlaceholder="Search regions..."
          loading={loadingRegions}
        />
        {errors.region && <div className="form-error">{errors.region}</div>}
      </div>

      <div className="form-group">
        <div className="form-label">Timezone</div>
        {!region ? (
          <div className="text-muted" style={{ padding: "10px 0" }}>
            Select a region first to see available timezones.
          </div>
        ) : (
          <>
            <SearchableSelect
              options={timezones}
              value={timezone}
              onChange={(v) => { setTimezone(v); setErrors((e) => ({ ...e, timezone: undefined })); }}
              placeholder="Select a timezone..."
              searchPlaceholder="Search timezones..."
              loading={loadingTimezones}
            />
            {errors.timezone && <div className="form-error">{errors.timezone}</div>}
          </>
        )}
      </div>

      {region && timezone && (
        <div
          style={{
            marginTop: 8,
            padding: "12px 16px",
            background: "var(--chip-bg)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 13.5,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>🕐</span>
          <span>
            Selected timezone: <strong>{region}/{timezone}</strong>
          </span>
        </div>
      )}
    </Layout>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
