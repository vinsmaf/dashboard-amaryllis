import { useState, useEffect } from "react";

const CACHE_KEY = "geo_v1";

export function useGeo() {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) { setGeo(JSON.parse(cached)); return; }
    } catch (_) {}

    fetch("/api/geo")
      .then(r => r.json())
      .then(data => {
        setGeo(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
      })
      .catch(() => {});
  }, []);

  return geo;
}
