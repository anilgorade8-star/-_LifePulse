module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { lat, lon, radius = 5000 } = req.query || {};

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  try {
    const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});node["healthcare"="hospital"](around:${radius},${lat},${lon});way["healthcare"="hospital"](around:${radius},${lat},${lon});node["amenity"="clinic"](around:${radius},${lat},${lon});way["amenity"="clinic"](around:${radius},${lat},${lon});node["amenity"="doctors"](around:${radius},${lat},${lon});way["amenity"="doctors"](around:${radius},${lat},${lon}););out center;`;

    console.log("Hospital Query:", query);

    let response;
    try {
      response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!response.ok) throw new Error("Primary server failed");
    } catch (e) {
      response = await fetch("https://overpass.kumi.systems/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    }

    if (!response.ok) {
      throw new Error(`Overpass API service unavailable (${response.status})`);
    }

    const data = await response.json();

    if (!data.elements) {
      return res.status(200).json({ count: 0, hospitals: [] });
    }

    const hospitals = data.elements
      .filter((el) => el.tags)
      .map((el) => ({
        id: el.id,
        name: el.tags.name || "Unnamed Hospital",
        lat: el.lat || (el.center ? el.center.lat : null),
        lon: el.lon || (el.center ? el.center.lon : null),
        address:
          el.tags["addr:full"] ||
          el.tags["addr:street"] ||
          el.tags["addr:place"] ||
          "Address not available",
        phone: el.tags.phone || el.tags["contact:phone"] || "Not available",
        type: el.tags.amenity || "hospital",
      }))
      .filter((h) => h.lat !== null && h.lon !== null);

    return res.status(200).json({ count: hospitals.length, hospitals });
  } catch (error) {
    console.error("Error in nearby-hospitals function:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch hospitals", details: error.message });
  }
};
