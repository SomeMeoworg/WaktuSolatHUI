export async function onRequest(context: any) {
  const { request, params } = context;
  const zone = params.zone;
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  let apiUrl = `https://api.waktusolat.app/solat/${zone}`;

  const queryParams = new URLSearchParams();
  if (year) queryParams.append("year", year);
  if (month) queryParams.append("month", month);

  if (queryParams.toString() !== "") {
    apiUrl += `?${queryParams.toString()}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WaktuSolatApp/1.0)",
      },
      cf: {
        cacheTtl: 3600,
        cacheEverything: true,
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `API responded with ${response.status}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    let data: any = await response.json();

    if (data && data.prayerTime && Array.isArray(data.prayerTime)) {
      data.prayerTime = data.prayerTime.map((pt: any) => {
        if (!pt.imsak && pt.fajr) {
          const [hours, minutes] = pt.fajr.split(":").map(Number);
          let totalMins = hours * 60 + minutes - 10;
          if (totalMins < 0) totalMins += 24 * 60;
          const iH = Math.floor(totalMins / 60)
            .toString()
            .padStart(2, "0");
          const iM = (totalMins % 60).toString().padStart(2, "0");
          return { ...pt, imsak: `${iH}:${iM}:00` };
        }
        return pt;
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch prayer times" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
