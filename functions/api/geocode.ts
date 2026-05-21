export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: "Missing lat/lng" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const nominatimPromise = fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`,
      {
        headers: {
          "User-Agent": "WaktuSolatApp/1.0 (Contact: a78477308@gmail.com)",
        },
      },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const bdcPromise = fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const [osmData, bdcData] = await Promise.all([
      nominatimPromise,
      bdcPromise,
    ]);

    if (!osmData && !bdcData) {
      return new Response(JSON.stringify({ error: "Geocode APIs failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ osm: osmData, bdc: bdcData }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400" // Cache for 24 hours
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch geocode" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
